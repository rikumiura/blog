import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createDbClient } from './infrastructure/database'
import { DrizzlePostRepository } from './infrastructure/repositories/drizzle-post-repository'
import { listPosts } from './use-cases/list-posts'

type Bindings = {
  DB: D1Database
}

const app = new Hono<{ Bindings: Bindings }>()

// フロントエンド（Viteのデフォルトポート5173）からのアクセスを許可
app.use('/*', cors())

// APIエンドポイントの作成
const routes = app
  .get('/api/hello', (c) => {
    return c.json({
      message: 'Hello World from Hono & Cloudflare Workers!'
    })
  })
  .get('/api/posts', async (c) => {
    const db = createDbClient(c.env.DB)
    const repository = new DrizzlePostRepository(db)
    const result = await listPosts(repository)
    return c.json(result)
  })

// フロントエンドで使うために型をエクスポート（これが超重要！）
export type AppType = typeof routes

export default app
