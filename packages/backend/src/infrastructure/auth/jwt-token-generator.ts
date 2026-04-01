import { sign, verify } from 'hono/jwt'
import type { TokenGenerator } from '../../domain/ports/token-generator'

/** Hono JWT を使ったトークンジェネレーター */
export class JwtTokenGenerator implements TokenGenerator {
  constructor(private readonly secret: string) {
    if (!secret) {
      throw new Error('JWT_SECRET が設定されていません')
    }
  }

  async generate(payload: { sub: string }): Promise<string> {
    return await sign(
      {
        sub: payload.sub,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24時間
      },
      this.secret,
    )
  }

  async verify(token: string): Promise<{ sub: string } | null> {
    try {
      const payload = await verify(token, this.secret, 'HS256')
      if (typeof payload.sub === 'string') {
        return { sub: payload.sub }
      }
      return null
    } catch (error) {
      console.debug('JWT検証失敗:', error)
      return null
    }
  }
}
