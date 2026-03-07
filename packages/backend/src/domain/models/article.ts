// --- Branded Types ---

type Brand<K extends string> = { readonly [P in K]: never }

export type ArticleId = string & Brand<'ArticleId'>
export type PublicArticleId = string & Brand<'PublicArticleId'>
export type Title = string & Brand<'Title'>
export type BodyKey = string & Brand<'BodyKey'>

// Branded Typeのファクトリ関数
// 型の安全性を保ちつつ、asを使わずにブランド型を生成する
function brand<T>(value: string): T {
  return value as T
}

export const ArticleId = (value: string): ArticleId => brand(value)
export const PublicArticleId = (value: string): PublicArticleId => brand(value)
export const BodyKey = (value: string): BodyKey => brand(value)

// DB復元用: バリデーション済みのデータからTitleを復元する（バリデーションなし）
export const restoreTitle = (value: string): Title => brand(value)

// --- 値オブジェクト ---

export type ArticleStatus = 'draft' | 'published'

// --- エンティティ（判別共用体パターン） ---

type ArticleBase = {
  id: ArticleId
  publicId: PublicArticleId
  title: Title
  bodyKey: BodyKey
  createdAt: string
  updatedAt: string
}

export type DraftArticle = ArticleBase & {
  status: 'draft'
  publishedAt: null
}

export type PublishedArticle = ArticleBase & {
  status: 'published'
  publishedAt: string
}

export type Article = DraftArticle | PublishedArticle

// --- ファクトリ・ドメインロジック ---

const TITLE_MAX_LENGTH = 100

export type CreateTitleResult =
  | { ok: true; value: Title }
  | { ok: false; message: string }

export function createTitle(value: string): CreateTitleResult {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { ok: false, message: 'タイトルは空にできません' }
  }
  if (trimmed.length > TITLE_MAX_LENGTH) {
    return { ok: false, message: `タイトルは${TITLE_MAX_LENGTH}文字以内にしてください` }
  }
  return { ok: true, value: brand<Title>(trimmed) }
}

// 日時はバックエンド側で採番し、パラメータとして渡す（テスト容易性の向上）
export function createDraftArticle(params: {
  id: ArticleId
  publicId: PublicArticleId
  title: Title
  bodyKey: BodyKey
  now: string
}): DraftArticle {
  return {
    id: params.id,
    publicId: params.publicId,
    title: params.title,
    bodyKey: params.bodyKey,
    status: 'draft',
    createdAt: params.now,
    updatedAt: params.now,
    publishedAt: null,
  }
}

export function publishArticle(article: DraftArticle, now: string): PublishedArticle {
  return {
    ...article,
    status: 'published',
    updatedAt: now,
    publishedAt: now,
  }
}

export function updateArticleContent(
  article: Article,
  params: { title: Title },
  now: string,
): Article {
  return {
    ...article,
    title: params.title,
    updatedAt: now,
  }
}
