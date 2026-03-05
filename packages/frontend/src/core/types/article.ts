/** 記事のステータス */
export type ArticleStatus = 'draft' | 'published'

/** 記事の共通フィールド */
type ArticleBase = {
  id: string
  publicId: string
  title: string
  bodyKey: string
  createdAt: string
  updatedAt: string
}

/** 下書き記事 */
export type DraftArticle = ArticleBase & {
  status: 'draft'
  publishedAt: null
}

/** 公開済み記事 */
export type PublishedArticle = ArticleBase & {
  status: 'published'
  publishedAt: string
}

/** 記事のドメイン型（判別共用体で status と publishedAt の整合性を型レベルで保証） */
export type Article = DraftArticle | PublishedArticle

/** 記事作成の入力型 */
export type CreateArticleInput = {
  title: string
  body: string
}
