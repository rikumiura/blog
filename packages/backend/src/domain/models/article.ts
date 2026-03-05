// --- Branded Types ---

declare const ArticleIdBrand: unique symbol
export type ArticleId = string & { readonly [ArticleIdBrand]: never }

declare const PublicArticleIdBrand: unique symbol
export type PublicArticleId = string & {
  readonly [PublicArticleIdBrand]: never
}

declare const TitleBrand: unique symbol
export type Title = string & { readonly [TitleBrand]: never }

declare const BodyKeyBrand: unique symbol
export type BodyKey = string & { readonly [BodyKeyBrand]: never }

// --- 値オブジェクト ---

export type ArticleStatus = 'draft' | 'published'

// --- エンティティ ---

export type Article = {
  id: ArticleId
  publicId: PublicArticleId
  title: Title
  bodyKey: BodyKey
  status: ArticleStatus
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

// --- ファクトリ・ドメインロジック ---

const TITLE_MAX_LENGTH = 100

export function createTitle(value: string): Title {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throw new Error('タイトルは空にできません')
  }
  if (trimmed.length > TITLE_MAX_LENGTH) {
    throw new Error(`タイトルは${TITLE_MAX_LENGTH}文字以内にしてください`)
  }
  return trimmed as Title
}

// 日時はバックエンド側で採番し、パラメータとして渡す（テスト容易性の向上）
export function createDraftArticle(params: {
  id: ArticleId
  publicId: PublicArticleId
  title: Title
  bodyKey: BodyKey
  now: string
}): Article {
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

export function publishArticle(article: Article, now: string): Article {
  if (article.status === 'published') {
    throw new Error('既に公開済みの記事です')
  }
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
