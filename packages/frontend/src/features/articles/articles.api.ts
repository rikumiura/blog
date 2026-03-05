import type { AppType } from '@my-blog/backend/src/index'
import { hc } from 'hono/client'
import type { ArticleRepository } from '@/core/ports/article-repository'
import type { Article } from '@/core/types/article'

const client = hc<AppType>(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787',
)

function toArticle(data: Record<string, unknown>): Article {
  return {
    id: data.id as string,
    publicId: data.publicId as string,
    title: data.title as string,
    bodyKey: data.bodyKey as string,
    status: data.status as Article['status'],
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
    publishedAt: (data.publishedAt as string) ?? null,
  }
}

/** Hono RPCクライアントによるArticleRepositoryの実装 */
export const articleApi: ArticleRepository = {
  async findAll(): Promise<Article[]> {
    const res = await client.api.articles.$get()
    if (!res.ok) {
      throw new Error(`記事一覧の取得に失敗しました: ${res.status}`)
    }
    const data = await res.json()
    return data.map(toArticle)
  },

  async create(input: { title: string; body: string }): Promise<Article> {
    const res = await client.api.articles.$post({
      json: input,
    })
    if (!res.ok) {
      throw new Error(`記事の作成に失敗しました: ${res.status}`)
    }
    const data = await res.json()
    return toArticle(data)
  },
}
