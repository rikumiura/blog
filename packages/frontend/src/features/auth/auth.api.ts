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

export const authApi = {
  async login(input: LoginInput): Promise<LoginResult> {
    const res = await apiClient.api.auth.login.$post({
      json: input,
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      const message =
        data !== null && typeof data === 'object' && 'error' in data
          ? String((data as Record<string, unknown>).error)
          : 'ログインに失敗しました'
      return { status: 'error', message }
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
      return { status: 'unauthenticated' }
    }

    const data = await res.json()
    return { status: 'authenticated', username: data.username }
  },
}
