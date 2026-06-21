import type { ArticleId, BodyKey, PublicArticleId } from '../models/article'
import type { CommentId } from '../models/comment'
import type { TagId } from '../models/tag'

export interface ArticleIdGenerator {
  generateArticleId(): ArticleId
  generatePublicArticleId(): PublicArticleId
  generateBodyKey(): BodyKey
  generateTagId(): TagId
  generateCommentId(): CommentId
}
