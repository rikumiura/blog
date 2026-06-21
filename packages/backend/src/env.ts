import type { Deps } from './infrastructure/deps'

export type Bindings = {
  DB: D1Database
  ARTICLE_BUCKET: R2Bucket
  ADMIN_USERNAME: string
  ADMIN_PASSWORD_HASH: string
  JWT_SECRET: string
}

export type Variables = {
  user: { sub: string }
  deps: Deps
}

export type AppEnv = { Bindings: Bindings; Variables: Variables }
