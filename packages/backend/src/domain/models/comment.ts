// --- Branded Types ---

type Brand<K extends string> = { readonly [P in K]: never }

export type CommentId = string & Brand<'CommentId'>
export type AuthorName = string & Brand<'AuthorName'>
export type CommentContent = string & Brand<'CommentContent'>

function brand<T>(value: string): T {
  return value as T
}

export const CommentId = (value: string): CommentId => brand(value)

// DB復元用: バリデーション済みのデータから復元する（バリデーションなし）
export const restoreAuthorName = (value: string): AuthorName => brand(value)
export const restoreCommentContent = (value: string): CommentContent =>
  brand(value)

// --- エンティティ ---

export type Comment = {
  id: CommentId
  articleId: string
  authorName: AuthorName
  content: CommentContent
  createdAt: string
}

// --- バリデーション ---

const AUTHOR_NAME_MAX_LENGTH = 50
const CONTENT_MAX_LENGTH = 500

export type CreateAuthorNameResult =
  | { ok: true; value: AuthorName }
  | { ok: false; message: string }

export function createAuthorName(value: string): CreateAuthorNameResult {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { ok: false, message: '投稿者名は空にできません' }
  }
  if (trimmed.length > AUTHOR_NAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `投稿者名は${AUTHOR_NAME_MAX_LENGTH}文字以内にしてください`,
    }
  }
  return { ok: true, value: brand<AuthorName>(trimmed) }
}

export type CreateCommentContentResult =
  | { ok: true; value: CommentContent }
  | { ok: false; message: string }

export function createCommentContent(
  value: string,
): CreateCommentContentResult {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { ok: false, message: 'コメント本文は空にできません' }
  }
  if (trimmed.length > CONTENT_MAX_LENGTH) {
    return {
      ok: false,
      message: `コメント本文は${CONTENT_MAX_LENGTH}文字以内にしてください`,
    }
  }
  return { ok: true, value: brand<CommentContent>(trimmed) }
}

// --- ファクトリ ---

export function createComment(params: {
  id: CommentId
  articleId: string
  authorName: AuthorName
  content: CommentContent
  now: string
}): Comment {
  return {
    id: params.id,
    articleId: params.articleId,
    authorName: params.authorName,
    content: params.content,
    createdAt: params.now,
  }
}
