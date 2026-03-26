import { z } from 'zod'

// --- 共通 ---

export const ErrorResponseContract = z.object({
  error: z.string(),
})

// --- 記事 ---

const articleStatusContract = z.enum(['draft', 'published', 'scheduled'])

export const ArticleSummaryContract = z.object({
  publicId: z.string(),
  title: z.string(),
  status: articleStatusContract,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  publishedAt: z.string().datetime().nullable(),
  scheduledAt: z.string().datetime().nullable(),
  tags: z.array(z.string()),
})

export const ArticleDetailContract = ArticleSummaryContract.extend({
  body: z.string(),
})

export const PaginatedArticlesContract = z.object({
  items: z.array(ArticleSummaryContract),
  totalCount: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  totalPages: z.number().int().min(0),
})

// --- タグ ---

export const TagsResponseContract = z.object({
  tags: z.array(z.string()),
})
