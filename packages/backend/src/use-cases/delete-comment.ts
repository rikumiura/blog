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
  const comment = await deps.commentRepository.findById(id)
  if (!comment) {
    return { status: 'not_found' }
  }

  await deps.commentRepository.deleteById(id)
  return { status: 'deleted' }
}
