/** 記事のステータス */
export type ArticleStatus = 'draft' | 'published'

/** 記事のドメイン型（React非依存） */
export type Article = {
  id: string
  publicId: string
  title: string
  bodyKey: string
  status: ArticleStatus
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

/** 記事作成の入力型 */
export type CreateArticleInput = {
  title: string
  body: string
}
