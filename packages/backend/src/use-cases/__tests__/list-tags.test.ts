import { describe, expect, it } from 'vitest'
import { restoreTagName, TagId } from '../../domain/models/tag'
import { listTags } from '../list-tags'
import { InMemoryTagRepository } from './in-memory-test-doubles'

describe('listTags', () => {
  it('保存されているタグがすべて返される', async () => {
    const tagRepository = new InMemoryTagRepository()
    await tagRepository.saveMany([
      { id: TagId('tag-1'), name: restoreTagName('React') },
      { id: TagId('tag-2'), name: restoreTagName('TypeScript') },
    ])

    const result = await listTags({ tagRepository })

    expect(result.tags).toHaveLength(2)
    const names = result.tags.map((t) => String(t.name))
    expect(names).toContain('React')
    expect(names).toContain('TypeScript')
  })

  it('タグが無い場合は空配列を返す', async () => {
    const tagRepository = new InMemoryTagRepository()

    const result = await listTags({ tagRepository })

    expect(result.tags).toEqual([])
  })
})
