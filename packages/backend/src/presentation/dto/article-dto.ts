import type { Article } from '../../domain/models/article'
import type { Tag } from '../../domain/models/tag'
import type { PaginatedResult } from '../../domain/ports/article-repository'
import type { TagRepository } from '../../domain/ports/tag-repository'

export type ArticleSummaryDto = {
  publicId: string
  title: string
  status: 'draft' | 'published' | 'scheduled'
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  scheduledAt: string | null
  tags: string[]
}

export type ArticleDetailDto = ArticleSummaryDto & { body: string }

export type PaginatedArticlesDto = {
  items: ArticleSummaryDto[]
  totalCount: number
  page: number
  limit: number
  totalPages: number
}

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
    scheduledAt: article.scheduledAt,
    tags: tags.map((t) => String(t.name)),
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

/** ページネーション付き記事一覧をDTO化するヘルパー */
export async function toPaginatedArticlesDto(
  paginatedResult: PaginatedResult<Article>,
  page: number,
  limit: number,
  tagRepository: TagRepository,
): Promise<PaginatedArticlesDto> {
  const { items, totalCount } = paginatedResult
  const articleIds = items.map((a) => a.id)
  const tagsMap =
    articleIds.length > 0
      ? await tagRepository.findByArticleIds(articleIds)
      : new Map<string, Tag[]>()

  return {
    items: items.map((article) =>
      toArticleSummaryDto(article, tagsMap.get(article.id) ?? []),
    ),
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  }
}
