import { z } from 'zod'

export const imageKeyParamSchema = z.object({
  imageKey: z
    .string()
    .regex(/^[0-9a-f-]+\.(jpeg|jpg|png|gif|webp)$/i, '不正な画像キーです'),
})
