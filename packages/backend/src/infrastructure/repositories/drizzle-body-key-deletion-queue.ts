import { pendingBodyKeyDeletions } from '@my-blog/db'
import { eq } from 'drizzle-orm'
import { BodyKey } from '../../domain/models/article'
import type { BodyKeyDeletionQueue } from '../../domain/ports/body-key-deletion-queue'
import type { DbClient } from '../database'

export class DrizzleBodyKeyDeletionQueue implements BodyKeyDeletionQueue {
  private db: DbClient

  constructor(db: DbClient) {
    this.db = db
  }

  async enqueue(bodyKey: BodyKey, queuedAt: string): Promise<void> {
    await this.db
      .insert(pendingBodyKeyDeletions)
      .values({ bodyKey, queuedAt })
      .onConflictDoNothing()
  }

  async listAll(): Promise<BodyKey[]> {
    const rows = await this.db.select().from(pendingBodyKeyDeletions)
    return rows.map((r) => BodyKey(r.bodyKey))
  }

  async remove(bodyKey: BodyKey): Promise<void> {
    await this.db
      .delete(pendingBodyKeyDeletions)
      .where(eq(pendingBodyKeyDeletions.bodyKey, bodyKey))
  }
}
