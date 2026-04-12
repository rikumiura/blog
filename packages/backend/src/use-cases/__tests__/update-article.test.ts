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
  InMemoryBodyKeyDeletionQueue,
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
    const bodyKeyDeletionQueue = new InMemoryBodyKeyDeletionQueue()
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
      bodyKeyDeletionQueue,
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

  it('タイトルのみ更新は bodyKey を含む全列 save をしない', async () => {
    const deps = await setup()

    let saveCalledAfterSetup = false
    const originalSave = deps.repository.save.bind(deps.repository)
    deps.repository.save = async (article) => {
      saveCalledAfterSetup = true
      return originalSave(article)
    }

    await updateArticle(
      PublicArticleId('public-1'),
      { title: '新タイトル' },
      deps,
    )

    // bodyKeyを含む全列 upsert ではなく narrow update が使われる
    expect(saveCalledAfterSetup).toBe(false)
  })

  it('本文更新は status/publishedAt/scheduledAt を含む全列 save をしない', async () => {
    const deps = await setup()

    let saveCalledAfterSetup = false
    const originalSave = deps.repository.save.bind(deps.repository)
    deps.repository.save = async (article) => {
      saveCalledAfterSetup = true
      return originalSave(article)
    }

    await updateArticle(
      PublicArticleId('public-1'),
      { body: '新しい本文' },
      deps,
    )

    // status/publishedAt/scheduledAt を含む全列 upsert ではなく narrow update が使われる
    expect(saveCalledAfterSetup).toBe(false)
  })

  it('旧 bodyKey の R2 削除が失敗しても更新は成功し、outbox で cron が再試行できる', async () => {
    const deps = await setup()
    deps.bodyStorage.simulateDeleteError()

    const result = await updateArticle(
      PublicArticleId('public-1'),
      { body: '新しい本文' },
      deps,
    )

    // R2削除が失敗しても更新自体は成功する（旧keyは既にoutboxに原子的に登録済み）
    expect(result.status).toBe('updated')
    expect(deps.repository.hasPendingBodyKey(BodyKey('body-key-1'))).toBe(true)
  })

  it('本文更新時に旧 bodyKey が D1 更新と同時に outbox へ原子的に記録される', async () => {
    const deps = await setup()

    await updateArticle(
      PublicArticleId('public-1'),
      { body: '新しい本文' },
      deps,
    )

    // R2削除成功・失敗に関わらず旧 bodyKey は outbox に記録される
    expect(deps.repository.hasPendingBodyKey(BodyKey('body-key-1'))).toBe(true)
  })

  it('並行する本文更新が競合した場合、孤立した新 bodyKey が R2 から直接削除される', async () => {
    const deps = await setup()

    const originalMethod = deps.repository.updateBodyKeyAndEnqueueOldKey.bind(
      deps.repository,
    )
    deps.repository.updateBodyKeyAndEnqueueOldKey = async () => 'conflict'

    const result = await updateArticle(
      PublicArticleId('public-1'),
      { body: '新しい本文' },
      deps,
    )

    expect(result.status).toBe('conflict')
    // 孤立した新 bodyKey は R2 から直接削除される（同期削除が優先）
    expect(deps.bodyStorage.has(BodyKey('new-body-key-1'))).toBe(false)

    deps.repository.updateBodyKeyAndEnqueueOldKey = originalMethod
  })

  it('競合時に R2 直接削除も失敗した場合、孤立した新 bodyKey がキューに登録される', async () => {
    const deps = await setup()

    const originalMethod = deps.repository.updateBodyKeyAndEnqueueOldKey.bind(
      deps.repository,
    )
    deps.repository.updateBodyKeyAndEnqueueOldKey = async () => 'conflict'
    deps.bodyStorage.simulateDeleteError()

    await updateArticle(
      PublicArticleId('public-1'),
      { body: '新しい本文' },
      deps,
    )

    // R2直接削除が失敗したので、キューで再試行できる
    expect(deps.bodyKeyDeletionQueue.has(BodyKey('new-body-key-1'))).toBe(true)

    deps.repository.updateBodyKeyAndEnqueueOldKey = originalMethod
  })

  it('D1 bodyKey 更新が throw した場合、新 bodyKey が R2 から直接削除される', async () => {
    const deps = await setup()

    deps.repository.updateBodyKeyAndEnqueueOldKey = async () => {
      throw new Error('D1 batch 失敗')
    }

    await expect(
      updateArticle(PublicArticleId('public-1'), { body: '新しい本文' }, deps),
    ).rejects.toThrow('D1 batch 失敗')

    // 孤立した新 bodyKey は R2 から直接削除される
    expect(deps.bodyStorage.has(BodyKey('new-body-key-1'))).toBe(false)
  })

  it('D1 bodyKey 更新が throw し R2 削除も失敗した場合、新 bodyKey がキューに登録される', async () => {
    const deps = await setup()

    deps.repository.updateBodyKeyAndEnqueueOldKey = async () => {
      throw new Error('D1 batch 失敗')
    }
    deps.bodyStorage.simulateDeleteError()

    await expect(
      updateArticle(PublicArticleId('public-1'), { body: '新しい本文' }, deps),
    ).rejects.toThrow()

    // R2削除も失敗したので、キューで再試行できる
    expect(deps.bodyKeyDeletionQueue.has(BodyKey('new-body-key-1'))).toBe(true)
  })
})
