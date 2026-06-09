import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { PublicArticleId } from '../domain/models/article'
import type { AppEnv } from '../env'
import { createDbClient } from '../infrastructure/database'
import { ArticleIdGeneratorImpl } from '../infrastructure/id/article-id-generator-impl'
import { DrizzleArticleRepository } from '../infrastructure/repositories/drizzle-article-repository'
import { DrizzleCommentRepository } from '../infrastructure/repositories/drizzle-comment-repository'
import { DrizzleTagRepository } from '../infrastructure/repositories/drizzle-tag-repository'
import { R2BodyStorage } from '../infrastructure/storage/r2-body-storage'
import { R2ImageStorage } from '../infrastructure/storage/r2-image-storage'
import {
  toArticleDetailDto,
  toPaginatedArticlesDto,
} from '../presentation/dto/article-dto'
import { toCommentDto } from '../presentation/dto/comment-dto'
import {
  paginationSchema,
  publicIdParamSchema,
} from '../presentation/schemas/article-schemas'
import { postCommentSchema } from '../presentation/schemas/comment-schemas'
import { imageKeyParamSchema } from '../presentation/schemas/image-schemas'
import { listComments } from '../use-cases/list-comments'
import { listPublishedArticlesPaginated } from '../use-cases/list-published-articles'
import { postComment } from '../use-cases/post-comment'

export const publicRoutes = new Hono<AppEnv>()
  .get('/articles', zValidator('query', paginationSchema), async (c) => {
    const { page, limit, tags, search } = c.req.valid('query')
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)
    const tagRepository = new DrizzleTagRepository(db)
    const paginatedResult = await listPublishedArticlesPaginated(repository, {
      page,
      limit,
      ...(tags ? { tags } : {}),
      ...(search ? { search } : {}),
    })

    return c.json(
      await toPaginatedArticlesDto(paginatedResult, page, limit, tagRepository),
    )
  })
  .get(
    '/articles/:publicId',
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
  .get(
    '/articles/:publicId/comments',
    zValidator('param', publicIdParamSchema),
    async (c) => {
      const publicId = PublicArticleId(c.req.valid('param').publicId)
      const db = createDbClient(c.env.DB)
      const articleRepository = new DrizzleArticleRepository(db)
      const commentRepository = new DrizzleCommentRepository(db)

      const article = await articleRepository.findByPublicId(publicId)
      if (!article || article.status !== 'published') {
        return c.json({ error: '記事が見つかりません' }, 404)
      }

      const result = await listComments(article.id, { commentRepository })
      return c.json({ comments: result.comments.map(toCommentDto) })
    },
  )
  .post(
    '/articles/:publicId/comments',
    zValidator('param', publicIdParamSchema),
    zValidator('json', postCommentSchema),
    async (c) => {
      const publicId = PublicArticleId(c.req.valid('param').publicId)
      const input = c.req.valid('json')
      const db = createDbClient(c.env.DB)
      const articleRepository = new DrizzleArticleRepository(db)
      const commentRepository = new DrizzleCommentRepository(db)
      const idGenerator = new ArticleIdGeneratorImpl()

      const article = await articleRepository.findByPublicId(publicId)
      if (!article || article.status !== 'published') {
        return c.json({ error: '記事が見つかりません' }, 404)
      }

      const result = await postComment(
        {
          articleId: article.id,
          authorName: input.authorName,
          content: input.content,
        },
        {
          commentRepository,
          generateCommentId: () => idGenerator.generateCommentId(),
          now: () => new Date().toISOString(),
        },
      )

      switch (result.status) {
        case 'posted':
          return c.json(toCommentDto(result.comment), 201)
        case 'validation_error':
          return c.json({ error: result.message }, 400)
      }
    },
  )
  .get(
    '/images/:imageKey',
    zValidator('param', imageKeyParamSchema),
    async (c) => {
      const { imageKey } = c.req.valid('param')
      const imageStorage = new R2ImageStorage(c.env.ARTICLE_BUCKET)
      const result = await imageStorage.get(imageKey)

      if (!result.found) {
        return c.json({ error: '画像が見つかりません' }, 404)
      }

      return new Response(result.data, {
        headers: { 'content-type': result.contentType },
      })
    },
  )
