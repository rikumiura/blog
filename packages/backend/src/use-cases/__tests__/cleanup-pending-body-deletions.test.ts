import { describe, expect, it } from 'vitest'
import { BodyKey } from '../../domain/models/article'
import { cleanupPendingBodyDeletions } from '../cleanup-pending-body-deletions'
import {
  InMemoryBodyKeyDeletionQueue,
  InMemoryBodyStorage,
} from './in-memory-test-doubles'

describe('cleanupPendingBodyDeletions', () => {
  const setup = () => {
    const bodyKeyDeletionQueue = new InMemoryBodyKeyDeletionQueue()
    const bodyStorage = new InMemoryBodyStorage()
    return { bodyKeyDeletionQueue, bodyStorage }
  }

  it('キューが空の場合、deletedCount が 0 になる', async () => {
    const deps = setup()

    const result = await cleanupPendingBodyDeletions(deps)

    expect(result.deletedCount).toBe(0)
  })

  it('キュー内の bodyKey を R2 から削除してキューから取り除く', async () => {
    const deps = setup()
    await deps.bodyKeyDeletionQueue.enqueue(
      BodyKey('key-1'),
      '2026-01-01T00:00:00.000Z',
    )
    await deps.bodyStorage.save(BodyKey('key-1'), '本文')

    const result = await cleanupPendingBodyDeletions(deps)

    expect(result.deletedCount).toBe(1)
    expect(deps.bodyStorage.has(BodyKey('key-1'))).toBe(false)
    expect(deps.bodyKeyDeletionQueue.has(BodyKey('key-1'))).toBe(false)
  })

  it('R2 削除が失敗したキーはキューに残る', async () => {
    const deps = setup()
    await deps.bodyKeyDeletionQueue.enqueue(
      BodyKey('key-1'),
      '2026-01-01T00:00:00.000Z',
    )
    await deps.bodyStorage.save(BodyKey('key-1'), '本文')
    deps.bodyStorage.simulateDeleteError()

    const result = await cleanupPendingBodyDeletions(deps)

    expect(result.deletedCount).toBe(0)
    expect(deps.bodyKeyDeletionQueue.has(BodyKey('key-1'))).toBe(true)
  })

  it('バックログが BATCH_LIMIT を超える場合、1 回の実行で BATCH_LIMIT 件まで処理される', async () => {
    const deps = setup()
    // 120件を古い順に登録（i 秒ずつずらして queuedAt ASC 順を保証）
    for (let i = 1; i <= 120; i++) {
      const queuedAt = new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString()
      await deps.bodyKeyDeletionQueue.enqueue(BodyKey(`key-${i}`), queuedAt)
      await deps.bodyStorage.save(BodyKey(`key-${i}`), `content-${i}`)
    }

    const result = await cleanupPendingBodyDeletions(deps)

    // 1 回の cron 実行では BATCH_LIMIT(100) 件まで処理される
    expect(result.deletedCount).toBe(100)
    // 古い順に処理されるため key-1 は処理済み
    expect(deps.bodyKeyDeletionQueue.has(BodyKey('key-1'))).toBe(false)
    // 新しい 20 件は次回 cron に残る
    expect(deps.bodyKeyDeletionQueue.has(BodyKey('key-101'))).toBe(true)
  })
})
