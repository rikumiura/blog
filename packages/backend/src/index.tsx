/// <reference path="../worker-configuration.d.ts" />
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppEnv, Bindings } from './env'
import { createAuthMiddleware } from './infrastructure/auth/auth-middleware'
import { JwtTokenGenerator } from './infrastructure/auth/jwt-token-generator'
import { createDbClient } from './infrastructure/database'
import { DrizzleArticleRepository } from './infrastructure/repositories/drizzle-article-repository'
import { DrizzleBodyKeyDeletionQueue } from './infrastructure/repositories/drizzle-body-key-deletion-queue'
import { R2BodyStorage } from './infrastructure/storage/r2-body-storage'
import { articleRoutes } from './routes/articles'
import { authRoutes } from './routes/auth'
import { commentRoutes } from './routes/comments'
import { imageRoutes } from './routes/images'
import { publicRoutes } from './routes/public'
import { tagRoutes } from './routes/tags'
import { cleanupPendingBodyDeletions } from './use-cases/cleanup-pending-body-deletions'
import { publishScheduledArticles } from './use-cases/publish-scheduled-articles'

const authMiddleware = createAuthMiddleware(
  (c) => new JwtTokenGenerator(c.env.JWT_SECRET),
)

const app = new Hono<AppEnv>()

app.use('/*', cors())

// 管理者用APIに認証ミドルウェアを適用
app.use('/api/articles/*', authMiddleware)
app.use('/api/articles', authMiddleware)
app.use('/api/auth/me', authMiddleware)
app.use('/api/comments/*', authMiddleware)
app.use('/api/images', authMiddleware)
app.use('/api/tags', authMiddleware)
app.use('/api/tags/*', authMiddleware)

const routes = app
  .get('/api/hello', (c) => {
    return c.json({
      message: 'Hello World from Hono & Cloudflare Workers!',
    })
  })
  .route('/api/auth', authRoutes)
  .route('/api/articles', articleRoutes)
  .route('/api/tags', tagRoutes)
  .route('/api/comments', commentRoutes)
  .route('/api/images', imageRoutes)
  .route('/api/public', publicRoutes)

export { app }
export type AppType = typeof routes

// モジュールスコープ: 同一アイソレート内で一度だけスキーマチェックを実行する
let schemaChecked = false

export default {
  async fetch(
    request: Request,
    env: Bindings,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // migration gate: D1マイグレーションが適用済みかを確認する。
    // 未適用の場合（コードとスキーマの一時的なskew）に 503 を返して障害を明示する。
    if (!schemaChecked) {
      try {
        await env.DB.prepare(
          'SELECT 1 FROM pending_body_key_deletions LIMIT 1',
        ).first()
        schemaChecked = true
      } catch (e) {
        console.error(
          'DBスキーマが未適用です。D1マイグレーションを実行してください。',
          e,
        )
        return new Response(
          JSON.stringify({
            error:
              'サービスが一時的に利用できません。しばらく待ってから再度お試しください。',
          }),
          { status: 503, headers: { 'content-type': 'application/json' } },
        )
      }
    }
    return app.fetch(request, env, ctx)
  },
  async scheduled(
    _event: ScheduledEvent,
    env: Bindings,
    _ctx: ExecutionContext,
  ) {
    const db = createDbClient(env.DB)

    try {
      const repository = new DrizzleArticleRepository(db)
      const result = await publishScheduledArticles({
        repository,
        now: () => new Date().toISOString(),
      })
      if (result.publishedCount > 0) {
        console.log(`予約公開: ${result.publishedCount}件の記事を公開しました`)
      }
    } catch (error) {
      console.error('予約公開処理でエラーが発生しました:', error)
    }

    try {
      const bodyKeyDeletionQueue = new DrizzleBodyKeyDeletionQueue(db)
      const bodyStorage = new R2BodyStorage(env.ARTICLE_BUCKET)
      const result = await cleanupPendingBodyDeletions({
        bodyKeyDeletionQueue,
        bodyStorage,
        articleRepository: new DrizzleArticleRepository(db),
      })
      if (result.deletedCount > 0) {
        console.log(
          `R2クリーンアップ: ${result.deletedCount}件の本文を削除しました`,
        )
      }
    } catch (error) {
      console.error('R2クリーンアップ処理でエラーが発生しました:', error)
    }
  },
}
