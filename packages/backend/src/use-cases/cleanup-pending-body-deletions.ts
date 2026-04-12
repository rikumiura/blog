import type { BodyKeyDeletionQueue } from '../domain/ports/body-key-deletion-queue'
import type { BodyStorage } from '../domain/ports/body-storage'

export type CleanupPendingBodyDeletionsResult = {
  deletedCount: number
}

export async function cleanupPendingBodyDeletions(deps: {
  bodyKeyDeletionQueue: BodyKeyDeletionQueue
  bodyStorage: BodyStorage
}): Promise<CleanupPendingBodyDeletionsResult> {
  const pendingKeys = await deps.bodyKeyDeletionQueue.listAll()
  let deletedCount = 0

  for (const bodyKey of pendingKeys) {
    try {
      await deps.bodyStorage.delete(bodyKey)
      await deps.bodyKeyDeletionQueue.remove(bodyKey)
      deletedCount++
    } catch (e) {
      console.error(`R2クリーンアップ再試行失敗: bodyKey=${bodyKey}`, e)
    }
  }

  return { deletedCount }
}
