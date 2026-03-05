import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const ARTICLE_STATUSES = ['draft', 'published'] as const
export type ArticleStatusEnum = (typeof ARTICLE_STATUSES)[number]

export const articles = sqliteTable('articles', {
  id: text('id').primaryKey(), // ArticleId (UUIDv7)
  publicId: text('public_id').notNull().unique(), // PublicArticleId (nanoID)
  title: text('title').notNull(),
  bodyKey: text('body_key').notNull(), // R2 ファイル識別子
  status: text('status', { enum: ARTICLE_STATUSES }).notNull().default('draft'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  publishedAt: text('published_at'), // null 許容
})
