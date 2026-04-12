import { describe, expect, it } from 'vitest'
import {
  ArticleId,
  BodyKey,
  type DraftArticle,
  PublicArticleId,
  restoreTitle,
} from '../../domain/models/article'
import { TagId } from '../../domain/models/tag'
import { updateArticle } from '../update-article'
import {
  InMemoryArticleRepository,
  InMemoryBodyStorage,
  InMemoryTagRepository,
} from './in-memory-test-doubles'

const FIXED_NOW = '2025-01-20T10:00:00.000Z'

function createTestDraft(): DraftArticle {
  return {
    id: ArticleId('article-1'),
    publicId: PublicArticleId('public-1'),
    title: restoreTitle('元のタイトル'),
    bodyKey: BodyKey('body-key-1'),
    status: 'draft',
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z',
    publishedAt: null,
    scheduledAt: null,
  }
}

describe('updateArticle', () => {
  let tagIdCounter = 0
  let bodyKeyCounter = 0
  const setup = async () => {
    tagIdCounter = 0
    bodyKeyCounter = 0
    const repository = new InMemoryArticleRepository()
    const bodyStorage = new InMemoryBodyStorage()
    const tagRepository = new InMemoryTagRepository()
    const generateTagId = () => {
      tagIdCounter++
      return TagId(`tag-${tagIdCounter}`)
    }
    const generateBodyKey = () => {
      bodyKeyCounter++
      return BodyKey(`new-body-key-${bodyKeyCounter}`)
    }
    const now = () => FIXED_NOW

    // テスト用の記事と本文をセットアップ
    await repository.save(createTestDraft())
    await bodyStorage.save(BodyKey('body-key-1'), '元の本文')

    return {
      repository,
      bodyStorage,
      tagRepository,
      generateTagId,
      generateBodyKey,
      now,
    }
  }

  it('タイトルを更新できる', async () => {
    const deps = await setup()

    const result = await updateArticle(
      PublicArticleId('public-1'),
      { title: '新しいタイトル' },
      deps,
    )

    expect(result.status).toBe('updated')
    if (result.status === 'updated') {
      expect(String(result.article.title)).toBe('新しいタイトル')
      expect(result.article.updatedAt).toBe(FIXED_NOW)
    }
  })

  it('本文を更新できる', async () => {
    const deps = await setup()

    const result = await updateArticle(
      PublicArticleId('public-1'),
      { body: '新しい本文' },
      deps,
    )

    expect(result.status).toBe('updated')
    if (result.status === 'updated') {
      expect(result.body).toBe('新しい本文')
    }
  })

  it('タグを更新できる', async () => {
    const deps = await setup()

    const result = await updateArticle(
      PublicArticleId('public-1'),
      { tags: ['TypeScript', 'React'] },
      deps,
    )

    expect(result.status).toBe('updated')
    if (result.status === 'updated') {
      expect(result.tags).toHaveLength(2)
    }
  })

  it('タイトルと本文を同時に更新できる', async () => {
    const deps = await setup()

    const result = await updateArticle(
      PublicArticleId('public-1'),
      { title: '新タイトル', body: '新本文' },
      deps,
    )

    expect(result.status).toBe('updated')
    if (result.status === 'updated') {
      expect(String(result.article.title)).toBe('新タイトル')
      expect(result.body).toBe('新本文')
    }
  })

  it('存在しない記事の場合 not_found が返る', async () => {
    const deps = await setup()

    const result = await updateArticle(
      PublicArticleId('nonexistent'),
      { title: '新タイトル' },
      deps,
    )

    expect(result).toEqual({ status: 'not_found' })
  })

  it('空のタイトルの場合 validation_error が返る', async () => {
    const deps = await setup()

    const result = await updateArticle(
      PublicArticleId('public-1'),
      { title: '' },
      deps,
    )

    expect(result).toEqual({
      status: 'validation_error',
      message: 'タイトルは空にできません',
    })
  })

  it('無効なタグ名の場合 validation_error が返る', async () => {
    const deps = await setup()

    const result = await updateArticle(
      PublicArticleId('public-1'),
      { tags: [''] },
      deps,
    )

    expect(result).toEqual({
      status: 'validation_error',
      message: 'タグ名は空にできません',
    })
  })

  it('本文を更新した場合、新しい bodyKey が割り当てられる', async () => {
    const deps = await setup()

    const result = await updateArticle(
      PublicArticleId('public-1'),
      { body: '新しい本文' },
      deps,
    )

    expect(result.status).toBe('updated')
    if (result.status === 'updated') {
      // 元のbodyKeyとは異なる新しいkeyが割り当てられる（immutable key設計）
      expect(String(result.article.bodyKey)).not.toBe('body-key-1')
      expect(result.body).toBe('新しい本文')
    }
  })

  it('本文を更新した後、旧 bodyKey がストレージから削除される', async () => {
    const deps = await setup()

    await updateArticle(
      PublicArticleId('public-1'),
      { body: '新しい本文' },
      deps,
    )

    // 旧keyはストレージから削除されている（ストレージリーク防止）
    expect(deps.bodyStorage.has(BodyKey('body-key-1'))).toBe(false)
  })
})
