import type { ArticleId } from '../domain/models/article'
import {
  type Comment,
  type CommentId,
  createAuthorName,
  createComment,
  createCommentContent,
} from '../domain/models/comment'
import type { CommentRepository } from '../domain/ports/comment-repository'

export type PostCommentResult =
  | { status: 'posted'; comment: Comment }
  | { status: 'validation_error'; message: string }

export async function postComment(
  input: {
    articleId: ArticleId
    authorName: string
    content: string
  },
  deps: {
    commentRepository: CommentRepository
    generateCommentId: () => CommentId
    now: () => string
  },
): Promise<PostCommentResult> {
  const authorNameResult = createAuthorName(input.authorName)
  if (!authorNameResult.ok) {
    return { status: 'validation_error', message: authorNameResult.message }
  }

  const contentResult = createCommentContent(input.content)
  if (!contentResult.ok) {
    return { status: 'validation_error', message: contentResult.message }
  }

  const comment = createComment({
    id: deps.generateCommentId(),
    articleId: input.articleId,
    authorName: authorNameResult.value,
    content: contentResult.value,
    now: deps.now(),
  })

  await deps.commentRepository.save(comment)

  return { status: 'posted', comment }
}
