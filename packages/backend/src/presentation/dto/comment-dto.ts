import type { Comment } from '../../domain/models/comment'

export type CommentDto = {
  id: string
  articleId: string
  authorName: string
  content: string
  createdAt: string
}

export function toCommentDto(comment: Comment): CommentDto {
  return {
    id: comment.id,
    articleId: comment.articleId,
    authorName: comment.authorName,
    content: comment.content,
    createdAt: comment.createdAt,
  }
}
