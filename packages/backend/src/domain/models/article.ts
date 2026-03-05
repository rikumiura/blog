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

// --- Value Objects ---

export type ArticleStatus = 'draft' | 'published'

// --- Entity ---

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

// --- Factory / Domain Logic ---

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

export function createDraftArticle(params: {
  id: ArticleId
  publicId: PublicArticleId
  title: Title
  bodyKey: BodyKey
}): Article {
  const now = new Date().toISOString()
  return {
    id: params.id,
    publicId: params.publicId,
    title: params.title,
    bodyKey: params.bodyKey,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  }
}

export function publishArticle(article: Article): Article {
  if (article.status === 'published') {
    throw new Error('既に公開済みの記事です')
  }
  const now = new Date().toISOString()
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
): Article {
  return {
    ...article,
    title: params.title,
    updatedAt: new Date().toISOString(),
  }
}
