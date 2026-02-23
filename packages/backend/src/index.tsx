import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// フロントエンド（Viteのデフォルトポート5173）からのアクセスを許可
app.use('/*', cors())

// APIエンドポイントの作成
const routes = app.get('/api/hello', (c) => {
  return c.json({
    message: 'Hello World from Hono & Cloudflare Workers!'
  })
})

// フロントエンドで使うために型をエクスポート（これが超重要！）
export type AppType = typeof routes

export default app
