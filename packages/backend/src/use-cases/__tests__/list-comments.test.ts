import { describe, expect, it } from 'vitest'
import { ArticleId } from '../../domain/models/article'
import {
  CommentId,
  createComment,
  restoreAuthorName,
  restoreCommentContent,
} from '../../domain/models/comment'
import { listComments } from '../list-comments'
import { InMemoryCommentRepository } from './in-memory-test-doubles'

describe('listComments', () => {
  const ARTICLE_ID = ArticleId('article-1')
  const OTHER_ARTICLE_ID = ArticleId('article-2')

  const makeComment = (id: string, articleId: string, at: string) =>
    createComment({
      id: CommentId(id),
      articleId,
      authorName: restoreAuthorName('読者'),
      content: restoreCommentContent('コメント内容'),
      now: at,
    })

  it('指定した記事のコメント一覧を返す', async () => {
    const commentRepository = new InMemoryCommentRepository()
    await commentRepository.save(
      makeComment('c1', ARTICLE_ID, '2025-01-15T10:00:00.000Z'),
    )
    await commentRepository.save(
      makeComment('c2', ARTICLE_ID, '2025-01-15T11:00:00.000Z'),
    )
    await commentRepository.save(
      makeComment('c3', OTHER_ARTICLE_ID, '2025-01-15T12:00:00.000Z'),
    )

    const result = await listComments(ARTICLE_ID, { commentRepository })

    expect(result.comments).toHaveLength(2)
    expect(result.comments.map((c) => c.id)).toEqual(['c1', 'c2'])
  })

  it('コメントがない場合は空配列を返す', async () => {
    const commentRepository = new InMemoryCommentRepository()

    const result = await listComments(ARTICLE_ID, { commentRepository })

    expect(result.comments).toHaveLength(0)
  })

  it('コメントは投稿日時の昇順で返す', async () => {
    const commentRepository = new InMemoryCommentRepository()
    await commentRepository.save(
      makeComment('c2', ARTICLE_ID, '2025-01-15T11:00:00.000Z'),
    )
    await commentRepository.save(
      makeComment('c1', ARTICLE_ID, '2025-01-15T10:00:00.000Z'),
    )

    const result = await listComments(ARTICLE_ID, { commentRepository })

    expect(result.comments.map((c) => c.id)).toEqual(['c1', 'c2'])
  })
})
