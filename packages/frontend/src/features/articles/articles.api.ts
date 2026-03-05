import type { AppType } from '@my-blog/backend/src/index'
import { hc } from 'hono/client'
import type { ArticleRepository } from '@/core/ports/article-repository'
import type { Article } from '@/core/types/article'

const client = hc<AppType>(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787',
)

function toArticle({
  id,
  publicId,
  title,
  bodyKey,
  status,
  createdAt,
  updatedAt,
  publishedAt,
}: {
  id: string
  publicId: string
  title: string
  bodyKey: string
  status: string
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}): Article {
  return {
    id,
    publicId,
    title,
    bodyKey,
    status,
    createdAt,
    updatedAt,
    publishedAt,
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
