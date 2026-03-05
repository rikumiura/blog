import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const articles = sqliteTable('articles', {
  id: text('id').primaryKey(), // ArticleId (UUIDv7)
  publicId: text('public_id').notNull().unique(), // PublicArticleId (nanoID)
  title: text('title').notNull(),
  bodyKey: text('body_key').notNull(), // R2 ファイル識別子
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  publishedAt: text('published_at'), // null 許容
})
