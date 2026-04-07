import type { ArticleId } from '../domain/models/article'
import type { Comment } from '../domain/models/comment'
import type { CommentRepository } from '../domain/ports/comment-repository'

export type ListCommentsResult = {
  comments: Comment[]
}

export async function listComments(
  articleId: ArticleId,
  deps: {
    commentRepository: CommentRepository
  },
): Promise<ListCommentsResult> {
  const comments = await deps.commentRepository.findByArticleId(articleId)
  return { comments }
}
