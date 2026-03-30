import { describe, expect, it } from 'vitest'
import { Pbkdf2PasswordHasher } from '../auth/pbkdf2-password-hasher'

describe('Pbkdf2PasswordHasher', () => {
  const hasher = new Pbkdf2PasswordHasher()

  it('パスワードをハッシュ化できる', async () => {
    const hash = await hasher.hash('test-password')

    // salt:key の形式（16バイト=32文字 + ":" + 32バイト=64文字）
    expect(hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{64}$/)
  })

  it('同じパスワードでもソルトにより異なるハッシュになる', async () => {
    const hash1 = await hasher.hash('test-password')
    const hash2 = await hasher.hash('test-password')

    expect(hash1).not.toBe(hash2)
  })

  it('正しいパスワードで検証が成功する', async () => {
    const hash = await hasher.hash('my-password')

    const result = await hasher.verify('my-password', hash)

    expect(result).toBe(true)
  })

  it('間違ったパスワードで検証が失敗する', async () => {
    const hash = await hasher.hash('my-password')

    const result = await hasher.verify('wrong-password', hash)

    expect(result).toBe(false)
  })

  it('不正なハッシュ形式で検証が失敗する', async () => {
    const result = await hasher.verify('password', 'invalid-hash')

    expect(result).toBe(false)
  })
})
