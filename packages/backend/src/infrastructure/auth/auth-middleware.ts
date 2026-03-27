import type { Context, Next } from 'hono'
import type { TokenGenerator } from '../../domain/ports/token-generator'

/** JWT 認証ミドルウェア: Authorization ヘッダーからトークンを検証する */
export function createAuthMiddleware(
  getTokenGenerator: (c: Context) => TokenGenerator,
) {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: '認証が必要です' }, 401)
    }

    const token = authHeader.slice(7)
    const tokenGenerator = getTokenGenerator(c)
    const payload = await tokenGenerator.verify(token)

    if (!payload) {
      return c.json({ error: 'トークンが無効です' }, 401)
    }

    await next()
  }
}
