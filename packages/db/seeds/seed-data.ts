import type { InferInsertModel } from 'drizzle-orm'
import type { articles, articleTags, tags } from '../schema'

// シードSQL生成側ではdefaultを持つカラムも省略不可として扱うため、ここでも全カラムを必須にする
type ArticleRow = Required<InferInsertModel<typeof articles>>
type TagRow = Required<InferInsertModel<typeof tags>>
type ArticleTagRow = Required<InferInsertModel<typeof articleTags>>

// buildSeedArticles/buildSeedTags と buildSeedArticleTags の参照整合性を保つため、IDを一箇所で管理する
const TAG_ID: Record<
  'typescript' | 'react' | 'cloudflare' | 'drizzle',
  string
> = {
  typescript: 'seed-tag-typescript',
  react: 'seed-tag-react',
  cloudflare: 'seed-tag-cloudflare',
  drizzle: 'seed-tag-drizzle',
}

const ARTICLE_ID: Record<
  'draft1' | 'scheduled1' | 'published1' | 'published2',
  string
> = {
  draft1: 'seed-article-draft-1',
  scheduled1: 'seed-article-scheduled-1',
  published1: 'seed-article-published-1',
  published2: 'seed-article-published-2',
}

export function buildSeedTags(): TagRow[] {
  return [
    { id: TAG_ID.typescript, name: 'TypeScript' },
    { id: TAG_ID.react, name: 'React' },
    { id: TAG_ID.cloudflare, name: 'Cloudflare' },
    { id: TAG_ID.drizzle, name: 'Drizzle' },
  ]
}

export function buildSeedArticles(): ArticleRow[] {
  return [
    {
      id: ARTICLE_ID.draft1,
      publicId: 'seed-public-draft-1',
      title: '下書き記事のサンプル',
      bodyKey: 'seed-body-draft-1.md',
      status: 'draft',
      createdAt: '2026-06-01T00:00:00.000Z',
      updatedAt: '2026-06-01T00:00:00.000Z',
      publishedAt: null,
      scheduledAt: null,
    },
    {
      id: ARTICLE_ID.scheduled1,
      publicId: 'seed-public-scheduled-1',
      title: '予約投稿記事のサンプル',
      bodyKey: 'seed-body-scheduled-1.md',
      status: 'scheduled',
      createdAt: '2026-06-02T00:00:00.000Z',
      updatedAt: '2026-06-02T00:00:00.000Z',
      publishedAt: null,
      scheduledAt: '2026-07-01T00:00:00.000Z',
    },
    {
      id: ARTICLE_ID.published1,
      publicId: 'seed-public-published-1',
      title: '公開済み記事のサンプル',
      bodyKey: 'seed-body-published-1.md',
      status: 'published',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-03T00:00:00.000Z',
      publishedAt: '2026-05-03T00:00:00.000Z',
      scheduledAt: null,
    },
    {
      id: ARTICLE_ID.published2,
      publicId: 'seed-public-published-2',
      title: 'もう一つの公開済み記事のサンプル',
      bodyKey: 'seed-body-published-2.md',
      status: 'published',
      createdAt: '2026-05-10T00:00:00.000Z',
      updatedAt: '2026-05-12T00:00:00.000Z',
      publishedAt: '2026-05-12T00:00:00.000Z',
      scheduledAt: null,
    },
  ]
}

export function buildSeedArticleTags(): ArticleTagRow[] {
  return [
    { articleId: ARTICLE_ID.draft1, tagId: TAG_ID.typescript },
    { articleId: ARTICLE_ID.scheduled1, tagId: TAG_ID.react },
    { articleId: ARTICLE_ID.scheduled1, tagId: TAG_ID.typescript },
    { articleId: ARTICLE_ID.published1, tagId: TAG_ID.cloudflare },
    { articleId: ARTICLE_ID.published1, tagId: TAG_ID.drizzle },
    { articleId: ARTICLE_ID.published2, tagId: TAG_ID.typescript },
  ]
}
