import { describe, expect, it } from 'vitest'
import { restoreTagName, TagId } from '../../domain/models/tag'
import { createTag } from '../create-tag'
import { InMemoryTagRepository } from './in-memory-test-doubles'

describe('createTag', () => {
  it('新規タグを作成できる', async () => {
    const tagRepository = new InMemoryTagRepository()

    const result = await createTag(
      { name: 'React' },
      {
        tagRepository,
        generateTagId: () => TagId('tag-1'),
      },
    )

    expect(result.status).toBe('created')
    if (result.status !== 'created') return
    expect(result.tag).toEqual({
      id: TagId('tag-1'),
      name: restoreTagName('React'),
    })
    const stored = await tagRepository.findAll()
    expect(stored).toHaveLength(1)
    expect(String(stored[0]?.name)).toBe('React')
  })

  it('前後の空白はトリムされて保存される', async () => {
    const tagRepository = new InMemoryTagRepository()

    const result = await createTag(
      { name: '  Vue  ' },
      {
        tagRepository,
        generateTagId: () => TagId('tag-1'),
      },
    )

    expect(result.status).toBe('created')
    if (result.status !== 'created') return
    expect(String(result.tag.name)).toBe('Vue')
  })

  it('空文字のタグ名は validation_error を返す', async () => {
    const tagRepository = new InMemoryTagRepository()

    const result = await createTag(
      { name: '   ' },
      {
        tagRepository,
        generateTagId: () => TagId('tag-1'),
      },
    )

    expect(result.status).toBe('validation_error')
    expect(await tagRepository.findAll()).toHaveLength(0)
  })

  it('31文字以上のタグ名は validation_error を返す', async () => {
    const tagRepository = new InMemoryTagRepository()
    const longName = 'a'.repeat(31)

    const result = await createTag(
      { name: longName },
      {
        tagRepository,
        generateTagId: () => TagId('tag-1'),
      },
    )

    expect(result.status).toBe('validation_error')
    expect(await tagRepository.findAll()).toHaveLength(0)
  })

  it('既存と同名のタグ作成は duplicate を返す', async () => {
    const tagRepository = new InMemoryTagRepository()
    await tagRepository.saveMany([
      { id: TagId('existing'), name: restoreTagName('React') },
    ])

    const result = await createTag(
      { name: 'React' },
      {
        tagRepository,
        generateTagId: () => TagId('tag-new'),
      },
    )

    expect(result.status).toBe('duplicate')
    const stored = await tagRepository.findAll()
    expect(stored).toHaveLength(1)
    expect(stored[0]?.id).toBe(TagId('existing'))
  })

  it('トリム後に既存と同名なら duplicate を返す', async () => {
    const tagRepository = new InMemoryTagRepository()
    await tagRepository.saveMany([
      { id: TagId('existing'), name: restoreTagName('React') },
    ])

    const result = await createTag(
      { name: '  React  ' },
      {
        tagRepository,
        generateTagId: () => TagId('tag-new'),
      },
    )

    expect(result.status).toBe('duplicate')
  })
})
