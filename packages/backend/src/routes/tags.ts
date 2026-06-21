import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { TagId } from '../domain/models/tag'
import type { AppEnv } from '../env'
import {
  createTagSchema,
  tagIdParamSchema,
} from '../presentation/schemas/tag-schemas'
import { createTag } from '../use-cases/create-tag'
import { deleteTag } from '../use-cases/delete-tag'
import { listTags } from '../use-cases/list-tags'

export const tagRoutes = new Hono<AppEnv>()
  .get('/', async (c) => {
    const { tagRepository } = c.get('deps')

    const result = await listTags({ tagRepository })

    return c.json({
      tags: result.tags.map((t) => ({
        id: String(t.id),
        name: String(t.name),
      })),
    })
  })
  .post('/', zValidator('json', createTagSchema), async (c) => {
    const input = c.req.valid('json')
    const { tagRepository, idGenerator } = c.get('deps')

    const result = await createTag(input, {
      tagRepository,
      generateTagId: () => idGenerator.generateTagId(),
    })

    switch (result.status) {
      case 'created':
        return c.json(
          { id: String(result.tag.id), name: String(result.tag.name) },
          201,
        )
      case 'duplicate':
        return c.json({ error: '同名のタグが既に存在します' }, 409)
      case 'validation_error':
        return c.json({ error: result.message }, 400)
    }
  })
  .delete('/:id', zValidator('param', tagIdParamSchema), async (c) => {
    const id = TagId(c.req.valid('param').id)
    const { tagRepository } = c.get('deps')

    const result = await deleteTag(id, { tagRepository })

    switch (result.status) {
      case 'deleted':
        return c.body(null, 204)
      case 'not_found':
        return c.json({ error: 'タグが見つかりません' }, 404)
    }
  })
