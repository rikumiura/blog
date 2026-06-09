import { z } from 'zod'

export const postCommentSchema = z.object({
  authorName: z
    .string()
    .min(1, '投稿者名は必須です')
    .max(50, '投稿者名は50文字以内にしてください'),
  content: z
    .string()
    .min(1, 'コメント本文は必須です')
    .max(500, 'コメント本文は500文字以内にしてください'),
})

export const commentIdParamSchema = z.object({
  id: z.string().min(1),
})
