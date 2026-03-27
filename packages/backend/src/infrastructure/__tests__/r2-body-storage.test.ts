import { describe, expect, it, vi } from 'vitest'
import { BodyKey } from '../../domain/models/article'
import { R2BodyStorage } from '../storage/r2-body-storage'

function createMockR2Bucket(store: Map<string, string> = new Map()): R2Bucket {
  return {
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value)
      return {} as R2Object
    }),
    get: vi.fn(async (key: string) => {
      const content = store.get(key)
      if (content === undefined) return null
      return { text: async () => content } as R2ObjectBody
    }),
    delete: vi.fn(async (key: string) => {
      store.delete(key)
    }),
    head: vi.fn(),
    list: vi.fn(),
    createMultipartUpload: vi.fn(),
    resumeMultipartUpload: vi.fn(),
  } as unknown as R2Bucket
}

describe('R2BodyStorage', () => {
  describe('save', () => {
    it('指定したキーとコンテンツで put が呼ばれる', async () => {
      const bucket = createMockR2Bucket()
      const storage = new R2BodyStorage(bucket)
      const key = BodyKey('test-key.md')

      await storage.save(key, '# テスト本文')

      expect(bucket.put).toHaveBeenCalledWith('test-key.md', '# テスト本文')
    })
  })

  describe('get', () => {
    it('存在するキーの場合 found: true とコンテンツを返す', async () => {
      const store = new Map<string, string>()
      store.set('existing.md', '# 既存の記事')
      const bucket = createMockR2Bucket(store)
      const storage = new R2BodyStorage(bucket)

      const result = await storage.get(BodyKey('existing.md'))

      expect(result).toEqual({ found: true, content: '# 既存の記事' })
    })

    it('存在しないキーの場合 found: false を返す', async () => {
      const bucket = createMockR2Bucket()
      const storage = new R2BodyStorage(bucket)

      const result = await storage.get(BodyKey('nonexistent.md'))

      expect(result).toEqual({ found: false })
    })
  })

  describe('save → get ラウンドトリップ', () => {
    it('save したコンテンツを get で取得できる', async () => {
      const storage = new R2BodyStorage(createMockR2Bucket())
      const key = BodyKey('round-trip.md')

      await storage.save(key, '# ラウンドトリップテスト')
      const result = await storage.get(key)

      expect(result).toEqual({
        found: true,
        content: '# ラウンドトリップテスト',
      })
    })
  })

  describe('delete', () => {
    it('指定したキーで delete が呼ばれる', async () => {
      const bucket = createMockR2Bucket()
      const storage = new R2BodyStorage(bucket)
      const key = BodyKey('delete-me.md')

      await storage.delete(key)

      expect(bucket.delete).toHaveBeenCalledWith('delete-me.md')
    })
  })
})
