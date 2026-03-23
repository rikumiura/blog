/** 記事のステータス */
export type ArticleStatus = 'draft' | 'published' | 'scheduled'

/** 記事の共通フィールド */
type ArticleBase = {
  publicId: string
  title: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

/** 下書き記事 */
export type DraftArticle = ArticleBase & {
  status: 'draft'
  publishedAt: null
  scheduledAt: null
}

/** 予約公開記事 */
export type ScheduledArticle = ArticleBase & {
  status: 'scheduled'
  publishedAt: null
  scheduledAt: string
}

/** 公開済み記事 */
export type PublishedArticle = ArticleBase & {
  status: 'published'
  publishedAt: string
  scheduledAt: string | null
}

/** 記事のドメイン型（判別共用体で status と publishedAt/scheduledAt の整合性を型レベルで保証） */
export type Article = DraftArticle | ScheduledArticle | PublishedArticle

/** 記事詳細（本文を含む） */
export type ArticleDetail = Article & { body: string }

/** 記事作成の入力型 */
export type CreateArticleInput = {
  title: string
  body: string
  tags: string[]
  publish?: boolean
}

/** 記事更新の入力型 */
export type UpdateArticleInput = {
  title?: string
  body?: string
  tags?: string[]
}

/** ページネーション付きレスポンス */
export type PaginatedResponse<T> = {
  items: T[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}
