import type { BodyKey } from '../models/article'

export interface BodyKeyDeletionQueue {
  enqueue(bodyKey: BodyKey, queuedAt: string): Promise<void>
  /** queuedAt 昇順で最大 limit 件取得する */
  listBatch(limit: number): Promise<BodyKey[]>
  remove(bodyKey: BodyKey): Promise<void>
}
