import { describe, expect, it } from 'vitest'
import {
  ArticleId,
  BodyKey,
  PublicArticleId,
  createDraftArticle,
  createTitle,
} from '../../domain/models/article'
import { getArticle } from '../get-article'
import { InMemoryArticleRepository, InMemoryBodyStorage } from './in-memory-test-doubles'

describe('getArticle', () => {
  const setup = () => {
    const repository = new InMemoryArticleRepository()
    const bodyStorage = new InMemoryBodyStorage()
    return { repository, bodyStorage }
  }

  it('記事と本文を取得でき、statusがfoundになる', async () => {
    const deps = setup()
    const article = createDraftArticle({
      id: ArticleId('article-1'),
      publicId: PublicArticleId('public-1'),
      title: createTitle('テスト記事'),
      bodyKey: BodyKey('body-key-1'),
      now: '2025-01-01T00:00:00.000Z',
    })
    await deps.repository.save(article)
    await deps.bodyStorage.save(BodyKey('body-key-1'), '本文です')

    const result = await getArticle(PublicArticleId('public-1'), deps)

    expect(result).toEqual({
      status: 'found',
      article: { ...article, body: '本文です' },
    })
  })

  it('本文がストレージにない場合、statusがbody_not_foundになる', async () => {
    const deps = setup()
    const article = createDraftArticle({
      id: ArticleId('article-1'),
      publicId: PublicArticleId('public-1'),
      title: createTitle('テスト記事'),
      bodyKey: BodyKey('body-key-1'),
      now: '2025-01-01T00:00:00.000Z',
    })
    await deps.repository.save(article)

    const result = await getArticle(PublicArticleId('public-1'), deps)

    expect(result).toEqual({ status: 'body_not_found' })
  })

  it('存在しないpublicIdの場合、statusがnot_foundになる', async () => {
    const deps = setup()

    const result = await getArticle(
      PublicArticleId('non-existent'),
      deps,
    )

    expect(result).toEqual({ status: 'not_found' })
  })
})
