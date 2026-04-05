/// <reference path="../worker-configuration.d.ts" />
import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { PublicArticleId } from './domain/models/article'
import { createAuthMiddleware } from './infrastructure/auth/auth-middleware'
import { JwtTokenGenerator } from './infrastructure/auth/jwt-token-generator'
import { Pbkdf2PasswordHasher } from './infrastructure/auth/pbkdf2-password-hasher'
import { createDbClient } from './infrastructure/database'
import { ArticleIdGeneratorImpl } from './infrastructure/id/article-id-generator-impl'
import { DrizzleArticleRepository } from './infrastructure/repositories/drizzle-article-repository'
import { DrizzleTagRepository } from './infrastructure/repositories/drizzle-tag-repository'
import { R2BodyStorage } from './infrastructure/storage/r2-body-storage'
import {
  MAX_IMAGE_SIZE_BYTES,
  R2ImageStorage,
  isAllowedImageContentType,
} from './infrastructure/storage/r2-image-storage'
import {
  toArticleDetailDto,
  toArticleSummaryDto,
  toPaginatedArticlesDto,
} from './presentation/dto/article-dto'
import { authenticateAdmin } from './use-cases/authenticate-admin'
import { cancelSchedule } from './use-cases/cancel-schedule'
import { createArticle } from './use-cases/create-article'
import { deleteArticle } from './use-cases/delete-article'
import { getArticle } from './use-cases/get-article'
import { listArticlesPaginated } from './use-cases/list-articles'
import { listPublishedArticlesPaginated } from './use-cases/list-published-articles'
import { publishArticle } from './use-cases/publish-article'
import { publishScheduledArticles } from './use-cases/publish-scheduled-articles'
import { scheduleArticle } from './use-cases/schedule-article'
import { updateArticle } from './use-cases/update-article'
import { updateArticleTags } from './use-cases/update-article-tags'

type Bindings = {
  DB: D1Database
  ARTICLE_BUCKET: R2Bucket
  ADMIN_USERNAME: string
  ADMIN_PASSWORD_HASH: string
  JWT_SECRET: string
}

type Variables = {
  user: { sub: string }
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

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
  tags: z
    .array(tagNameSchema)
    .max(10, 'タグは10個以内にしてください')
    .optional()
    .default([]),
  publish: z.boolean().optional().default(false),
})

const updateArticleSchema = z
  .object({
    title: z
      .string()
      .min(1, 'タイトルは必須です')
      .max(100, 'タイトルは100文字以内にしてください')
      .optional(),
    body: z.string().optional(),
    tags: z
      .array(tagNameSchema)
      .max(10, 'タグは10個以内にしてください')
      .optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.body !== undefined ||
      data.tags !== undefined,
    { message: '更新するフィールドを1つ以上指定してください' },
  )

const updateTagsSchema = z.object({
  tags: z.array(tagNameSchema).max(10, 'タグは10個以内にしてください'),
})

const publicIdParamSchema = z.object({
  publicId: z.string().min(1).max(30),
})

const scheduleSchema = z.object({
  scheduledAt: z
    .string()
    .datetime({ message: '予約日時はISO 8601形式で指定してください' }),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  tags: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').filter(Boolean) : undefined)),
})

const loginSchema = z.object({
  username: z.string().min(1, 'ユーザー名は必須です').max(64, 'ユーザー名が長すぎます'),
  password: z.string().min(1, 'パスワードは必須です').max(256, 'パスワードが長すぎます'),
})

// 管理者用APIに認証ミドルウェアを適用
const authMiddleware = createAuthMiddleware(
  (c) => new JwtTokenGenerator(c.env.JWT_SECRET),
)
app.use('/api/articles/*', authMiddleware)
app.use('/api/articles', authMiddleware)
app.use('/api/auth/me', authMiddleware)
app.use('/api/images', authMiddleware)

const routes = app
  .get('/api/hello', (c) => {
    return c.json({
      message: 'Hello World from Hono & Cloudflare Workers!',
    })
  })
  // --- 認証 API ---
  .post('/api/auth/login', zValidator('json', loginSchema), async (c) => {
    const input = c.req.valid('json')
    const passwordHasher = new Pbkdf2PasswordHasher()
    const tokenGenerator = new JwtTokenGenerator(c.env.JWT_SECRET)

    const result = await authenticateAdmin(input, {
      passwordHasher,
      tokenGenerator,
      adminUsername: c.env.ADMIN_USERNAME,
      adminPasswordHash: c.env.ADMIN_PASSWORD_HASH,
    })

    switch (result.status) {
      case 'authenticated':
        return c.json({ token: result.token })
      case 'invalid_credentials':
        return c.json(
          { error: 'ユーザー名またはパスワードが正しくありません' },
          401,
        )
    }
  })
  .get('/api/auth/me', (c) => {
    const user = c.get('user')
    return c.json({ username: user.sub })
  })
  // --- 管理者用 API ---
  .get('/api/articles', zValidator('query', paginationSchema), async (c) => {
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
  .get(
    '/api/articles/:publicId',
    zValidator('param', publicIdParamSchema),
    async (c) => {
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
    },
  )
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
  .patch(
    '/api/articles/:publicId',
    zValidator('param', publicIdParamSchema),
    zValidator('json', updateArticleSchema),
    async (c) => {
      const publicId = PublicArticleId(c.req.valid('param').publicId)
      const input = c.req.valid('json')
      const db = createDbClient(c.env.DB)
      const repository = new DrizzleArticleRepository(db)
      const tagRepository = new DrizzleTagRepository(db)
      const bodyStorage = new R2BodyStorage(c.env.ARTICLE_BUCKET)
      const idGenerator = new ArticleIdGeneratorImpl()

      const result = await updateArticle(publicId, input, {
        repository,
        bodyStorage,
        tagRepository,
        generateTagId: () => idGenerator.generateTagId(),
        now: () => new Date().toISOString(),
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
      }
    },
  )
  .patch(
    '/api/articles/:publicId/publish',
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
      }
    },
  )
  .patch(
    '/api/articles/:publicId/schedule',
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
      }
    },
  )
  .patch(
    '/api/articles/:publicId/cancel-schedule',
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
      }
    },
  )
  .patch(
    '/api/articles/:publicId/tags',
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

  // --- 公開読者向け API ---
  .get(
    '/api/public/articles',
    zValidator('query', paginationSchema),
    async (c) => {
      const { page, limit, tags } = c.req.valid('query')
      const db = createDbClient(c.env.DB)
      const repository = new DrizzleArticleRepository(db)
      const tagRepository = new DrizzleTagRepository(db)
      const paginatedResult = await listPublishedArticlesPaginated(repository, {
        page,
        limit,
        ...(tags ? { tags } : {}),
      })

      return c.json(
        await toPaginatedArticlesDto(
          paginatedResult,
          page,
          limit,
          tagRepository,
        ),
      )
    },
  )
  .get(
    '/api/public/articles/:publicId',
    zValidator('param', publicIdParamSchema),
    async (c) => {
      const publicId = PublicArticleId(c.req.valid('param').publicId)
      const db = createDbClient(c.env.DB)
      const repository = new DrizzleArticleRepository(db)
      const tagRepository = new DrizzleTagRepository(db)
      const bodyStorage = new R2BodyStorage(c.env.ARTICLE_BUCKET)

      // 公開状態を先に確認し、下書きへの不要なR2読み込みを防ぐ
      const article = await repository.findByPublicId(publicId)
      if (!article || article.status !== 'published') {
        return c.json({ error: '記事が見つかりません' }, 404)
      }

      const bodyResult = await bodyStorage.get(article.bodyKey)
      if (!bodyResult.found) {
        return c.json({ error: '記事本文が見つかりません' }, 404)
      }

      const tags = await tagRepository.findByArticleId(article.id)
      return c.json(toArticleDetailDto(article, bodyResult.content, tags))
    },
  )

  .delete(
    '/api/articles/:publicId',
    zValidator('param', publicIdParamSchema),
    async (c) => {
      const publicId = PublicArticleId(c.req.valid('param').publicId)
      const db = createDbClient(c.env.DB)
      const repository = new DrizzleArticleRepository(db)
      const bodyStorage = new R2BodyStorage(c.env.ARTICLE_BUCKET)

      const result = await deleteArticle(publicId, { repository, bodyStorage })

      switch (result.status) {
        case 'deleted':
          return c.body(null, 204)
        case 'not_found':
          return c.json({ error: '記事が見つかりません' }, 404)
      }
    },
  )

  // --- 画像 API ---
  .post('/api/images', async (c) => {
    const formData = await c.req.formData()
    const file = formData.get('image')

    if (!file || !(file instanceof File)) {
      return c.json({ error: '画像ファイルが指定されていません' }, 400)
    }

    if (!isAllowedImageContentType(file.type)) {
      return c.json(
        {
          error:
            'サポートされていないファイル形式です。JPEG / PNG / GIF / WebP のみ使用できます',
        },
        400,
      )
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return c.json({ error: '画像サイズは 5MB 以内にしてください' }, 400)
    }

    const ext = file.type.split('/')[1]
    const { uuidv7 } = await import('uuidv7')
    const key = `${uuidv7()}.${ext}`

    const imageStorage = new R2ImageStorage(c.env.ARTICLE_BUCKET)
    const data = await file.arrayBuffer()
    await imageStorage.save(key, data, file.type)

    const url = `/api/public/images/${key}`
    return c.json({ key, url }, 201)
  })
  .get('/api/public/images/:imageKey', async (c) => {
    const imageKey = c.req.param('imageKey')
    const imageStorage = new R2ImageStorage(c.env.ARTICLE_BUCKET)
    const result = await imageStorage.get(imageKey)

    if (!result.found) {
      return c.json({ error: '画像が見つかりません' }, 404)
    }

    return new Response(result.data, {
      headers: { 'content-type': result.contentType },
    })
  })

export { app }
export type AppType = typeof routes

// Scheduled handler: 予約公開日時を過ぎた記事を自動公開する
export default {
  fetch: app.fetch,
  async scheduled(
    _event: ScheduledEvent,
    env: Bindings,
    _ctx: ExecutionContext,
  ) {
    try {
      const db = createDbClient(env.DB)
      const repository = new DrizzleArticleRepository(db)

      const result = await publishScheduledArticles({
        repository,
        now: () => new Date().toISOString(),
      })

      if (result.publishedCount > 0) {
        console.log(`予約公開: ${result.publishedCount}件の記事を公開しました`)
      }
    } catch (error) {
      console.error('予約公開処理でエラーが発生しました:', error)
    }
  },
}
