import type {
  ArticleDetail,
  PaginatedResponse,
  PublishedArticle,
} from '@/core/types/article'
import { apiClient } from '@/lib/api-client'

function toPublishedArticle(data: {
  publicId: string
  title: string
  tags: string[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  scheduledAt?: string | null
}): PublishedArticle {
  return {
    publicId: data.publicId,
    title: data.title,
    tags: data.tags,
    status: 'published',
    publishedAt: data.publishedAt ?? data.updatedAt,
    scheduledAt: data.scheduledAt ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

export const blogApi = {
  async findAll(params?: {
    page: number
    limit: number
    tags?: string[]
  }): Promise<PaginatedResponse<PublishedArticle>> {
    const query = params ?? { page: 1, limit: 20 }
    const res = await apiClient.api.public.articles.$get({
      query: {
        page: String(query.page),
        limit: String(query.limit),
        ...(query.tags && query.tags.length > 0
          ? { tags: query.tags.join(',') }
          : {}),
      },
    })
    if (!res.ok) {
      throw new Error(`記事一覧の取得に失敗しました: ${res.status}`)
    }
    const data = await res.json()
    return {
      items: data.items.map(toPublishedArticle),
      totalCount: data.totalCount,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
    }
  },

  async findByPublicId(publicId: string): Promise<ArticleDetail> {
    const res = await apiClient.api.public.articles[':publicId'].$get({
      param: { publicId },
    })
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('記事が見つかりません')
      }
      throw new Error(`記事の取得に失敗しました: ${res.status}`)
    }
    const data = await res.json()
    return {
      ...toPublishedArticle(data),
      body: data.body,
    }
  },
}
