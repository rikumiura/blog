import type { AppType } from '@my-blog/backend/src/index'
import { hc } from 'hono/client'

const TOKEN_STORAGE_KEY = 'auth_token'

function getAuthHeaders(): Record<string, string> {
  try {
    const token = globalThis.localStorage?.getItem(TOKEN_STORAGE_KEY)
    if (token) {
      return { Authorization: `Bearer ${token}` }
    }
  } catch {
    // localStorage が利用できない環境では無視
  }
  return {}
}

/** Hono RPCクライアント（アプリケーション全体で共有） */
export const apiClient = hc<AppType>(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787',
  {
    headers: getAuthHeaders,
  },
)
