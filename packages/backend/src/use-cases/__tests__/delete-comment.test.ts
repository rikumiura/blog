import { describe, expect, it } from 'vitest'
import { ArticleId } from '../../domain/models/article'
import {
  CommentId,
  createComment,
  restoreAuthorName,
  restoreCommentContent,
} from '../../domain/models/comment'
import { deleteComment } from '../delete-comment'
import { InMemoryCommentRepository } from './in-memory-test-doubles'

describe('deleteComment', () => {
  const ARTICLE_ID = ArticleId('article-1')
  const COMMENT_ID = CommentId('comment-1')

  const makeComment = () =>
    createComment({
      id: COMMENT_ID,
      articleId: ARTICLE_ID,
      authorName: restoreAuthorName('読者A'),
      content: restoreCommentContent('コメント内容'),
      now: '2025-01-15T10:00:00.000Z',
    })

  it('コメントが削除される', async () => {
    const commentRepository = new InMemoryCommentRepository()
    await commentRepository.save(makeComment())

    const result = await deleteComment(COMMENT_ID, { commentRepository })

    expect(result).toEqual({ status: 'deleted' })
    expect(commentRepository.getAll()).toHaveLength(0)
  })

  it('存在しないコメントを削除しようとすると not_found を返す', async () => {
    const commentRepository = new InMemoryCommentRepository()

    const result = await deleteComment(COMMENT_ID, { commentRepository })

    expect(result).toEqual({ status: 'not_found' })
  })
})
