/// <reference path="../worker-configuration.d.ts" />
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { PublicArticleId } from './domain/models/article'
import { createDbClient } from './infrastructure/database'
import { ArticleIdGeneratorImpl } from './infrastructure/id/article-id-generator-impl'
import { DrizzleArticleRepository } from './infrastructure/repositories/drizzle-article-repository'
import { DrizzleTagRepository } from './infrastructure/repositories/drizzle-tag-repository'
import { R2BodyStorage } from './infrastructure/storage/r2-body-storage'
import {
  toArticleDetailDto,
  toArticleSummaryDto,
} from './presentation/dto/article-dto'
import { createArticle } from './use-cases/create-article'
import { getArticle } from './use-cases/get-article'
import { listArticles } from './use-cases/list-articles'
import { publishArticle } from './use-cases/publish-article'
import { updateArticleTags } from './use-cases/update-article-tags'

type Bindings = {
  DB: D1Database
  ARTICLE_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('/*', cors())

const tagNameSchema = z
  .string()
  .min(1, 'タグ名は空にできません')
  .max(30, 'タグ名は30文字以内にしてください')

const createArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内にしてください'),
  body: z.string(),
  tags: z.array(tagNameSchema).optional().default([]),
})

const updateTagsSchema = z.object({
  tags: z.array(tagNameSchema),
})

const routes = app
  .get('/api/hello', (c) => {
    return c.json({
      message: 'Hello World from Hono & Cloudflare Workers!',
    })
  })
  .get('/api/articles', async (c) => {
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)
    const tagRepository = new DrizzleTagRepository(db)
    const articles = await listArticles(repository)

    // 全記事のタグを一括取得
    const articleIds = articles.map((a) => a.id)
    const tagsMap = await tagRepository.findByArticleIds(articleIds)

    return c.json(
      articles.map((article) =>
        toArticleSummaryDto(article, tagsMap.get(article.id) ?? []),
      ),
    )
  })
  .get('/api/articles/:publicId', async (c) => {
    const publicId = PublicArticleId(c.req.param('publicId'))
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)
    const tagRepository = new DrizzleTagRepository(db)
    const bodyStorage = new R2BodyStorage(c.env.ARTICLE_BUCKET)

    const result = await getArticle(publicId, { repository, bodyStorage })

    switch (result.status) {
      case 'found': {
        const tags = await tagRepository.findByArticleId(result.article.id)
        return c.json(toArticleDetailDto(result.article, result.body, tags))
      }
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
    const tagRepository = new DrizzleTagRepository(db)
    const bodyStorage = new R2BodyStorage(c.env.ARTICLE_BUCKET)
    const idGenerator = new ArticleIdGeneratorImpl()

    const result = await createArticle(input, {
      repository,
      bodyStorage,
      idGenerator,
      tagRepository,
      now: () => new Date().toISOString(),
    })

    switch (result.status) {
      case 'created':
        return c.json(toArticleSummaryDto(result.article, result.tags), 201)
      case 'validation_error':
        return c.json({ error: result.message }, 400)
    }
  })
  .patch('/api/articles/:publicId/publish', async (c) => {
    const publicId = PublicArticleId(c.req.param('publicId'))
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)
    const tagRepository = new DrizzleTagRepository(db)

    const result = await publishArticle(publicId, {
      repository,
      now: () => new Date().toISOString(),
    })

    switch (result.status) {
      case 'published': {
        const tags = await tagRepository.findByArticleId(result.article.id)
        return c.json(toArticleSummaryDto(result.article, tags))
      }
      case 'not_found':
        return c.json({ error: '記事が見つかりません' }, 404)
      case 'already_published':
        return c.json({ error: 'すでに公開されています' }, 400)
    }
  })
  .patch(
    '/api/articles/:publicId/tags',
    zValidator('json', updateTagsSchema),
    async (c) => {
      const publicId = PublicArticleId(c.req.param('publicId'))
      const { tags } = c.req.valid('json')
      const db = createDbClient(c.env.DB)
      const articleRepository = new DrizzleArticleRepository(db)
      const tagRepository = new DrizzleTagRepository(db)
      const idGenerator = new ArticleIdGeneratorImpl()

      const result = await updateArticleTags(publicId, tags, {
        articleRepository,
        tagRepository,
        generateTagId: () => idGenerator.generateTagId(),
      })

      switch (result.status) {
        case 'updated':
          return c.json({
            tags: result.tags.map((t) => String(t.name)),
          })
        case 'not_found':
          return c.json({ error: '記事が見つかりません' }, 404)
        case 'validation_error':
          return c.json({ error: result.message }, 400)
      }
    },
  )

export type AppType = typeof routes

export default app
