import type { ArticleId, BodyKey, PublicArticleId } from '../models/article'
import type { TagId } from '../models/tag'

export interface ArticleIdGenerator {
  generateArticleId(): ArticleId
  generatePublicArticleId(): PublicArticleId
  generateBodyKey(): BodyKey
  generateTagId(): TagId
}
