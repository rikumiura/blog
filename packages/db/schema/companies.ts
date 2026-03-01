import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const companies = sqliteTable('companies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  postalCode: text('postal_code').notNull(),
  contactPerson: text('contact_person').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})
