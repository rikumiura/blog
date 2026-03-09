import type { Article } from '../../domain/models/article'
import type { Tag } from '../../domain/models/tag'

export type ArticleSummaryDto = {
  publicId: string
  title: string
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  tags: string[]
}

export type ArticleDetailDto = ArticleSummaryDto & { body: string }

export function toArticleSummaryDto(
  article: Article,
  tags: Tag[] = [],
): ArticleSummaryDto {
  return {
    publicId: article.publicId,
    title: article.title,
    status: article.status,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    publishedAt: article.publishedAt,
    tags: tags.map((t) => t.name as string),
  }
}

export function toArticleDetailDto(
  article: Article,
  body: string,
  tags: Tag[] = [],
): ArticleDetailDto {
  return {
    ...toArticleSummaryDto(article, tags),
    body,
  }
}
