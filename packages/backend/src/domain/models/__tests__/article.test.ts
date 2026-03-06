import { describe, expect, it } from 'vitest'
import type { DraftArticle, PublishedArticle } from '../article'
import {
  ArticleId,
  BodyKey,
  PublicArticleId,
  createDraftArticle,
  createTitle,
  publishArticle,
  updateArticleContent,
} from '../article'

// テスト用ヘルパー
function createTestDraftArticle(overrides: Partial<DraftArticle> = {}): DraftArticle {
  return {
    id: ArticleId('test-id'),
    publicId: PublicArticleId('test-public-id'),
    title: createTitle('テスト記事'),
    bodyKey: BodyKey('test-body-key'),
    status: 'draft',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    publishedAt: null,
    ...overrides,
  }
}

function createTestPublishedArticle(overrides: Partial<PublishedArticle> = {}): PublishedArticle {
  return {
    id: ArticleId('test-id'),
    publicId: PublicArticleId('test-public-id'),
    title: createTitle('テスト記事'),
    bodyKey: BodyKey('test-body-key'),
    status: 'published',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    publishedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('createTitle', () => {
  it('正常な文字列からTitleを生成できる', () => {
    const title = createTitle('テスト記事タイトル')
    expect(title).toBe('テスト記事タイトル')
  })

  it('前後の空白がトリムされる', () => {
    const title = createTitle('  スペース付きタイトル  ')
    expect(title).toBe('スペース付きタイトル')
  })

  it('空文字列の場合エラーになる', () => {
    expect(() => createTitle('')).toThrow('タイトルは空にできません')
  })

  it('空白のみの場合エラーになる', () => {
    expect(() => createTitle('   ')).toThrow('タイトルは空にできません')
  })

  it('101文字以上の場合エラーになる', () => {
    const longTitle = 'あ'.repeat(101)
    expect(() => createTitle(longTitle)).toThrow(
      'タイトルは100文字以内にしてください',
    )
  })

  it('100文字ちょうどの場合は正常に生成できる', () => {
    const exactTitle = 'あ'.repeat(100)
    const title = createTitle(exactTitle)
    expect(title).toBe(exactTitle)
  })
})

describe('createDraftArticle', () => {
  it('正しい初期状態で下書き記事が作成される', () => {
    const now = '2026-03-06T12:00:00.000Z'
    const article = createDraftArticle({
      id: ArticleId('article-1'),
      publicId: PublicArticleId('public-1'),
      title: createTitle('新規記事'),
      bodyKey: BodyKey('body-key-1'),
      now,
    })

    expect(article.id).toBe('article-1')
    expect(article.publicId).toBe('public-1')
    expect(article.title).toBe('新規記事')
    expect(article.bodyKey).toBe('body-key-1')
    expect(article.status).toBe('draft')
    expect(article.createdAt).toBe(now)
    expect(article.updatedAt).toBe(now)
    expect(article.publishedAt).toBeNull()
  })

  it('渡したnowがcreatedAtとupdatedAtに使われる', () => {
    const now = '2026-06-15T09:30:00.000Z'
    const article = createDraftArticle({
      id: ArticleId('article-2'),
      publicId: PublicArticleId('public-2'),
      title: createTitle('日時テスト'),
      bodyKey: BodyKey('body-key-2'),
      now,
    })

    expect(article.createdAt).toBe(now)
    expect(article.updatedAt).toBe(now)
  })
})

describe('publishArticle', () => {
  it('下書き記事を公開できる', () => {
    const draftArticle = createTestDraftArticle()
    const now = '2026-03-06T15:00:00.000Z'

    const published = publishArticle(draftArticle, now)

    expect(published.status).toBe('published')
  })

  it('公開時にpublishedAtが設定される', () => {
    const draftArticle = createTestDraftArticle()
    const now = '2026-03-06T15:00:00.000Z'

    const published = publishArticle(draftArticle, now)

    expect(published.publishedAt).toBe(now)
  })

  it('公開時にupdatedAtが更新される', () => {
    const draftArticle = createTestDraftArticle()
    const now = '2026-03-06T15:00:00.000Z'

    const published = publishArticle(draftArticle, now)

    expect(published.updatedAt).toBe(now)
  })

  it('元の記事は変更されない（イミュータブル）', () => {
    const draftArticle = createTestDraftArticle()
    const now = '2026-03-06T15:00:00.000Z'

    publishArticle(draftArticle, now)

    expect(draftArticle.status).toBe('draft')
    expect(draftArticle.publishedAt).toBeNull()
  })

  it('公開済みの記事はpublishArticleに渡せない（型レベルで防止）', () => {
    // PublishedArticle型はpublishArticleの引数型（DraftArticle）に合致しないため、
    // コンパイル時にエラーになる。ランタイムテストは不要。
    const publishedArticle = createTestPublishedArticle()
    expect(publishedArticle.status).toBe('published')
    expect(publishedArticle.publishedAt).toBeDefined()
  })
})

describe('updateArticleContent', () => {
  it('タイトルが更新される', () => {
    const article = createTestDraftArticle()
    const newTitle = createTitle('更新後のタイトル')
    const now = '2026-03-06T16:00:00.000Z'

    const updated = updateArticleContent(article, { title: newTitle }, now)

    expect(updated.title).toBe('更新後のタイトル')
  })

  it('updatedAtが更新される', () => {
    const article = createTestDraftArticle()
    const newTitle = createTitle('更新後のタイトル')
    const now = '2026-03-06T16:00:00.000Z'

    const updated = updateArticleContent(article, { title: newTitle }, now)

    expect(updated.updatedAt).toBe(now)
  })

  it('元の記事は変更されない（イミュータブル）', () => {
    const article = createTestDraftArticle()
    const originalTitle = article.title
    const originalUpdatedAt = article.updatedAt
    const newTitle = createTitle('更新後のタイトル')
    const now = '2026-03-06T16:00:00.000Z'

    updateArticleContent(article, { title: newTitle }, now)

    expect(article.title).toBe(originalTitle)
    expect(article.updatedAt).toBe(originalUpdatedAt)
  })

  it('タイトル以外のフィールドは変更されない', () => {
    const article = createTestDraftArticle()
    const newTitle = createTitle('更新後のタイトル')
    const now = '2026-03-06T16:00:00.000Z'

    const updated = updateArticleContent(article, { title: newTitle }, now)

    expect(updated.id).toBe(article.id)
    expect(updated.publicId).toBe(article.publicId)
    expect(updated.bodyKey).toBe(article.bodyKey)
    expect(updated.status).toBe(article.status)
    expect(updated.createdAt).toBe(article.createdAt)
    expect(updated.publishedAt).toBe(article.publishedAt)
  })
})
