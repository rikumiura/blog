import type { Comment } from '@/core/types/comment'

/** コメントデータ操作のポートインターフェース（依存関係逆転） */
export interface CommentRepository {
  listByArticle(publicId: string): Promise<Comment[]>
  post(
    publicId: string,
    input: { authorName: string; content: string },
  ): Promise<Comment>
  deleteComment(id: string): Promise<void>
}
