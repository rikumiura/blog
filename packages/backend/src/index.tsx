import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { PublicArticleId } from './domain/models/article'
import { createDbClient } from './infrastructure/database'
import { ArticleIdGeneratorImpl } from './infrastructure/id/article-id-generator-impl'
import { DrizzleArticleRepository } from './infrastructure/repositories/drizzle-article-repository'
import { DrizzleCompanyRepository } from './infrastructure/repositories/drizzle-company-repository'
import { R2BodyStorage } from './infrastructure/storage/r2-body-storage'
import {
  toArticleDetailDto,
  toArticleSummaryDto,
} from './presentation/dto/article-dto'
import { createArticle } from './use-cases/create-article'
import { getArticle } from './use-cases/get-article'
import { listArticles } from './use-cases/list-articles'
import { listCompanies } from './use-cases/list-companies'
import { publishArticle } from './use-cases/publish-article'

type Bindings = {
  DB: D1Database
  ARTICLE_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/*', cors())

const createArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内にしてください'),
  body: z.string(),
})

const routes = app
  .get('/api/hello', (c) => {
    return c.json({
      message: 'Hello World from Hono & Cloudflare Workers!',
    })
  })
  .get('/api/companies', async (c) => {
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleCompanyRepository(db)
    const result = await listCompanies(repository)
    return c.json(result)
  })
  .get('/api/articles', async (c) => {
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)
    const result = await listArticles(repository)
    return c.json(result.map(toArticleSummaryDto))
  })
  .get('/api/articles/:publicId', async (c) => {
    const publicId = PublicArticleId(c.req.param('publicId'))
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)
    const bodyStorage = new R2BodyStorage(c.env.ARTICLE_BUCKET)

    const result = await getArticle(publicId, { repository, bodyStorage })

    switch (result.status) {
      case 'found':
        return c.json(toArticleDetailDto(result.article, result.body))
      case 'not_found':
        return c.json({ error: '記事が見つかりません' }, 404)
      case 'body_not_found':
        return c.json({ error: '記事本文が見つかりません' }, 404)
    }
  })
  .post('/api/articles', zValidator('json', createArticleSchema), async (c) => {
    const input = c.req.valid('json')
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)
    const bodyStorage = new R2BodyStorage(c.env.ARTICLE_BUCKET)
    const idGenerator = new ArticleIdGeneratorImpl()

    const result = await createArticle(input, {
      repository,
      bodyStorage,
      idGenerator,
      now: () => new Date().toISOString(),
    })

    switch (result.status) {
      case 'created':
        return c.json(toArticleSummaryDto(result.article), 201)
      case 'validation_error':
        return c.json({ error: result.message }, 400)
    }
  })
  .patch('/api/articles/:publicId/publish', async (c) => {
    const publicId = PublicArticleId(c.req.param('publicId'))
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)

    const result = await publishArticle(publicId, {
      repository,
      now: () => new Date().toISOString(),
    })

    switch (result.status) {
      case 'published':
        return c.json(toArticleSummaryDto(result.article))
      case 'not_found':
        return c.json({ error: '記事が見つかりません' }, 404)
      case 'already_published':
        return c.json({ error: 'すでに公開されています' }, 400)
    }
  })

export type AppType = typeof routes

export default app
