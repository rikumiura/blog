import type { ArticleRepository } from '@/core/ports/article-repository'
import type {
  Article,
  ArticleDetail,
  CreateArticleInput,
  UpdateArticleInput,
} from '@/core/types/article'
import { apiClient } from '@/lib/api-client'

function toArticle(data: {
  publicId: string
  title: string
  status: string
  tags: string[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
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
  }
}

function extractErrorMessage(data: unknown): string | undefined {
  if (data !== null && typeof data === 'object' && 'error' in data) {
    const { error } = data as Record<string, unknown>
    if (typeof error === 'string') return error
  }
  return undefined
}

/** Hono RPCクライアントによるArticleRepositoryの実装 */
export const articleApi: ArticleRepository = {
  async findAll(): Promise<Article[]> {
    const res = await apiClient.api.articles.$get()
    if (!res.ok) {
      throw new Error(`記事一覧の取得に失敗しました: ${res.status}`)
    }
    const data = await res.json()
    return data.map(toArticle)
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
      const errorData = await res.json().catch(() => null)
      const message =
        extractErrorMessage(errorData) ??
        `記事の作成に失敗しました: ${res.status}`
      throw new Error(message)
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
      const errorData = await res.json().catch(() => null)
      const message =
        extractErrorMessage(errorData) ??
        `記事の更新に失敗しました: ${res.status}`
      throw new Error(message)
    }
    const data = await res.json()
    return { ...toArticle(data), body: data.body }
  },

  async publish(publicId: string): Promise<Article> {
    const res = await apiClient.api.articles[':publicId'].publish.$patch({
      param: { publicId },
    })
    if (!res.ok) {
      throw new Error(`記事の公開に失敗しました: ${res.status}`)
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
