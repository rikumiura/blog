import { describe, expect, it } from 'vitest'
import { Sha256PasswordHasher } from '../auth/sha256-password-hasher'

describe('Sha256PasswordHasher', () => {
  const hasher = new Sha256PasswordHasher()

  it('パスワードをハッシュ化できる', async () => {
    const hash = await hasher.hash('test-password')

    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('同じパスワードは同じハッシュになる', async () => {
    const hash1 = await hasher.hash('test-password')
    const hash2 = await hasher.hash('test-password')

    expect(hash1).toBe(hash2)
  })

  it('異なるパスワードは異なるハッシュになる', async () => {
    const hash1 = await hasher.hash('password-1')
    const hash2 = await hasher.hash('password-2')

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
})
