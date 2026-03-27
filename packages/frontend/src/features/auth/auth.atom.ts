import { atom } from 'jotai'
import { authApi } from './auth.api'

const TOKEN_STORAGE_KEY = 'auth_token'

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    }
  } catch {
    // localStorage が利用できない環境では無視
  }
}

/** 認証トークン */
export const tokenAtom = atom<string | null>(getStoredToken())

/** 認証済みかどうか */
export const isAuthenticatedAtom = atom((get) => get(tokenAtom) !== null)

/** ログインのローディング状態 */
export const loginLoadingAtom = atom(false)

/** ログインエラーメッセージ */
export const loginErrorAtom = atom<string | null>(null)

/** ログインアクション */
export const loginAtom = atom(
  null,
  async (
    _get,
    set,
    input: { username: string; password: string },
  ): Promise<boolean> => {
    set(loginLoadingAtom, true)
    set(loginErrorAtom, null)
    try {
      const result = await authApi.login(input)
      if (result.status === 'success') {
        set(tokenAtom, result.token)
        setStoredToken(result.token)
        return true
      }
      set(loginErrorAtom, result.message)
      return false
    } catch (error) {
      set(
        loginErrorAtom,
        error instanceof Error ? error.message : 'ログインに失敗しました',
      )
      return false
    } finally {
      set(loginLoadingAtom, false)
    }
  },
)

/** ログアウトアクション */
export const logoutAtom = atom(null, (_get, set) => {
  set(tokenAtom, null)
  setStoredToken(null)
})

/** トークン検証アクション（起動時に使用） */
export const verifyTokenAtom = atom(null, async (get, set) => {
  const token = get(tokenAtom)
  if (!token) return

  const result = await authApi.me(token)
  if (result.status === 'unauthenticated') {
    set(tokenAtom, null)
    setStoredToken(null)
  }
})
