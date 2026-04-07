import { describe, expect, it } from 'vitest'
import {
  CommentId,
  createAuthorName,
  createComment,
  createCommentContent,
  restoreAuthorName,
  restoreCommentContent,
} from '../comment'

describe('createAuthorName', () => {
  it('有効な名前を返す', () => {
    const result = createAuthorName('田中太郎')
    expect(result).toEqual({ ok: true, value: '田中太郎' })
  })

  it('前後の空白をトリムする', () => {
    const result = createAuthorName('  田中太郎  ')
    expect(result).toEqual({ ok: true, value: '田中太郎' })
  })

  it('空文字はエラー', () => {
    const result = createAuthorName('')
    expect(result).toEqual({ ok: false, message: '投稿者名は空にできません' })
  })

  it('空白のみはエラー', () => {
    const result = createAuthorName('   ')
    expect(result).toEqual({ ok: false, message: '投稿者名は空にできません' })
  })

  it('50文字はOK', () => {
    const result = createAuthorName('あ'.repeat(50))
    expect(result.ok).toBe(true)
  })

  it('51文字はエラー', () => {
    const result = createAuthorName('あ'.repeat(51))
    expect(result).toEqual({
      ok: false,
      message: '投稿者名は50文字以内にしてください',
    })
  })
})

describe('createCommentContent', () => {
  it('有効な本文を返す', () => {
    const result = createCommentContent('参考になりました。')
    expect(result).toEqual({ ok: true, value: '参考になりました。' })
  })

  it('前後の空白をトリムする', () => {
    const result = createCommentContent('  本文  ')
    expect(result).toEqual({ ok: true, value: '本文' })
  })

  it('空文字はエラー', () => {
    const result = createCommentContent('')
    expect(result).toEqual({
      ok: false,
      message: 'コメント本文は空にできません',
    })
  })

  it('500文字はOK', () => {
    const result = createCommentContent('あ'.repeat(500))
    expect(result.ok).toBe(true)
  })

  it('501文字はエラー', () => {
    const result = createCommentContent('あ'.repeat(501))
    expect(result).toEqual({
      ok: false,
      message: 'コメント本文は500文字以内にしてください',
    })
  })
})

describe('createComment', () => {
  it('コメントエンティティを生成する', () => {
    const comment = createComment({
      id: CommentId('comment-1'),
      articleId: 'article-1',
      authorName: restoreAuthorName('田中太郎'),
      content: restoreCommentContent('参考になりました。'),
      now: '2025-01-15T10:00:00.000Z',
    })

    expect(comment).toEqual({
      id: 'comment-1',
      articleId: 'article-1',
      authorName: '田中太郎',
      content: '参考になりました。',
      createdAt: '2025-01-15T10:00:00.000Z',
    })
  })
})
