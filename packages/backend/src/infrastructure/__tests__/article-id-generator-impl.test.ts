import { describe, expect, it } from 'vitest'
import { ArticleIdGeneratorImpl } from '../id/article-id-generator-impl'

describe('ArticleIdGeneratorImpl', () => {
  const generator = new ArticleIdGeneratorImpl()

  describe('generateArticleId', () => {
    it('UUIDv7 形式の文字列を返す', () => {
      const id = generator.generateArticleId()
      // UUIDv7 は標準的な UUID 形式（8-4-4-4-12）
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      )
    })

    it('呼び出すたびにユニークな値を返す', () => {
      const ids = new Set(Array.from({ length: 10 }, () => generator.generateArticleId()))
      expect(ids.size).toBe(10)
    })
  })

  describe('generatePublicArticleId', () => {
    it('空でない文字列を返す', () => {
      const id = generator.generatePublicArticleId()
      expect(id.length).toBeGreaterThan(0)
    })

    it('URL に使える文字のみで構成される', () => {
      const id = generator.generatePublicArticleId()
      // nanoid のデフォルトアルファベット: A-Za-z0-9_-
      expect(id).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('呼び出すたびにユニークな値を返す', () => {
      const ids = new Set(Array.from({ length: 10 }, () => generator.generatePublicArticleId()))
      expect(ids.size).toBe(10)
    })
  })

  describe('generateBodyKey', () => {
    it('.md 拡張子を持つ文字列を返す', () => {
      const key = generator.generateBodyKey()
      expect(key).toMatch(/\.md$/)
    })

    it('プレフィックスが UUIDv7 形式である', () => {
      const key = generator.generateBodyKey()
      const prefix = key.replace('.md', '')
      expect(prefix).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      )
    })

    it('呼び出すたびにユニークな値を返す', () => {
      const keys = new Set(Array.from({ length: 10 }, () => generator.generateBodyKey()))
      expect(keys.size).toBe(10)
    })
  })

  describe('generateTagId', () => {
    it('UUIDv7 形式の文字列を返す', () => {
      const id = generator.generateTagId()
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      )
    })

    it('呼び出すたびにユニークな値を返す', () => {
      const ids = new Set(Array.from({ length: 10 }, () => generator.generateTagId()))
      expect(ids.size).toBe(10)
    })
  })
})
