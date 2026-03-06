import { beforeEach, describe, expect, it } from 'vitest'
import {
  ArticleId,
  BodyKey,
  PublicArticleId,
  createDraftArticle,
  createTitle,
} from '../../domain/models/article'
import { getArticle } from '../get-article'
import { InMemoryArticleRepository, InMemoryBodyStorage } from './fakes'

describe('getArticle', () => {
  let repository: InMemoryArticleRepository
  let bodyStorage: InMemoryBodyStorage

  const deps = () => ({ repository, bodyStorage })

  beforeEach(() => {
    repository = new InMemoryArticleRepository()
    bodyStorage = new InMemoryBodyStorage()
  })

  it('記事と本文を取得でき、statusがfoundになる', async () => {
    const article = createDraftArticle({
      id: ArticleId('article-1'),
      publicId: PublicArticleId('public-1'),
      title: createTitle('テスト記事'),
      bodyKey: BodyKey('body-key-1'),
      now: '2025-01-01T00:00:00.000Z',
    })
    await repository.save(article)
    await bodyStorage.save(BodyKey('body-key-1'), '本文です')

    const result = await getArticle(PublicArticleId('public-1'), deps())

    expect(result).toEqual({
      status: 'found',
      article: { ...article, body: '本文です' },
    })
  })

  it('本文がストレージにない場合、空文字列が返る', async () => {
    const article = createDraftArticle({
      id: ArticleId('article-1'),
      publicId: PublicArticleId('public-1'),
      title: createTitle('テスト記事'),
      bodyKey: BodyKey('body-key-1'),
      now: '2025-01-01T00:00:00.000Z',
    })
    await repository.save(article)

    const result = await getArticle(PublicArticleId('public-1'), deps())

    expect(result.status).toBe('found')
    if (result.status === 'found') {
      expect(result.article.body).toBe('')
    }
  })

  it('存在しないpublicIdの場合、statusがnot_foundになる', async () => {
    const result = await getArticle(
      PublicArticleId('non-existent'),
      deps(),
    )

    expect(result).toEqual({ status: 'not_found' })
  })
})
