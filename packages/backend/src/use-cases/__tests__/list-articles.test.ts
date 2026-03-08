import { beforeEach, describe, expect, it } from 'vitest'
import {
  ArticleId,
  BodyKey,
  PublicArticleId,
  createDraftArticle,
  createTitle,
  type Title,
} from '../../domain/models/article'
import { listArticles } from '../list-articles'
import { InMemoryArticleRepository } from './in-memory-test-doubles'

function unwrapTitle(value: string): Title {
  const result = createTitle(value)
  if (!result.ok) throw new Error(result.message)
  return result.value
}

describe('listArticles', () => {
  let repository: InMemoryArticleRepository

  beforeEach(() => {
    repository = new InMemoryArticleRepository()
  })

  it('記事がない場合、空配列を返す', async () => {
    const result = await listArticles(repository)
    expect(result).toEqual([])
  })

  it('保存された記事をすべて取得できる', async () => {
    const article1 = createDraftArticle({
      id: ArticleId('article-1'),
      publicId: PublicArticleId('public-1'),
      title: unwrapTitle('記事1'),
      bodyKey: BodyKey('body-1'),
      now: '2025-01-01T00:00:00.000Z',
    })
    const article2 = createDraftArticle({
      id: ArticleId('article-2'),
      publicId: PublicArticleId('public-2'),
      title: unwrapTitle('記事2'),
      bodyKey: BodyKey('body-2'),
      now: '2025-01-02T00:00:00.000Z',
    })

    await repository.save(article1)
    await repository.save(article2)

    const result = await listArticles(repository)
    expect(result).toHaveLength(2)
  })
})
