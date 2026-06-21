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

const { createDeps } = await import('../deps')

// JWT_SECRET 等は createDeps が参照しないことを確認するため、意図的に未設定にする
const env = {
  DB: {} as Bindings['DB'],
  ARTICLE_BUCKET: {} as Bindings['ARTICLE_BUCKET'],
} as Bindings

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
    expect(typeof deps.now).toBe('function')
    expect(typeof deps.now()).toBe('string')
  })

  it('呼び出すたびに新しい依存一式を生成する（リクエストごとに独立させる）', () => {
    const first = createDeps(env)
    const second = createDeps(env)

    expect(first.articleRepository).not.toBe(second.articleRepository)
  })
})
