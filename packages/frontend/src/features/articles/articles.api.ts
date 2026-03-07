import type { ArticleRepository } from '@/core/ports/article-repository'
import type { Article } from '@/core/types/article'
import { apiClient } from '@/lib/api-client'

function toArticle(data: {
  publicId: string
  title: string
  status: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}): Article {
  if (data.status === 'published' && data.publishedAt !== null) {
    return {
      publicId: data.publicId,
      title: data.title,
      status: 'published',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      publishedAt: data.publishedAt,
    }
  }
  return {
    publicId: data.publicId,
    title: data.title,
    status: 'draft',
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    publishedAt: null,
  }
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

  async findByPublicId(publicId: string): Promise<Article> {
    const res = await apiClient.api.articles[':publicId'].$get({
      param: { publicId },
    })
    if (!res.ok) {
      throw new Error(`記事の取得に失敗しました: ${res.status}`)
    }
    const data = await res.json()
    return toArticle(data)
  },

  async create(input: { title: string; body: string }): Promise<Article> {
    const res = await apiClient.api.articles.$post({ json: input })
    if (!res.ok) {
      throw new Error(`記事の作成に失敗しました: ${res.status}`)
    }
    const data = await res.json()
    return toArticle(data)
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
}
