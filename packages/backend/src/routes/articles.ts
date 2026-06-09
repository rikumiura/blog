import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { PublicArticleId } from '../domain/models/article'
import type { AppEnv } from '../env'
import { createDbClient } from '../infrastructure/database'
import { ArticleIdGeneratorImpl } from '../infrastructure/id/article-id-generator-impl'
import { DrizzleArticleRepository } from '../infrastructure/repositories/drizzle-article-repository'
import { DrizzleBodyKeyDeletionQueue } from '../infrastructure/repositories/drizzle-body-key-deletion-queue'
import { DrizzleTagRepository } from '../infrastructure/repositories/drizzle-tag-repository'
import { R2BodyStorage } from '../infrastructure/storage/r2-body-storage'
import {
  toArticleDetailDto,
  toArticleSummaryDto,
  toPaginatedArticlesDto,
} from '../presentation/dto/article-dto'
import {
  createArticleSchema,
  paginationSchema,
  publicIdParamSchema,
  scheduleSchema,
  updateArticleSchema,
  updateTagsSchema,
} from '../presentation/schemas/article-schemas'
import { cancelSchedule } from '../use-cases/cancel-schedule'
import { createArticle } from '../use-cases/create-article'
import { deleteArticle } from '../use-cases/delete-article'
import { getArticle } from '../use-cases/get-article'
import { listArticlesPaginated } from '../use-cases/list-articles'
import { publishArticle } from '../use-cases/publish-article'
import { scheduleArticle } from '../use-cases/schedule-article'
import { updateArticle } from '../use-cases/update-article'
import { updateArticleTags } from '../use-cases/update-article-tags'

export const articleRoutes = new Hono<AppEnv>()
  .get('/', zValidator('query', paginationSchema), async (c) => {
    const { page, limit, tags } = c.req.valid('query')
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)
    const tagRepository = new DrizzleTagRepository(db)
    const paginatedResult = await listArticlesPaginated(repository, {
      page,
      limit,
      ...(tags ? { tags } : {}),
    })
    return c.json(
      await toPaginatedArticlesDto(paginatedResult, page, limit, tagRepository),
    )
  })
  .get('/:publicId', zValidator('param', publicIdParamSchema), async (c) => {
    const publicId = PublicArticleId(c.req.valid('param').publicId)
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
  .post('/', zValidator('json', createArticleSchema), async (c) => {
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
  .patch(
    '/:publicId',
    zValidator('param', publicIdParamSchema),
    zValidator('json', updateArticleSchema),
    async (c) => {
      const publicId = PublicArticleId(c.req.valid('param').publicId)
      const rawInput = c.req.valid('json')
      const input: { title?: string; body?: string; tags?: string[] } = {
        ...(rawInput.title !== undefined ? { title: rawInput.title } : {}),
        ...(rawInput.body !== undefined ? { body: rawInput.body } : {}),
        ...(rawInput.tags !== undefined ? { tags: rawInput.tags } : {}),
      }
      const db = createDbClient(c.env.DB)
      const repository = new DrizzleArticleRepository(db)
      const tagRepository = new DrizzleTagRepository(db)
      const bodyStorage = new R2BodyStorage(c.env.ARTICLE_BUCKET)
      const idGenerator = new ArticleIdGeneratorImpl()
      const bodyKeyDeletionQueue = new DrizzleBodyKeyDeletionQueue(db)

      const result = await updateArticle(publicId, input, {
        repository,
        bodyStorage,
        tagRepository,
        bodyKeyDeletionQueue,
        generateTagId: () => idGenerator.generateTagId(),
        generateBodyKey: () => idGenerator.generateBodyKey(),
        now: () => new Date().toISOString(),
        waitUntil: (p) => c.executionCtx.waitUntil(p),
      })

      switch (result.status) {
        case 'updated':
          return c.json(
            toArticleDetailDto(result.article, result.body, result.tags),
          )
        case 'not_found':
          return c.json({ error: '記事が見つかりません' }, 404)
        case 'body_not_found':
          return c.json({ error: '記事本文が見つかりません' }, 404)
        case 'validation_error':
          return c.json({ error: result.message }, 400)
        case 'conflict':
          return c.json(
            { error: '並行する本文更新が競合しました。再度お試しください。' },
            409,
          )
      }
    },
  )
  .patch(
    '/:publicId/publish',
    zValidator('param', publicIdParamSchema),
    async (c) => {
      const publicId = PublicArticleId(c.req.valid('param').publicId)
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
        case 'conflict':
          return c.json(
            {
              error:
                '競合が発生しました。最新の状態を取得してから再試行してください',
            },
            409,
          )
      }
    },
  )
  .patch(
    '/:publicId/schedule',
    zValidator('param', publicIdParamSchema),
    zValidator('json', scheduleSchema),
    async (c) => {
      const publicId = PublicArticleId(c.req.valid('param').publicId)
      const { scheduledAt } = c.req.valid('json')
      const db = createDbClient(c.env.DB)
      const repository = new DrizzleArticleRepository(db)
      const tagRepository = new DrizzleTagRepository(db)

      const result = await scheduleArticle(publicId, scheduledAt, {
        repository,
        now: () => new Date().toISOString(),
      })

      switch (result.status) {
        case 'scheduled': {
          const tags = await tagRepository.findByArticleId(result.article.id)
          return c.json(toArticleSummaryDto(result.article, tags))
        }
        case 'not_found':
          return c.json({ error: '記事が見つかりません' }, 404)
        case 'not_draft':
          return c.json({ error: '下書き記事のみ予約公開を設定できます' }, 400)
        case 'validation_error':
          return c.json({ error: result.message }, 400)
        case 'conflict':
          return c.json(
            {
              error:
                '競合が発生しました。最新の状態を取得してから再試行してください',
            },
            409,
          )
      }
    },
  )
  .patch(
    '/:publicId/cancel-schedule',
    zValidator('param', publicIdParamSchema),
    async (c) => {
      const publicId = PublicArticleId(c.req.valid('param').publicId)
      const db = createDbClient(c.env.DB)
      const repository = new DrizzleArticleRepository(db)
      const tagRepository = new DrizzleTagRepository(db)

      const result = await cancelSchedule(publicId, {
        repository,
        now: () => new Date().toISOString(),
      })

      switch (result.status) {
        case 'cancelled': {
          const tags = await tagRepository.findByArticleId(result.article.id)
          return c.json(toArticleSummaryDto(result.article, tags))
        }
        case 'not_found':
          return c.json({ error: '記事が見つかりません' }, 404)
        case 'not_scheduled':
          return c.json({ error: '予約公開されていません' }, 400)
        case 'conflict':
          return c.json(
            {
              error:
                '競合が発生しました。最新の状態を取得してから再試行してください',
            },
            409,
          )
      }
    },
  )
  .patch(
    '/:publicId/tags',
    zValidator('param', publicIdParamSchema),
    zValidator('json', updateTagsSchema),
    async (c) => {
      const publicId = PublicArticleId(c.req.valid('param').publicId)
      const { tags } = c.req.valid('json')
      const db = createDbClient(c.env.DB)
      const articleRepository = new DrizzleArticleRepository(db)
      const tagRepository = new DrizzleTagRepository(db)
      const idGenerator = new ArticleIdGeneratorImpl()

      const result = await updateArticleTags(publicId, tags, {
        articleRepository,
        tagRepository,
        generateTagId: () => idGenerator.generateTagId(),
        now: () => new Date().toISOString(),
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
  .delete('/:publicId', zValidator('param', publicIdParamSchema), async (c) => {
    const publicId = PublicArticleId(c.req.valid('param').publicId)
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)
    const bodyStorage = new R2BodyStorage(c.env.ARTICLE_BUCKET)

    const result = await deleteArticle(publicId, {
      repository,
      bodyStorage,
      now: () => new Date().toISOString(),
      waitUntil: (p) => c.executionCtx.waitUntil(p),
    })

    switch (result.status) {
      case 'deleted':
        return c.body(null, 204)
      case 'not_found':
        return c.json({ error: '記事が見つかりません' }, 404)
    }
  })
