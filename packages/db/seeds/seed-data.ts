import type { InferInsertModel } from 'drizzle-orm'
import type { articles, articleTags, tags } from '../schema'

type ArticleRow = InferInsertModel<typeof articles>
type TagRow = InferInsertModel<typeof tags>
type ArticleTagRow = InferInsertModel<typeof articleTags>

export function buildSeedTags(): TagRow[] {
  return [
    { id: 'seed-tag-typescript', name: 'TypeScript' },
    { id: 'seed-tag-react', name: 'React' },
    { id: 'seed-tag-cloudflare', name: 'Cloudflare' },
    { id: 'seed-tag-drizzle', name: 'Drizzle' },
  ]
}

export function buildSeedArticles(): ArticleRow[] {
  return [
    {
      id: 'seed-article-draft-1',
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
      id: 'seed-article-scheduled-1',
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
      id: 'seed-article-published-1',
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
      id: 'seed-article-published-2',
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
    { articleId: 'seed-article-draft-1', tagId: 'seed-tag-typescript' },
    { articleId: 'seed-article-scheduled-1', tagId: 'seed-tag-react' },
    { articleId: 'seed-article-scheduled-1', tagId: 'seed-tag-typescript' },
    { articleId: 'seed-article-published-1', tagId: 'seed-tag-cloudflare' },
    { articleId: 'seed-article-published-1', tagId: 'seed-tag-drizzle' },
    { articleId: 'seed-article-published-2', tagId: 'seed-tag-typescript' },
  ]
}
