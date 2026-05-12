import { apiClient } from '@/lib/api-client'

export type TagSummary = {
  id: string
  name: string
}

function extractErrorMessage(data: unknown): string | undefined {
  if (data !== null && typeof data === 'object' && 'error' in data) {
    const error = Reflect.get(data, 'error')
    if (typeof error === 'string') return error
  }
  return undefined
}

export const tagsApi = {
  async listAll(): Promise<TagSummary[]> {
    const res = await apiClient.api.tags.$get()
    if (!res.ok) {
      throw new Error(`タグ一覧の取得に失敗しました: ${res.status}`)
    }
    const data = await res.json()
    return data.tags
  },

  async create(name: string): Promise<TagSummary> {
    const res = await apiClient.api.tags.$post({ json: { name } })
    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      const message =
        extractErrorMessage(errorData) ??
        `タグの作成に失敗しました: ${res.status}`
      throw new Error(message)
    }
    const data = await res.json()
    return { id: data.id, name: data.name }
  },

  async delete(id: string): Promise<void> {
    const res = await apiClient.api.tags[':id'].$delete({ param: { id } })
    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      const message =
        extractErrorMessage(errorData) ??
        `タグの削除に失敗しました: ${res.status}`
      throw new Error(message)
    }
  },
}
