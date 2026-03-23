import { describe, expect, it } from 'vitest'
import {
  ArticleId,
  BodyKey,
  type DraftArticle,
  PublicArticleId,
  restoreTitle,
} from '../../domain/models/article'
import { TagId } from '../../domain/models/tag'
import { updateArticleTags } from '../update-article-tags'
import { InMemoryArticleRepository, InMemoryTagRepository } from './in-memory-test-doubles'

function createTestDraft(): DraftArticle {
  return {
    id: ArticleId('article-1'),
    publicId: PublicArticleId('public-1'),
    title: restoreTitle('テスト記事'),
    bodyKey: BodyKey('body-key-1'),
    status: 'draft',
    createdAt: '2025-01-15T10:00:00.000Z',
    updatedAt: '2025-01-15T10:00:00.000Z',
    publishedAt: null,
    scheduledAt: null,
  }
}

describe('updateArticleTags', () => {
  let tagIdCounter = 0
  const setup = () => {
    tagIdCounter = 0
    const articleRepository = new InMemoryArticleRepository()
    const tagRepository = new InMemoryTagRepository()
    const generateTagId = () => {
      tagIdCounter++
      return TagId(`tag-${tagIdCounter}`)
    }
    return { articleRepository, tagRepository, generateTagId }
  }

  it('タグが更新される', async () => {
    const deps = setup()
    await deps.articleRepository.save(createTestDraft())

    const result = await updateArticleTags(
      PublicArticleId('public-1'),
      ['TypeScript', 'React'],
      deps,
    )

    expect(result.status).toBe('updated')
    if (result.status === 'updated') {
      expect(result.tags).toHaveLength(2)
    }
  })

  it('存在しない記事の場合 not_found が返る', async () => {
    const deps = setup()

    const result = await updateArticleTags(
      PublicArticleId('nonexistent'),
      ['TypeScript'],
      deps,
    )

    expect(result).toEqual({ status: 'not_found' })
  })

  it('無効なタグ名の場合 validation_error が返る', async () => {
    const deps = setup()
    await deps.articleRepository.save(createTestDraft())

    const result = await updateArticleTags(
      PublicArticleId('public-1'),
      [''],
      deps,
    )

    expect(result.status).toBe('validation_error')
  })
})
