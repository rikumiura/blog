import { beforeEach, describe, expect, it } from 'vitest'
import {
  ArticleId,
  BodyKey,
  createDraftArticle,
  createTitle,
  PublicArticleId,
  publishArticle as publishDomainArticle,
} from '../../domain/models/article'
import { publishArticle } from '../publish-article'
import { InMemoryArticleRepository } from './in-memory-test-doubles'

describe('publishArticle', () => {
  let repository: InMemoryArticleRepository

  const FIXED_DATE = '2025-01-15T10:00:00.000Z'

  const deps = () => ({ repository, now: () => FIXED_DATE })

  const createTestDraft = () =>
    createDraftArticle({
      id: ArticleId('article-1'),
      publicId: PublicArticleId('public-1'),
      title: createTitle('テスト記事'),
      bodyKey: BodyKey('body-key-1'),
      now: '2025-01-01T00:00:00.000Z',
    })

  beforeEach(() => {
    repository = new InMemoryArticleRepository()
  })

  it('下書き記事を公開でき、statusがpublishedになる', async () => {
    const draft = createTestDraft()
    await repository.save(draft)

    const result = await publishArticle(PublicArticleId('public-1'), deps())

    expect(result.status).toBe('published')
    if (result.status === 'published') {
      expect(result.article.status).toBe('published')
      expect(result.article.publishedAt).toBe(FIXED_DATE)
    }
  })

  it('公開後の記事がリポジトリに保存される', async () => {
    const draft = createTestDraft()
    await repository.save(draft)

    await publishArticle(PublicArticleId('public-1'), deps())

    const saved = await repository.findByPublicId(PublicArticleId('public-1'))
    expect(saved?.status).toBe('published')
  })

  it('存在しない記事の場合、statusがnot_foundになる', async () => {
    const result = await publishArticle(PublicArticleId('non-existent'), deps())

    expect(result).toEqual({ status: 'not_found' })
  })

  it('既に公開済みの記事の場合、statusがalready_publishedになる', async () => {
    const draft = createTestDraft()
    const published = publishDomainArticle(draft, '2025-01-10T00:00:00.000Z')
    await repository.save(published)

    const result = await publishArticle(PublicArticleId('public-1'), deps())

    expect(result).toEqual({ status: 'already_published' })
  })
})
