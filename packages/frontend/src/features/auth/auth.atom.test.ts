import { createStore } from 'jotai'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  isAuthenticatedAtom,
  loginAtom,
  loginErrorAtom,
  loginLoadingAtom,
  logoutAtom,
  tokenAtom,
} from './auth.atom'

vi.mock('./auth.api', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
  },
}))

import { authApi } from './auth.api'

const mockedAuthApi = vi.mocked(authApi)

// Node 環境での localStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('auth.atom', () => {
  let store: ReturnType<typeof createStore>

  beforeEach(() => {
    store = createStore()
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('初期状態ではトークンが null で未認証', () => {
    expect(store.get(tokenAtom)).toBeNull()
    expect(store.get(isAuthenticatedAtom)).toBe(false)
  })

  it('ログイン成功でトークンが設定され認証済みになる', async () => {
    mockedAuthApi.login.mockResolvedValue({
      status: 'success',
      token: 'test-token',
    })

    const result = await store.set(loginAtom, {
      username: 'admin',
      password: 'password',
    })

    expect(result).toBe(true)
    expect(store.get(tokenAtom)).toBe('test-token')
    expect(store.get(isAuthenticatedAtom)).toBe(true)
    expect(localStorageMock.getItem('auth_token')).toBe('test-token')
  })

  it('ログイン失敗でエラーメッセージが設定される', async () => {
    mockedAuthApi.login.mockResolvedValue({
      status: 'error',
      message: 'ユーザー名またはパスワードが正しくありません',
    })

    const result = await store.set(loginAtom, {
      username: 'admin',
      password: 'wrong',
    })

    expect(result).toBe(false)
    expect(store.get(tokenAtom)).toBeNull()
    expect(store.get(loginErrorAtom)).toBe(
      'ユーザー名またはパスワードが正しくありません',
    )
  })

  it('ログイン中はローディング状態になる', async () => {
    let resolveLogin: (value: { status: 'success'; token: string }) => void
    mockedAuthApi.login.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve
        }),
    )

    const loginPromise = store.set(loginAtom, {
      username: 'admin',
      password: 'password',
    })

    expect(store.get(loginLoadingAtom)).toBe(true)

    resolveLogin!({ status: 'success', token: 'test-token' })
    await loginPromise

    expect(store.get(loginLoadingAtom)).toBe(false)
  })

  it('ログアウトでトークンがクリアされ未認証になる', async () => {
    mockedAuthApi.login.mockResolvedValue({
      status: 'success',
      token: 'test-token',
    })
    await store.set(loginAtom, {
      username: 'admin',
      password: 'password',
    })

    store.set(logoutAtom)

    expect(store.get(tokenAtom)).toBeNull()
    expect(store.get(isAuthenticatedAtom)).toBe(false)
    expect(localStorageMock.getItem('auth_token')).toBeNull()
  })
})
