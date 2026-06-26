import { describe, expect, it } from 'vitest'
import {
  buildSeedArticles,
  buildSeedArticleTags,
  buildSeedTags,
} from '../seed-data'

describe('buildSeedTags', () => {
  it('タグ名はすべて1文字以上30文字以内である', () => {
    const tags = buildSeedTags()

    expect(tags.length).toBeGreaterThan(0)
    for (const tag of tags) {
      expect(tag.name.length).toBeGreaterThanOrEqual(1)
      expect(tag.name.length).toBeLessThanOrEqual(30)
    }
  })

  it('タグIDはすべて一意である', () => {
    const tags = buildSeedTags()

    const ids = new Set(tags.map((tag) => tag.id))
    expect(ids.size).toBe(tags.length)
  })
})

describe('buildSeedArticles', () => {
  it('draft記事は publishedAt と scheduledAt が null である', () => {
    const articles = buildSeedArticles()
    const draftArticles = articles.filter((article) => article.status === 'draft')

    expect(draftArticles.length).toBeGreaterThan(0)
    for (const article of draftArticles) {
      expect(article.publishedAt).toBeNull()
      expect(article.scheduledAt).toBeNull()
    }
  })

  it('scheduled記事は scheduledAt が設定され publishedAt が null である', () => {
    const articles = buildSeedArticles()
    const scheduledArticles = articles.filter((article) => article.status === 'scheduled')

    expect(scheduledArticles.length).toBeGreaterThan(0)
    for (const article of scheduledArticles) {
      expect(article.scheduledAt).not.toBeNull()
      expect(article.publishedAt).toBeNull()
    }
  })

  it('published記事は publishedAt が設定される', () => {
    const articles = buildSeedArticles()
    const publishedArticles = articles.filter((article) => article.status === 'published')

    expect(publishedArticles.length).toBeGreaterThan(0)
    for (const article of publishedArticles) {
      expect(article.publishedAt).not.toBeNull()
    }
  })

  it('publicId はすべて一意である', () => {
    const articles = buildSeedArticles()

    const publicIds = new Set(articles.map((article) => article.publicId))
    expect(publicIds.size).toBe(articles.length)
  })

  it('id はすべて一意である', () => {
    const articles = buildSeedArticles()

    const ids = new Set(articles.map((article) => article.id))
    expect(ids.size).toBe(articles.length)
  })

  it('タイトルは空文字ではない', () => {
    const articles = buildSeedArticles()

    for (const article of articles) {
      expect(article.title.length).toBeGreaterThan(0)
    }
  })
})

describe('buildSeedArticleTags', () => {
  it('articleId と tagId は実在する記事・タグのみを参照する', () => {
    const articles = buildSeedArticles()
    const tags = buildSeedTags()
    const articleTags = buildSeedArticleTags()

    const articleIds = new Set(articles.map((article) => article.id))
    const tagIds = new Set(tags.map((tag) => tag.id))

    expect(articleTags.length).toBeGreaterThan(0)
    for (const articleTag of articleTags) {
      expect(articleIds.has(articleTag.articleId)).toBe(true)
      expect(tagIds.has(articleTag.tagId)).toBe(true)
    }
  })

  it('同じ記事・タグの組は重複しない', () => {
    const articleTags = buildSeedArticleTags()

    const keys = articleTags.map((articleTag) => `${articleTag.articleId}:${articleTag.tagId}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
