import { describe, expect, it } from 'vitest'
import { ArticleId } from '../../domain/models/article'
import { CommentId } from '../../domain/models/comment'
import { postComment } from '../post-comment'
import {
  InMemoryArticleRepository,
  InMemoryCommentRepository,
} from './in-memory-test-doubles'

describe('postComment', () => {
  const FIXED_DATE = '2025-01-15T12:00:00.000Z'
  const ARTICLE_ID = ArticleId('article-1')
  const COMMENT_ID = CommentId('comment-1')

  const setup = () => {
    const articleRepository = new InMemoryArticleRepository()
    const commentRepository = new InMemoryCommentRepository()
    const generateCommentId = () => COMMENT_ID
    const now = () => FIXED_DATE
    return { articleRepository, commentRepository, generateCommentId, now }
  }

  it('コメントが正常に保存される', async () => {
    const deps = setup()

    const result = await postComment(
      {
        articleId: ARTICLE_ID,
        authorName: '読者A',
        content: 'とても参考になりました。',
      },
      deps,
    )

    expect(result).toEqual({
      status: 'posted',
      comment: {
        id: COMMENT_ID,
        articleId: ARTICLE_ID,
        authorName: '読者A',
        content: 'とても参考になりました。',
        createdAt: FIXED_DATE,
      },
    })

    const saved = deps.commentRepository.getAll()
    expect(saved).toHaveLength(1)
    expect(saved[0]).toMatchObject({ authorName: '読者A' })
  })

  it('投稿者名が空の場合はバリデーションエラー', async () => {
    const deps = setup()

    const result = await postComment(
      { articleId: ARTICLE_ID, authorName: '  ', content: '本文です' },
      deps,
    )

    expect(result).toEqual({
      status: 'validation_error',
      message: '投稿者名は空にできません',
    })
    expect(deps.commentRepository.getAll()).toHaveLength(0)
  })

  it('投稿者名が50文字を超える場合はバリデーションエラー', async () => {
    const deps = setup()
    const longName = 'あ'.repeat(51)

    const result = await postComment(
      { articleId: ARTICLE_ID, authorName: longName, content: '本文' },
      deps,
    )

    expect(result).toEqual({
      status: 'validation_error',
      message: '投稿者名は50文字以内にしてください',
    })
  })

  it('コメント本文が空の場合はバリデーションエラー', async () => {
    const deps = setup()

    const result = await postComment(
      { articleId: ARTICLE_ID, authorName: '読者A', content: '' },
      deps,
    )

    expect(result).toEqual({
      status: 'validation_error',
      message: 'コメント本文は空にできません',
    })
  })

  it('コメント本文が500文字を超える場合はバリデーションエラー', async () => {
    const deps = setup()
    const longContent = 'あ'.repeat(501)

    const result = await postComment(
      { articleId: ARTICLE_ID, authorName: '読者A', content: longContent },
      deps,
    )

    expect(result).toEqual({
      status: 'validation_error',
      message: 'コメント本文は500文字以内にしてください',
    })
  })

  it('投稿者名の前後の空白はトリムされる', async () => {
    const deps = setup()

    const result = await postComment(
      { articleId: ARTICLE_ID, authorName: '  読者B  ', content: '本文です' },
      deps,
    )

    expect(result.status).toBe('posted')
    if (result.status === 'posted') {
      expect(result.comment.authorName).toBe('読者B')
    }
  })
})
