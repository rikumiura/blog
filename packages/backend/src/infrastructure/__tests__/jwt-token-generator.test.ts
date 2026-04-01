import { describe, expect, it, vi } from 'vitest'
import { JwtTokenGenerator } from '../auth/jwt-token-generator'

describe('JwtTokenGenerator', () => {
  const secret = 'test-secret-key'

  describe('constructor', () => {
    it('空のシークレットでエラーがスローされる', () => {
      expect(() => new JwtTokenGenerator('')).toThrow(
        'JWT_SECRET が設定されていません',
      )
    })
  })

  describe('generate', () => {
    it('JWTトークンを生成できる', async () => {
      const generator = new JwtTokenGenerator(secret)

      const token = await generator.generate({ sub: 'admin' })

      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('異なるsubで異なるトークンが生成される', async () => {
      const generator = new JwtTokenGenerator(secret)

      const token1 = await generator.generate({ sub: 'user1' })
      const token2 = await generator.generate({ sub: 'user2' })

      expect(token1).not.toBe(token2)
    })
  })

  describe('verify', () => {
    it('生成したトークンを正しく検証できる', async () => {
      const generator = new JwtTokenGenerator(secret)
      const token = await generator.generate({ sub: 'admin' })

      const payload = await generator.verify(token)

      expect(payload).toEqual({ sub: 'admin' })
    })

    it('異なるシークレットで生成されたトークンはnullを返す', async () => {
      const generator1 = new JwtTokenGenerator('secret-1')
      const generator2 = new JwtTokenGenerator('secret-2')
      const token = await generator1.generate({ sub: 'admin' })

      const payload = await generator2.verify(token)

      expect(payload).toBeNull()
    })

    it('不正な文字列はnullを返す', async () => {
      const generator = new JwtTokenGenerator(secret)

      const payload = await generator.verify('invalid-token')

      expect(payload).toBeNull()
    })

    it('空文字列はnullを返す', async () => {
      const generator = new JwtTokenGenerator(secret)

      const payload = await generator.verify('')

      expect(payload).toBeNull()
    })

    it('期限切れトークンはnullを返す', async () => {
      const generator = new JwtTokenGenerator(secret)

      // 過去の日時を返すように Date.now をモック
      const pastTime = Date.now() - 25 * 60 * 60 * 1000 // 25時間前
      vi.spyOn(Date, 'now').mockReturnValue(pastTime)
      const token = await generator.generate({ sub: 'admin' })
      vi.restoreAllMocks()

      // 現在時刻で検証すると期限切れ
      const payload = await generator.verify(token)

      expect(payload).toBeNull()
    })

    it('subが文字列でないペイロードはnullを返す', async () => {
      // hono/jwt の sign を直接使って sub を数値にしたトークンを生成
      const { sign } = await import('hono/jwt')
      const token = await sign(
        {
          sub: 123,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        secret,
      )
      const generator = new JwtTokenGenerator(secret)

      const payload = await generator.verify(token)

      expect(payload).toBeNull()
    })
  })
})
