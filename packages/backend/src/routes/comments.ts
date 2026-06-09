import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { CommentId } from '../domain/models/comment'
import type { AppEnv } from '../env'
import { createDbClient } from '../infrastructure/database'
import { DrizzleCommentRepository } from '../infrastructure/repositories/drizzle-comment-repository'
import { commentIdParamSchema } from '../presentation/schemas/comment-schemas'
import { deleteComment } from '../use-cases/delete-comment'

export const commentRoutes = new Hono<AppEnv>().delete(
  '/:id',
  zValidator('param', commentIdParamSchema),
  async (c) => {
    const id = CommentId(c.req.valid('param').id)
    const db = createDbClient(c.env.DB)
    const commentRepository = new DrizzleCommentRepository(db)

    const result = await deleteComment(id, { commentRepository })

    switch (result.status) {
      case 'deleted':
        return c.body(null, 204)
      case 'not_found':
        return c.json({ error: 'コメントが見つかりません' }, 404)
    }
  },
)
