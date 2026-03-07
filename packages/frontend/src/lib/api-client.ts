import type { AppType } from '@my-blog/backend/src/index'
import { hc } from 'hono/client'

/** Hono RPCクライアント（アプリケーション全体で共有） */
export const apiClient = hc<AppType>(
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8787',
)
