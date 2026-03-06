import type { ArticleId, BodyKey, PublicArticleId } from '../models/article'

export interface ArticleIdGenerator {
  generateArticleId(): ArticleId
  generatePublicArticleId(): PublicArticleId
  generateBodyKey(): BodyKey
}
