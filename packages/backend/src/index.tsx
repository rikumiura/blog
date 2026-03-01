import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createDbClient } from './infrastructure/database'
import { DrizzleCompanyRepository } from './infrastructure/repositories/drizzle-company-repository'
import { listCompanies } from './use-cases/list-companies'

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
  .get('/api/companies', async (c) => {
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleCompanyRepository(db)
    const result = await listCompanies(repository)
    return c.json(result)
  })

// フロントエンドで使うために型をエクスポート（これが超重要！）
export type AppType = typeof routes

export default app
