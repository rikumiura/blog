import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { createDbClient } from './infrastructure/database'
import { ArticleIdGeneratorImpl } from './infrastructure/id/article-id-generator-impl'
import { DrizzleArticleRepository } from './infrastructure/repositories/drizzle-article-repository'
import { DrizzleCompanyRepository } from './infrastructure/repositories/drizzle-company-repository'
import { R2BodyStorage } from './infrastructure/storage/r2-body-storage'
import { createArticle } from './use-cases/create-article'
import { listArticles } from './use-cases/list-articles'
import { listCompanies } from './use-cases/list-companies'

type Bindings = {
  DB: D1Database
  ARTICLE_BUCKET: R2Bucket
}

const app = new Hono<{ Bindings: Bindings }>()

// フロントエンド（Viteのデフォルトポート5173）からのアクセスを許可
app.use('/*', cors())

const createArticleSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  body: z.string(),
})

// APIエンドポイントの作成
const routes = app
  .get('/api/hello', (c) => {
    return c.json({
      message: 'Hello World from Hono & Cloudflare Workers!',
    })
  })
  .get('/api/companies', async (c) => {
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleCompanyRepository(db)
    const result = await listCompanies(repository)
    return c.json(result)
  })
  .get('/api/articles', async (c) => {
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)
    const result = await listArticles(repository)
    return c.json(result)
  })
  .post('/api/articles', zValidator('json', createArticleSchema), async (c) => {
    const input = c.req.valid('json')
    const db = createDbClient(c.env.DB)
    const repository = new DrizzleArticleRepository(db)
    const bodyStorage = new R2BodyStorage(c.env.ARTICLE_BUCKET)
    const idGenerator = new ArticleIdGeneratorImpl()

    try {
      const article = await createArticle(input, {
        repository,
        bodyStorage,
        idGenerator,
      })
      return c.json(article, 201)
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400)
      }
      throw error
    }
  })

// フロントエンドで使うために型をエクスポート（これが超重要！）
export type AppType = typeof routes

export default app
