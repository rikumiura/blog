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
  title?: string,
): PublishedArticle {
  return {
    id: ArticleId(id),
    publicId: PublicArticleId(`public-${id}`),
    title: restoreTitle(title ?? `公開記事${id}`),
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

  it('search でタイトルに部分一致する公開記事のみ取得できる', async () => {
    const repository = new InMemoryArticleRepository()
    await repository.save(
      createTestPublished('1', '2025-01-20T10:00:00.000Z', 'TypeScript入門'),
    )
    await repository.save(
      createTestPublished('2', '2025-01-21T10:00:00.000Z', 'Rust入門'),
    )
    await repository.save(
      createTestPublished('3', '2025-01-22T10:00:00.000Z', 'TypeScript応用'),
    )

    const result = await listPublishedArticlesPaginated(repository, {
      page: 1,
      limit: 20,
      search: 'TypeScript',
    })

    expect(result.totalCount).toBe(2)
    expect(
      result.items.every((a) => String(a.title).includes('TypeScript')),
    ).toBe(true)
  })

  it('search は大文字小文字を区別しない', async () => {
    const repository = new InMemoryArticleRepository()
    await repository.save(
      createTestPublished('1', '2025-01-20T10:00:00.000Z', 'TypeScript入門'),
    )

    const result = await listPublishedArticlesPaginated(repository, {
      page: 1,
      limit: 20,
      search: 'typescript',
    })

    expect(result.totalCount).toBe(1)
  })

  it('search が前後空白のみの場合は全件返す', async () => {
    const repository = new InMemoryArticleRepository()
    await repository.save(
      createTestPublished('1', '2025-01-20T10:00:00.000Z', 'TypeScript入門'),
    )
    await repository.save(
      createTestPublished('2', '2025-01-21T10:00:00.000Z', 'Rust入門'),
    )

    const result = await listPublishedArticlesPaginated(repository, {
      page: 1,
      limit: 20,
      search: '   ',
    })

    expect(result.totalCount).toBe(2)
  })

  it('search に該当する記事がない場合は空になる', async () => {
    const repository = new InMemoryArticleRepository()
    await repository.save(
      createTestPublished('1', '2025-01-20T10:00:00.000Z', 'TypeScript入門'),
    )

    const result = await listPublishedArticlesPaginated(repository, {
      page: 1,
      limit: 20,
      search: '存在しないキーワード',
    })

    expect(result.totalCount).toBe(0)
    expect(result.items).toEqual([])
  })
})
