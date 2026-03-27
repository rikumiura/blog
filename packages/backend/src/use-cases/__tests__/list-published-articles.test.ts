import { describe, expect, it } from 'vitest'
import {
  ArticleId,
  BodyKey,
  PublicArticleId,
  type PublishedArticle,
  restoreTitle,
} from '../../domain/models/article'
import {
  listPublishedArticles,
  listPublishedArticlesPaginated,
} from '../list-published-articles'
import { InMemoryArticleRepository } from './in-memory-test-doubles'

function createTestPublished(
  id: string,
  publishedAt: string,
): PublishedArticle {
  return {
    id: ArticleId(id),
    publicId: PublicArticleId(`public-${id}`),
    title: restoreTitle(`公開記事${id}`),
    bodyKey: BodyKey(`body-${id}`),
    status: 'published',
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: publishedAt,
    publishedAt,
    scheduledAt: null,
  }
}

describe('listPublishedArticles', () => {
  it('公開記事のみ取得できる', async () => {
    const repository = new InMemoryArticleRepository()
    await repository.save(createTestPublished('1', '2025-01-20T10:00:00.000Z'))
    await repository.save(createTestPublished('2', '2025-01-21T10:00:00.000Z'))
    // 下書き記事は含まれない
    await repository.save({
      id: ArticleId('3'),
      publicId: PublicArticleId('public-3'),
      title: restoreTitle('下書き'),
      bodyKey: BodyKey('body-3'),
      status: 'draft',
      createdAt: '2025-01-15T10:00:00.000Z',
      updatedAt: '2025-01-15T10:00:00.000Z',
      publishedAt: null,
      scheduledAt: null,
    })

    const result = await listPublishedArticles(repository)

    expect(result).toHaveLength(2)
    expect(result.every((a) => a.status === 'published')).toBe(true)
  })

  it('記事がない場合は空配列が返る', async () => {
    const repository = new InMemoryArticleRepository()

    const result = await listPublishedArticles(repository)

    expect(result).toEqual([])
  })
})

describe('listPublishedArticlesPaginated', () => {
  it('ページネーション付きで公開記事を取得できる', async () => {
    const repository = new InMemoryArticleRepository()
    await repository.save(createTestPublished('1', '2025-01-20T10:00:00.000Z'))
    await repository.save(createTestPublished('2', '2025-01-21T10:00:00.000Z'))
    await repository.save(createTestPublished('3', '2025-01-22T10:00:00.000Z'))

    const result = await listPublishedArticlesPaginated(repository, {
      page: 1,
      limit: 2,
    })

    expect(result.items).toHaveLength(2)
    expect(result.totalCount).toBe(3)
  })
})
