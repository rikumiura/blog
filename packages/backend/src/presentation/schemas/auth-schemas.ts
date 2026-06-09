import { z } from 'zod'

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'ユーザー名は必須です')
    .max(64, 'ユーザー名が長すぎます'),
  password: z
    .string()
    .min(1, 'パスワードは必須です')
    .max(256, 'パスワードが長すぎます'),
})
