import type { BodyKey } from '../models/article'

export interface BodyKeyDeletionQueue {
  enqueue(bodyKey: BodyKey, queuedAt: string): Promise<void>
  listAll(): Promise<BodyKey[]>
  remove(bodyKey: BodyKey): Promise<void>
}
