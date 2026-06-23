import type { Comment } from '@/core/types/comment'
import { apiClient } from '@/lib/api-client'
import { createApiError } from '@/lib/api-error'

export const commentsApi = {
  async listByArticle(publicId: string): Promise<Comment[]> {
    const res = await apiClient.api.public.articles[':publicId'].comments.$get({
      param: { publicId },
    })
    if (!res.ok) {
      throw new Error(`コメント一覧の取得に失敗しました: ${res.status}`)
    }
    const data = await res.json()
    return data.comments
  },

  async post(
    publicId: string,
    input: { authorName: string; content: string },
  ): Promise<Comment> {
    const res = await apiClient.api.public.articles[':publicId'].comments.$post(
      {
        param: { publicId },
        json: input,
      },
    )
    if (!res.ok) {
      throw await createApiError(res, 'コメントの投稿に失敗しました')
    }
    return res.json()
  },

  async deleteComment(id: string): Promise<void> {
    const res = await apiClient.api.comments[':id'].$delete({
      param: { id },
    })
    if (!res.ok) {
      throw new Error(`コメントの削除に失敗しました: ${res.status}`)
    }
  },
}
