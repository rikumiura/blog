import type { ArticleRepository } from '@/core/ports/article-repository'
import type {
  Article,
  ArticleDetail,
  CreateArticleInput,
  PaginatedResponse,
  UpdateArticleInput,
} from '@/core/types/article'
import { apiClient } from '@/lib/api-client'
import { throwApiError } from '@/lib/api-error'

function toArticle(data: {
  publicId: string
  title: string
  status: string
  tags: string[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  scheduledAt: string | null
}): Article {
  if (data.status === 'published' && data.publishedAt !== null) {
    return {
      publicId: data.publicId,
      title: data.title,
      tags: data.tags,
      status: 'published',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      publishedAt: data.publishedAt,
      scheduledAt: data.scheduledAt,
    }
  }
  if (data.status === 'scheduled' && data.scheduledAt !== null) {
    return {
      publicId: data.publicId,
      title: data.title,
      tags: data.tags,
      status: 'scheduled',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      publishedAt: null,
      scheduledAt: data.scheduledAt,
    }
  }
  return {
    publicId: data.publicId,
    title: data.title,
    tags: data.tags,
    status: 'draft',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    publishedAt: null,
    scheduledAt: null,
  }
}

/** Hono RPCクライアントによるArticleRepositoryの実装 */
export const articleApi: ArticleRepository = {
  async findAll(params?: {
    page: number
    limit: number
    tags?: string[]
  }): Promise<PaginatedResponse<Article>> {
    const query = params ?? { page: 1, limit: 20 }
    const res = await apiClient.api.articles.$get({
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
      items: data.items.map(toArticle),
      totalCount: data.totalCount,
      page: data.page,
      limit: data.limit,
      totalPages: data.totalPages,
    }
  },

  async findByPublicId(publicId: string): Promise<ArticleDetail> {
    const res = await apiClient.api.articles[':publicId'].$get({
      param: { publicId },
    })
    if (!res.ok) {
      throw new Error(`記事の取得に失敗しました: ${res.status}`)
    }
    const data = await res.json()
    return { ...toArticle(data), body: data.body }
  },

  async create(input: CreateArticleInput): Promise<Article> {
    const res = await apiClient.api.articles.$post({
      json: {
        title: input.title,
        body: input.body,
        tags: input.tags,
        publish: input.publish ?? false,
      },
    })
    if (!res.ok) {
      await throwApiError(res, '記事の作成に失敗しました')
    }
    const data = await res.json()
    return toArticle(data)
  },

  async update(
    publicId: string,
    input: UpdateArticleInput,
  ): Promise<ArticleDetail> {
    const res = await apiClient.api.articles[':publicId'].$patch({
      param: { publicId },
      json: input,
    })
    if (!res.ok) {
      await throwApiError(res, '記事の更新に失敗しました')
    }
    const data = await res.json()
    return { ...toArticle(data), body: data.body }
  },

  async publish(publicId: string): Promise<Article> {
    const res = await apiClient.api.articles[':publicId'].publish.$patch({
      param: { publicId },
    })
    if (!res.ok) {
      await throwApiError(res, '記事の公開に失敗しました')
    }
    const data = await res.json()
    return toArticle(data)
  },

  async schedule(publicId: string, scheduledAt: string): Promise<Article> {
    const res = await apiClient.api.articles[':publicId'].schedule.$patch({
      param: { publicId },
      json: { scheduledAt },
    })
    if (!res.ok) {
      await throwApiError(res, '予約公開の設定に失敗しました')
    }
    const data = await res.json()
    return toArticle(data)
  },

  async cancelSchedule(publicId: string): Promise<Article> {
    const res = await apiClient.api.articles[':publicId'][
      'cancel-schedule'
    ].$patch({
      param: { publicId },
    })
    if (!res.ok) {
      await throwApiError(res, '予約の取消に失敗しました')
    }
    const data = await res.json()
    return toArticle(data)
  },

  async delete(publicId: string): Promise<void> {
    const res = await apiClient.api.articles[':publicId'].$delete({
      param: { publicId },
    })
    if (!res.ok) {
      throw new Error(`記事の削除に失敗しました: ${res.status}`)
    }
  },

  async updateTags(publicId: string, tags: string[]): Promise<string[]> {
    const res = await apiClient.api.articles[':publicId'].tags.$patch({
      param: { publicId },
      json: { tags },
    })
    if (!res.ok) {
      throw new Error(`タグの更新に失敗しました: ${res.status}`)
    }
    const data = await res.json()
    return data.tags
  },
}
