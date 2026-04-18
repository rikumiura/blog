import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const pendingBodyKeyDeletions = sqliteTable('pending_body_key_deletions', {
  bodyKey: text('body_key').primaryKey(),
  queuedAt: text('queued_at').notNull(),
})
