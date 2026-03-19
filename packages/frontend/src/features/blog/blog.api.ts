import type { ArticleDetail, PublishedArticle } from '@/core/types/article'
import { apiClient } from '@/lib/api-client'

function toPublishedArticle(data: {
  publicId: string
  title: string
  tags: string[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}): PublishedArticle {
  return {
    publicId: data.publicId,
    title: data.title,
    tags: data.tags,
    status: 'published',
    publishedAt: data.publishedAt ?? data.updatedAt,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  }
}

export const blogApi = {
  async findAll(): Promise<PublishedArticle[]> {
    const res = await apiClient.api.public.articles.$get()
    if (!res.ok) {
      throw new Error(`記事一覧の取得に失敗しました: ${res.status}`)
    }
    const data = await res.json()
    return data.map(toPublishedArticle)
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
