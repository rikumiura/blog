import { apiClient } from '@/lib/api-client'
import { throwApiError } from '@/lib/api-error'

export type TagSummary = {
  id: string
  name: string
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
      await throwApiError(res, 'タグの作成に失敗しました')
    }
    return await res.json()
  },

  async delete(id: string): Promise<void> {
    const res = await apiClient.api.tags[':id'].$delete({ param: { id } })
    if (!res.ok) {
      await throwApiError(res, 'タグの削除に失敗しました')
    }
  },
}
