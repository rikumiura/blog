import { describe, expect, it, vi } from 'vitest'
import type { Bindings } from '../../env'

vi.mock('../database', () => ({
  createDbClient: vi.fn(() => ({})),
}))

vi.mock('../repositories/drizzle-article-repository', () => ({
  DrizzleArticleRepository: vi.fn(),
}))

vi.mock('../repositories/drizzle-tag-repository', () => ({
  DrizzleTagRepository: vi.fn(),
}))

vi.mock('../repositories/drizzle-comment-repository', () => ({
  DrizzleCommentRepository: vi.fn(),
}))

vi.mock('../repositories/drizzle-body-key-deletion-queue', () => ({
  DrizzleBodyKeyDeletionQueue: vi.fn(),
}))

vi.mock('../storage/r2-body-storage', () => ({
  R2BodyStorage: vi.fn(),
}))

vi.mock('../storage/r2-image-storage', () => ({
  R2ImageStorage: vi.fn(),
}))

vi.mock('../id/article-id-generator-impl', () => ({
  ArticleIdGeneratorImpl: vi.fn(),
}))

vi.mock('../auth/jwt-token-generator', () => ({
  JwtTokenGenerator: vi.fn(),
}))

vi.mock('../auth/pbkdf2-password-hasher', () => ({
  Pbkdf2PasswordHasher: vi.fn(),
}))

const { createDeps } = await import('../deps')

const env: Bindings = {
  DB: {} as Bindings['DB'],
  ARTICLE_BUCKET: {} as Bindings['ARTICLE_BUCKET'],
  ADMIN_USERNAME: 'admin',
  ADMIN_PASSWORD_HASH: 'hashed',
  JWT_SECRET: 'secret',
}

describe('createDeps', () => {
  it('リクエスト処理に必要な依存一式を生成する', () => {
    const deps = createDeps(env)

    expect(deps.articleRepository).toBeDefined()
    expect(deps.tagRepository).toBeDefined()
    expect(deps.commentRepository).toBeDefined()
    expect(deps.bodyKeyDeletionQueue).toBeDefined()
    expect(deps.bodyStorage).toBeDefined()
    expect(deps.imageStorage).toBeDefined()
    expect(deps.idGenerator).toBeDefined()
    expect(deps.tokenGenerator).toBeDefined()
    expect(deps.passwordHasher).toBeDefined()
    expect(typeof deps.now).toBe('function')
    expect(typeof deps.now()).toBe('string')
  })

  it('呼び出すたびに新しい依存一式を生成する（リクエストごとに独立させる）', () => {
    const first = createDeps(env)
    const second = createDeps(env)

    expect(first.articleRepository).not.toBe(second.articleRepository)
  })
})
