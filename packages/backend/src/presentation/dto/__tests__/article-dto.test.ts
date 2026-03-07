import { describe, expect, it } from 'vitest'
import {
  ArticleId,
  BodyKey,
  PublicArticleId,
  createDraftArticle,
  createTitle,
  type Title,
  publishArticle as publishDomainArticle,
} from '../../../domain/models/article'
import { toArticleDetailDto, toArticleSummaryDto } from '../article-dto'

function unwrapTitle(value: string): Title {
  const result = createTitle(value)
  if (!result.ok) throw new Error(result.message)
  return result.value
}

describe('toArticleSummaryDto', () => {
  it('id・bodyKeyが含まれない', () => {
    const article = createDraftArticle({
      id: ArticleId('article-1'),
      publicId: PublicArticleId('public-1'),
      title: unwrapTitle('テスト記事'),
      bodyKey: BodyKey('body-key-1'),
      now: '2025-01-01T00:00:00.000Z',
    })

    const dto = toArticleSummaryDto(article)

    expect(dto).toEqual({
      publicId: 'public-1',
      title: 'テスト記事',
      status: 'draft',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      publishedAt: null,
    })
    expect('id' in dto).toBe(false)
    expect('bodyKey' in dto).toBe(false)
  })

  it('公開済み記事のpublishedAtが含まれる', () => {
    const draft = createDraftArticle({
      id: ArticleId('article-1'),
      publicId: PublicArticleId('public-1'),
      title: unwrapTitle('テスト記事'),
      bodyKey: BodyKey('body-key-1'),
      now: '2025-01-01T00:00:00.000Z',
    })
    const published = publishDomainArticle(draft, '2025-02-01T00:00:00.000Z')

    const dto = toArticleSummaryDto(published)

    expect(dto.publishedAt).toBe('2025-02-01T00:00:00.000Z')
    expect(dto.status).toBe('published')
  })
})

describe('toArticleDetailDto', () => {
  it('bodyが含まれ、id・bodyKeyが含まれない', () => {
    const article = createDraftArticle({
      id: ArticleId('article-1'),
      publicId: PublicArticleId('public-1'),
      title: unwrapTitle('テスト記事'),
      bodyKey: BodyKey('body-key-1'),
      now: '2025-01-01T00:00:00.000Z',
    })

    const dto = toArticleDetailDto(article, '本文です')

    expect(dto).toEqual({
      publicId: 'public-1',
      title: 'テスト記事',
      status: 'draft',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      publishedAt: null,
      body: '本文です',
    })
    expect('id' in dto).toBe(false)
    expect('bodyKey' in dto).toBe(false)
  })
})
