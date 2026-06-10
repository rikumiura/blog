import type { TagSummary } from '@/core/types/tag'

/** タグデータ操作のポートインターフェース（依存関係逆転） */
export interface TagRepository {
  listAll(): Promise<TagSummary[]>
  create(name: string): Promise<TagSummary>
  delete(id: string): Promise<void>
}
