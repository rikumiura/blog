import { HttpResponse, http } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { authApi } from './auth.api'

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('authApi.login', () => {
  it('正常系: 正しい認証情報でトークンが返る', async () => {
    const result = await authApi.login({
      username: 'admin',
      password: 'password',
    })

    expect(result).toEqual({
      status: 'success',
      token: 'mock-jwt-token',
    })
  })

  it('401: 不正な認証情報でエラーが返る', async () => {
    const result = await authApi.login({
      username: 'admin',
      password: 'wrong-password',
    })

    expect(result).toEqual({
      status: 'error',
      message: 'ユーザー名またはパスワードが正しくありません',
    })
  })

  it('400: バリデーションエラーでエラーが返る', async () => {
    server.use(
      http.post(`${baseUrl}/api/auth/login`, () => {
        return HttpResponse.json(
          { error: 'ユーザー名は必須です' },
          { status: 400 },
        )
      }),
    )

    const result = await authApi.login({
      username: '',
      password: 'password',
    })

    expect(result).toEqual({
      status: 'error',
      message: 'ユーザー名は必須です',
    })
  })

  it('422: バリデーションエラーでエラーが返る', async () => {
    server.use(
      http.post(`${baseUrl}/api/auth/login`, () => {
        return HttpResponse.json(
          { error: '不正なリクエスト形式です' },
          { status: 422 },
        )
      }),
    )

    const result = await authApi.login({
      username: 'admin',
      password: 'password',
    })

    expect(result).toEqual({
      status: 'error',
      message: '不正なリクエスト形式です',
    })
  })

  it('401: エラーレスポンスにerrorフィールドがない場合はデフォルトメッセージ', async () => {
    server.use(
      http.post(`${baseUrl}/api/auth/login`, () => {
        return HttpResponse.json({ message: '不明なエラー' }, { status: 401 })
      }),
    )

    const result = await authApi.login({
      username: 'admin',
      password: 'password',
    })

    expect(result).toEqual({
      status: 'error',
      message: 'ログインに失敗しました',
    })
  })

  it('500: サーバーエラーではthrowされる', async () => {
    server.use(
      http.post(`${baseUrl}/api/auth/login`, () => {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 },
        )
      }),
    )

    await expect(
      authApi.login({ username: 'admin', password: 'password' }),
    ).rejects.toThrow('ログインリクエストに失敗しました (HTTP 500)')
  })

  it('200: レスポンスにトークンが含まれない場合はthrowされる', async () => {
    server.use(
      http.post(`${baseUrl}/api/auth/login`, () => {
        return HttpResponse.json({ unexpected: 'data' })
      }),
    )

    await expect(
      authApi.login({ username: 'admin', password: 'password' }),
    ).rejects.toThrow('不正なレスポンス: トークンが含まれていません')
  })

  it('200: トークンが空文字列の場合はthrowされる', async () => {
    server.use(
      http.post(`${baseUrl}/api/auth/login`, () => {
        return HttpResponse.json({ token: '' })
      }),
    )

    await expect(
      authApi.login({ username: 'admin', password: 'password' }),
    ).rejects.toThrow('不正なレスポンス: トークンが含まれていません')
  })
})

describe('authApi.me', () => {
  it('正常系: 有効なトークンでユーザー名が返る', async () => {
    const result = await authApi.me('mock-jwt-token')

    expect(result).toEqual({
      status: 'authenticated',
      username: 'admin',
    })
  })

  it('401: 無効なトークンでunauthenticatedが返る', async () => {
    const result = await authApi.me('invalid-token')

    expect(result).toEqual({
      status: 'unauthenticated',
    })
  })

  it('403: 権限不足でunauthenticatedが返る', async () => {
    server.use(
      http.get(`${baseUrl}/api/auth/me`, () => {
        return HttpResponse.json({ error: '権限がありません' }, { status: 403 })
      }),
    )

    const result = await authApi.me('some-token')

    expect(result).toEqual({
      status: 'unauthenticated',
    })
  })

  it('500: サーバーエラーではthrowされる', async () => {
    server.use(
      http.get(`${baseUrl}/api/auth/me`, () => {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 },
        )
      }),
    )

    await expect(authApi.me('some-token')).rejects.toThrow(
      '認証確認リクエストに失敗しました (HTTP 500)',
    )
  })

  it('200: レスポンスにユーザー名が含まれない場合はthrowされる', async () => {
    server.use(
      http.get(`${baseUrl}/api/auth/me`, () => {
        return HttpResponse.json({ unexpected: 'data' })
      }),
    )

    await expect(authApi.me('mock-jwt-token')).rejects.toThrow(
      '不正なレスポンス: ユーザー名が含まれていません',
    )
  })

  it('200: ユーザー名が空文字列の場合はthrowされる', async () => {
    server.use(
      http.get(`${baseUrl}/api/auth/me`, () => {
        return HttpResponse.json({ username: '' })
      }),
    )

    await expect(authApi.me('mock-jwt-token')).rejects.toThrow(
      '不正なレスポンス: ユーザー名が含まれていません',
    )
  })
})
