import type { ArticleId, BodyKey, PublicArticleId } from '../models/article'

export interface IdGenerator {
  generateArticleId(): ArticleId
  generatePublicArticleId(): PublicArticleId
  generateBodyKey(): BodyKey
}
