import type { AppType } from '@my-blog/backend/src/index'
import { hc } from 'hono/client'
import type { ArticleRepository } from '@/core/ports/article-repository'
import type { Article } from '@/core/types/article'

const client = hc<AppType>(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787',
)

/** Hono RPCクライアントによるArticleRepositoryの実装 */
export const articleApi: ArticleRepository = {
  async findAll(): Promise<Article[]> {
    const res = await client.api.articles.$get()
    if (!res.ok) {
      throw new Error(`記事一覧の取得に失敗しました: ${res.status}`)
    }
    return await res.json()
  },

  async create(input: { title: string; body: string }): Promise<Article> {
    const res = await client.api.articles.$post({
      json: input,
    })
    if (!res.ok) {
      throw new Error(`記事の作成に失敗しました: ${res.status}`)
    }
    return await res.json()
  },
}
