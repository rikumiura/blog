import type { ArticleRepository } from '../domain/ports/article-repository'
import type { BodyKeyDeletionQueue } from '../domain/ports/body-key-deletion-queue'
import type { BodyStorage } from '../domain/ports/body-storage'
import type { CommentRepository } from '../domain/ports/comment-repository'
import type { ArticleIdGenerator } from '../domain/ports/id-generator'
import type { TagRepository } from '../domain/ports/tag-repository'
import type { Bindings } from '../env'
import { createDbClient } from './database'
import { ArticleIdGeneratorImpl } from './id/article-id-generator-impl'
import { DrizzleArticleRepository } from './repositories/drizzle-article-repository'
import { DrizzleBodyKeyDeletionQueue } from './repositories/drizzle-body-key-deletion-queue'
import { DrizzleCommentRepository } from './repositories/drizzle-comment-repository'
import { DrizzleTagRepository } from './repositories/drizzle-tag-repository'
import { R2BodyStorage } from './storage/r2-body-storage'
import { R2ImageStorage } from './storage/r2-image-storage'

/**
 * リクエスト単位で必要なインフラ依存一式。
 * JwtTokenGenerator / Pbkdf2PasswordHasher は JWT_SECRET 未設定時に
 * コンストラクタが例外を投げるため、ここでは含めず認証関連の箇所で個別に生成する。
 */
export type Deps = {
  articleRepository: ArticleRepository
  tagRepository: TagRepository
  commentRepository: CommentRepository
  bodyKeyDeletionQueue: BodyKeyDeletionQueue
  bodyStorage: BodyStorage
  imageStorage: R2ImageStorage
  idGenerator: ArticleIdGenerator
  now: () => string
}

/** Cloudflare Bindings から、ルートハンドラーが必要とする依存一式を生成する */
export function createDeps(env: Bindings): Deps {
  const db = createDbClient(env.DB)

  return {
    articleRepository: new DrizzleArticleRepository(db),
    tagRepository: new DrizzleTagRepository(db),
    commentRepository: new DrizzleCommentRepository(db),
    bodyKeyDeletionQueue: new DrizzleBodyKeyDeletionQueue(db),
    bodyStorage: new R2BodyStorage(env.ARTICLE_BUCKET),
    imageStorage: new R2ImageStorage(env.ARTICLE_BUCKET),
    idGenerator: new ArticleIdGeneratorImpl(),
    now: () => new Date().toISOString(),
  }
}
