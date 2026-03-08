import type { BodyKey } from '../models/article'

export type BodyGetResult =
  | { found: true; content: string }
  | { found: false }

export interface BodyStorage {
  save(key: BodyKey, content: string): Promise<void>
  get(key: BodyKey): Promise<BodyGetResult>
  delete(key: BodyKey): Promise<void>
}
