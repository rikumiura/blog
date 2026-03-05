import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import type { PublicArticleId } from './domain/models/article'
import { createDbClient } from './infrastructure/database'
import { ArticleIdGeneratorImpl } from './infrastructure/id/article-id-generator-impl'
import { DrizzleArticleRepository } from './infrastructure/repositories/drizzle-article-repository'
import { DrizzleCompanyRepository } from './infrastructure/repositories/drizzle-company-repository'
import { R2BodyStorage } from './infrastructure/storage/r2-body-storage'
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
    return c.json(result)
  })
  .get('/api/articles/:publicId', async (c) => {
    const publicId = c.req.param('publicId') as PublicArticleId
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)

    try {
      const article = await getArticle(publicId, repository)
      return c.json(article)
    } catch (error) {
      if (error instanceof Error && error.message === '記事が見つかりません') {
        return c.json({ error: error.message }, 404)
      }
      throw error
    }
  })
  .post('/api/articles', zValidator('json', createArticleSchema), async (c) => {
    const input = c.req.valid('json')
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)
    const bodyStorage = new R2BodyStorage(c.env.ARTICLE_BUCKET)
    const idGenerator = new ArticleIdGeneratorImpl()

    try {
      const article = await createArticle(input, {
        repository,
        bodyStorage,
        idGenerator,
      })
      return c.json(article, 201)
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400)
      }
      throw error
    }
  })
  .patch('/api/articles/:publicId/publish', async (c) => {
    const publicId = c.req.param('publicId') as PublicArticleId
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)

    try {
      const article = await publishArticle(publicId, repository)
      return c.json(article)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === '記事が見つかりません') {
          return c.json({ error: error.message }, 404)
        }
        return c.json({ error: error.message }, 400)
      }
      throw error
    }
  })

export type AppType = typeof routes

export default app
