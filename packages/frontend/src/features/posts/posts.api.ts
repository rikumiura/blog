import type { AppType } from '@my-blog/backend/src/index'
import { hc } from 'hono/client'
import type { PostRepository } from '@/core/ports/post-repository'
import type { Post } from '@/core/types/post'

const client = hc<AppType>(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787',
)

/** Hono RPCクライアントによるPostRepositoryの実装 */
export const postApi: PostRepository = {
  async findAll(): Promise<Post[]> {
    const res = await client.api.posts.$get()
    return await res.json()
  },
}
