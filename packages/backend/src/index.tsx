import { createDb, posts } from '@my-blog/db'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

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
    const db = createDb(c.env.DB)
    const allPosts = await db.select().from(posts)
    return c.json(allPosts)
  })

// フロントエンドで使うために型をエクスポート（これが超重要！）
export type AppType = typeof routes

export default app
