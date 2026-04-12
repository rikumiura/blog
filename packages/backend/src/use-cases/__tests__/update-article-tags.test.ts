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
import {
  InMemoryArticleRepository,
  InMemoryTagRepository,
} from './in-memory-test-doubles'

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

const FIXED_NOW = '2025-02-01T00:00:00.000Z'

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
    const now = () => FIXED_NOW
    return { articleRepository, tagRepository, generateTagId, now }
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
      expect(result.tags.map((t) => String(t.name))).toEqual(
        expect.arrayContaining(['TypeScript', 'React']),
      )
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

    expect(result).toEqual({
      status: 'validation_error',
      message: 'タグ名は空にできません',
    })
  })

  it('タグ更新後に updatedAt が更新される', async () => {
    const deps = setup()
    await deps.articleRepository.save(createTestDraft())

    await updateArticleTags(PublicArticleId('public-1'), ['TypeScript'], deps)

    const article = await deps.articleRepository.findByPublicId(
      PublicArticleId('public-1'),
    )
    expect(article?.updatedAt).toBe(FIXED_NOW)
  })

  it('タグ更新は updatedAt のみを更新し、記事全体を save しない', async () => {
    const deps = setup()
    await deps.articleRepository.save(createTestDraft())

    // save が呼ばれたかを追跡するスパイ
    let saveCalledAfterSetup = false
    const originalSave = deps.articleRepository.save.bind(
      deps.articleRepository,
    )
    deps.articleRepository.save = async (article) => {
      saveCalledAfterSetup = true
      return originalSave(article)
    }

    await updateArticleTags(PublicArticleId('public-1'), ['TypeScript'], deps)

    // 全列 upsert の save ではなく、narrow update の updateUpdatedAt が使われる
    expect(saveCalledAfterSetup).toBe(false)
  })
})
