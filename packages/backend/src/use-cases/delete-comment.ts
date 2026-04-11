import type { CommentId } from '../domain/models/comment'
import type { CommentRepository } from '../domain/ports/comment-repository'

export type DeleteCommentResult =
  | { status: 'deleted' }
  | { status: 'not_found' }

export async function deleteComment(
  id: CommentId,
  deps: {
    commentRepository: CommentRepository
  },
): Promise<DeleteCommentResult> {
  const deleted = await deps.commentRepository.deleteById(id)
  return deleted ? { status: 'deleted' } : { status: 'not_found' }
}
