import type { ArticleId } from '../models/article'
import type { Comment, CommentId } from '../models/comment'

export interface CommentRepository {
  save(comment: Comment): Promise<void>
  findByArticleId(articleId: ArticleId): Promise<Comment[]>
  findById(id: CommentId): Promise<Comment | null>
  deleteById(id: CommentId): Promise<void>
}
