import type { BodyKey } from '../models/article'

export interface BodyStorage {
  save(key: BodyKey, content: string): Promise<void>
  get(key: BodyKey): Promise<string | null>
  delete(key: BodyKey): Promise<void>
}
