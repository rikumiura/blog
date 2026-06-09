import { z } from 'zod'
import { tagNameSchema } from './article-schemas'

export const createTagSchema = z.object({
  name: tagNameSchema,
})

export const tagIdParamSchema = z.object({
  id: z.string().min(1),
})
