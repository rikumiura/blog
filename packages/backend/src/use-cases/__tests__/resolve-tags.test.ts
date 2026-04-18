import { describe, expect, it } from 'vitest'
import type { ArticleId } from '../../domain/models/article'
import type { Tag, TagName } from '../../domain/models/tag'
import { restoreTagName, TagId } from '../../domain/models/tag'
import { resolveTags } from '../resolve-tags'
import { InMemoryTagRepository } from './in-memory-test-doubles'

/**
 * onConflictDoNothing によるタグ競合を模擬するテストダブル。
 * 初回の findByNames は空を返し（レースコンディションを模擬）、
 * saveMany は挿入をスキップし、再検索では DB に存在する正規タグを返す。
 */
class ConflictingTagRepository {
  private findCallCount = 0
  private readonly canonicalTag: Tag

  constructor(canonicalTag: Tag) {
    this.canonicalTag = canonicalTag
  }

  async findByNames(names: TagName[]): Promise<Tag[]> {
    this.findCallCount++
    if (this.findCallCount === 1) {
      // 初回検索: レースコンディションにより未発見を模擬
      return []
    }
    // 2回目以降: saveMany後の再検索でDB正規タグを返す
    return names.some((n) => String(n) === String(this.canonicalTag.name))
      ? [this.canonicalTag]
      : []
  }

  async saveMany(_tags: Tag[]): Promise<void> {
    // onConflictDoNothing: 同名タグが既存のため挿入スキップを模擬
  }

  async setArticleTags(
    _articleId: ArticleId,
    _tagIds: Tag['id'][],
  ): Promise<void> {}

  async findByArticleId(_articleId: ArticleId): Promise<Tag[]> {
    return []
  }

  async findByArticleIds(
    _articleIds: ArticleId[],
  ): Promise<Map<string, Tag[]>> {
    return new Map()
  }
}

describe('resolveTags', () => {
  let tagIdCounter = 0
  const setup = () => {
    tagIdCounter = 0
    const tagRepository = new InMemoryTagRepository()
    const generateTagId = () => {
      tagIdCounter++
      return TagId(`tag-${tagIdCounter}`)
    }
    return { tagRepository, generateTagId }
  }

  it('空配列の場合は空のタグ配列が返る', async () => {
    const deps = setup()

    const result = await resolveTags([], deps)

    expect(result).toEqual({ ok: true, tags: [] })
  })

  it('新規タグが作成される', async () => {
    const deps = setup()

    const result = await resolveTags(['TypeScript', 'React'], deps)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.tags).toHaveLength(2)
      expect(result.tags.map((t) => String(t.name))).toContain('TypeScript')
      expect(result.tags.map((t) => String(t.name))).toContain('React')
    }
  })

  it('既存タグが再利用される', async () => {
    const deps = setup()
    const existingTag = {
      id: TagId('existing-1'),
      name: restoreTagName('TypeScript'),
    }
    await deps.tagRepository.saveMany([existingTag])

    const result = await resolveTags(['TypeScript'], deps)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.tags).toHaveLength(1)
      expect(result.tags[0].id).toBe('existing-1')
    }
  })

  it('既存タグと新規タグが混在する場合', async () => {
    const deps = setup()
    const existingTag = {
      id: TagId('existing-1'),
      name: restoreTagName('TypeScript'),
    }
    await deps.tagRepository.saveMany([existingTag])

    const result = await resolveTags(['TypeScript', 'React'], deps)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.tags).toHaveLength(2)
      const tagNames = result.tags.map((t) => String(t.name))
      expect(tagNames).toContain('TypeScript')
      expect(tagNames).toContain('React')
      // 既存タグはIDが再利用される
      const tsTag = result.tags.find((t) => String(t.name) === 'TypeScript')
      expect(tsTag?.id).toBe('existing-1')
    }
  })

  it('重複するタグ名は除去される', async () => {
    const deps = setup()

    const result = await resolveTags(['TypeScript', 'TypeScript'], deps)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.tags).toHaveLength(1)
      expect(String(result.tags[0].name)).toBe('TypeScript')
    }
  })

  it('無効なタグ名の場合バリデーションエラーが返る', async () => {
    const deps = setup()

    const result = await resolveTags(['', 'React'], deps)

    expect(result).toEqual({ ok: false, message: 'タグ名は空にできません' })
  })

  it('saveMany が onConflictDoNothing でスキップされた場合、DB正規のIDが返される', async () => {
    const canonicalTag = {
      id: TagId('existing-1'),
      name: restoreTagName('TypeScript'),
    }
    const tagRepository = new ConflictingTagRepository(canonicalTag)
    const generateTagId = () => TagId('generated-id-that-does-not-exist-in-db')

    const result = await resolveTags(['TypeScript'], {
      tagRepository,
      generateTagId,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.tags).toHaveLength(1)
      // DB正規のIDが返される（生成したIDではない）
      expect(result.tags[0].id).toBe('existing-1')
    }
  })
})
