import * as schema from '@my-blog/db'
import { drizzle } from 'drizzle-orm/d1'

export function createDbClient(d1: D1Database) {
  return drizzle(d1, { schema })
}

export type DbClient = ReturnType<typeof createDbClient>
