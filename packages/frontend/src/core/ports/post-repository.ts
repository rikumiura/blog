import type { Post } from '@/core/types/post'

/** 投稿データ取得のポートインターフェース（依存関係逆転） */
export interface PostRepository {
  findAll(): Promise<Post[]>
}
