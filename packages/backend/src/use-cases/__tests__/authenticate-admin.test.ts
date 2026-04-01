import { describe, expect, it, vi } from 'vitest'
import type { PasswordHasher } from '../../domain/ports/password-hasher'
import type { TokenGenerator } from '../../domain/ports/token-generator'
import { authenticateAdmin } from '../authenticate-admin'

class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`
  }
  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`
  }
}

class FakeTokenGenerator implements TokenGenerator {
  async generate(payload: { sub: string }): Promise<string> {
    return `token:${payload.sub}`
  }
  async verify(token: string): Promise<{ sub: string } | null> {
    if (token.startsWith('token:')) {
      return { sub: token.slice(6) }
    }
    return null
  }
}

describe('authenticateAdmin', () => {
  const setup = () => {
    const passwordHasher = new FakePasswordHasher()
    const tokenGenerator = new FakeTokenGenerator()
    const adminUsername = 'admin'
    const adminPasswordHash = 'hashed:correct-password'
    return { passwordHasher, tokenGenerator, adminUsername, adminPasswordHash }
  }

  it('正しい認証情報でトークンが返される', async () => {
    const deps = setup()

    const result = await authenticateAdmin(
      { username: 'admin', password: 'correct-password' },
      deps,
    )

    expect(result).toEqual({
      status: 'authenticated',
      token: 'token:admin',
    })
  })

  it('ユーザー名が間違っている場合は認証失敗', async () => {
    const deps = setup()

    const result = await authenticateAdmin(
      { username: 'wrong-user', password: 'correct-password' },
      deps,
    )

    expect(result).toEqual({
      status: 'invalid_credentials',
    })
  })

  it('パスワードが間違っている場合は認証失敗', async () => {
    const deps = setup()

    const result = await authenticateAdmin(
      { username: 'admin', password: 'wrong-password' },
      deps,
    )

    expect(result).toEqual({
      status: 'invalid_credentials',
    })
  })

  it('ユーザー名が空の場合は認証失敗', async () => {
    const deps = setup()

    const result = await authenticateAdmin(
      { username: '', password: 'correct-password' },
      deps,
    )

    expect(result).toEqual({
      status: 'invalid_credentials',
    })
  })

  it('パスワードが空の場合は認証失敗', async () => {
    const deps = setup()

    const result = await authenticateAdmin(
      { username: 'admin', password: '' },
      deps,
    )

    expect(result).toEqual({
      status: 'invalid_credentials',
    })
  })

  it('ユーザー名が異なる場合もパスワード検証が実行される（タイミング攻撃対策）', async () => {
    const deps = setup()
    const verifySpy = vi.spyOn(deps.passwordHasher, 'verify')

    await authenticateAdmin(
      { username: 'wrong-user', password: 'some-password' },
      deps,
    )

    expect(verifySpy).toHaveBeenCalledOnce()
    expect(verifySpy).toHaveBeenCalledWith(
      'some-password',
      deps.adminPasswordHash,
    )
  })

  it('PasswordHasher.verify がエラーをスローした場合は伝播する', async () => {
    const deps = setup()
    vi.spyOn(deps.passwordHasher, 'verify').mockRejectedValue(
      new Error('ハッシュ処理エラー'),
    )

    await expect(
      authenticateAdmin(
        { username: 'admin', password: 'correct-password' },
        deps,
      ),
    ).rejects.toThrow('ハッシュ処理エラー')
  })

  it('TokenGenerator.generate がエラーをスローした場合は伝播する', async () => {
    const deps = setup()
    vi.spyOn(deps.tokenGenerator, 'generate').mockRejectedValue(
      new Error('トークン生成エラー'),
    )

    await expect(
      authenticateAdmin(
        { username: 'admin', password: 'correct-password' },
        deps,
      ),
    ).rejects.toThrow('トークン生成エラー')
  })
})
