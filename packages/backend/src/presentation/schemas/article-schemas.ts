import { z } from 'zod'

export const tagNameSchema = z
  .string()
  .min(1, 'タグ名は空にできません')
  .max(30, 'タグ名は30文字以内にしてください')

export const createArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(100, 'タイトルは100文字以内にしてください'),
  body: z.string(),
  tags: z
    .array(tagNameSchema)
    .max(10, 'タグは10個以内にしてください')
    .optional()
    .default([]),
  publish: z.boolean().optional().default(false),
})

export const updateArticleSchema = z
  .object({
    title: z
      .string()
      .min(1, 'タイトルは必須です')
      .max(100, 'タイトルは100文字以内にしてください')
      .optional(),
    body: z.string().optional(),
    tags: z
      .array(tagNameSchema)
      .max(10, 'タグは10個以内にしてください')
      .optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.body !== undefined ||
      data.tags !== undefined,
    { message: '更新するフィールドを1つ以上指定してください' },
  )

export const updateTagsSchema = z.object({
  tags: z.array(tagNameSchema).max(10, 'タグは10個以内にしてください'),
})

export const scheduleSchema = z.object({
  scheduledAt: z
    .string()
    .datetime({ message: '予約日時はISO 8601形式で指定してください' }),
})

export const publicIdParamSchema = z.object({
  publicId: z.string().min(1).max(30),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  tags: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').filter(Boolean) : undefined)),
  search: z
    .string()
    .max(100, '検索キーワードは100文字以内にしてください')
    .optional()
    .transform((s) => {
      const trimmed = s?.trim()
      return trimmed && trimmed.length > 0 ? trimmed : undefined
    }),
})
