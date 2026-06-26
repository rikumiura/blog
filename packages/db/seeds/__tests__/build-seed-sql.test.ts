import { describe, expect, it } from 'vitest'
import { buildSeedSql } from '../build-seed-sql'

describe('buildSeedSql', () => {
  it('各テーブルへのDELETE文とINSERT文を生成する', () => {
    const sql = buildSeedSql({
      tags: [{ id: 'tag-1', name: 'TypeScript' }],
      articles: [
        {
          id: 'article-1',
          publicId: 'public-1',
          title: 'タイトル',
          bodyKey: 'body-1.md',
          status: 'draft',
          createdAt: '2026-06-01T00:00:00.000Z',
          updatedAt: '2026-06-01T00:00:00.000Z',
          publishedAt: null,
          scheduledAt: null,
        },
      ],
      articleTags: [{ articleId: 'article-1', tagId: 'tag-1' }],
    })

    expect(sql).toContain('DELETE FROM article_tags')
    expect(sql).toContain('DELETE FROM tags')
    expect(sql).toContain('DELETE FROM articles')
    expect(sql).toContain(
      "INSERT INTO tags (id, name) VALUES ('tag-1', 'TypeScript');",
    )
    expect(sql).toContain(
      "INSERT INTO articles (id, public_id, title, body_key, status, created_at, updated_at, published_at, scheduled_at) VALUES ('article-1', 'public-1', 'タイトル', 'body-1.md', 'draft', '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z', NULL, NULL);",
    )
    expect(sql).toContain(
      "INSERT INTO article_tags (article_id, tag_id) VALUES ('article-1', 'tag-1');",
    )
  })

  it('articlesがDELETEされた後にtags/article_tagsがDELETEされる順序になっている（外部キー制約対応）', () => {
    const sql = buildSeedSql({ tags: [], articles: [], articleTags: [] })

    const articleTagsIndex = sql.indexOf('DELETE FROM article_tags')
    const articlesIndex = sql.indexOf('DELETE FROM articles')
    const tagsIndex = sql.indexOf('DELETE FROM tags')

    expect(articleTagsIndex).toBeLessThan(articlesIndex)
    expect(articleTagsIndex).toBeLessThan(tagsIndex)
  })

  it('文字列内のシングルクォートをエスケープする', () => {
    const sql = buildSeedSql({
      tags: [{ id: 'tag-1', name: "O'Reilly" }],
      articles: [],
      articleTags: [],
    })

    expect(sql).toContain(
      "INSERT INTO tags (id, name) VALUES ('tag-1', 'O''Reilly');",
    )
  })
})
