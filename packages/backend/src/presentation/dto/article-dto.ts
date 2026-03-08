import type { Article } from '../../domain/models/article'

export type ArticleSummaryDto = {
  publicId: string
  title: string
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

export type ArticleDetailDto = ArticleSummaryDto & { body: string }

export function toArticleSummaryDto(article: Article): ArticleSummaryDto {
  return {
    publicId: article.publicId,
    title: article.title,
    status: article.status,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    publishedAt: article.publishedAt,
  }
}

export function toArticleDetailDto(
  article: Article,
  body: string,
): ArticleDetailDto {
  return {
    ...toArticleSummaryDto(article),
    body,
  }
}
