import { apiClient } from '@/lib/api-client'

export type LoginInput = {
  username: string
  password: string
}

export type LoginResult =
  | { status: 'success'; token: string }
  | { status: 'error'; message: string }

export type MeResult =
  | { status: 'authenticated'; username: string }
  | { status: 'unauthenticated' }

function isErrorResponse(data: unknown): data is { error: string } {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as { error: unknown }).error === 'string'
  )
}

export const authApi = {
  async login(input: LoginInput): Promise<LoginResult> {
    const res = await apiClient.api.auth.login.$post({
      json: input,
    })

    if (!res.ok) {
      if (res.status === 400 || res.status === 401 || res.status === 422) {
        const data = await res.json().catch(() => null)
        const message = isErrorResponse(data)
          ? data.error
          : 'ログインに失敗しました'
        return { status: 'error', message }
      }
      throw new Error(`ログインリクエストに失敗しました (HTTP ${res.status})`)
    }

    const data = await res.json()
    return { status: 'success', token: data.token }
  },

  async me(token: string): Promise<MeResult> {
    const res = await apiClient.api.auth.me.$get(
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    )

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return { status: 'unauthenticated' }
      }
      throw new Error(`認証確認リクエストに失敗しました (HTTP ${res.status})`)
    }

    const data = await res.json()
    return { status: 'authenticated', username: data.username }
  },
}
