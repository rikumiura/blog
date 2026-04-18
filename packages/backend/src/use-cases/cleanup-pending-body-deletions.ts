import type { ArticleRepository } from '../domain/ports/article-repository'
import type { BodyKeyDeletionQueue } from '../domain/ports/body-key-deletion-queue'
import type { BodyStorage } from '../domain/ports/body-storage'

// 1回の cron 実行で処理する上限件数。
// 大量バックログ時に Worker の実行時間や D1/R2 負荷を制限する。
const CLEANUP_BATCH_LIMIT = 100

export type CleanupPendingBodyDeletionsResult = {
  deletedCount: number
}

export async function cleanupPendingBodyDeletions(deps: {
  bodyKeyDeletionQueue: BodyKeyDeletionQueue
  bodyStorage: BodyStorage
  articleRepository: ArticleRepository
}): Promise<CleanupPendingBodyDeletionsResult> {
  // queuedAt 昇順で上限件数分だけ取得し、古いものから優先して処理する
  const pendingKeys =
    await deps.bodyKeyDeletionQueue.listBatch(CLEANUP_BATCH_LIMIT)
  let deletedCount = 0

  for (const bodyKey of pendingKeys) {
    // ライブ参照チェック: 記事がまだこの bodyKey を参照している場合は R2 削除をスキップし、
    // キューから取り除く（キュー登録が誤っているか既に別 bodyKey に切り替わっている）
    const isLive = await deps.articleRepository.existsWithBodyKey(bodyKey)
    if (isLive) {
      await deps.bodyKeyDeletionQueue.remove(bodyKey)
      continue
    }
    try {
      await deps.bodyStorage.delete(bodyKey)
      await deps.bodyKeyDeletionQueue.remove(bodyKey)
      deletedCount++
    } catch (e) {
      console.error(`R2クリーンアップ再試行失敗: bodyKey=${bodyKey}`, e)
    }
  }

  if (pendingKeys.length === CLEANUP_BATCH_LIMIT) {
    console.warn(
      `R2クリーンアップ: バッチ上限(${CLEANUP_BATCH_LIMIT})に達しました。残件は次回の cron 実行で処理されます。`,
    )
  }

  return { deletedCount }
}
