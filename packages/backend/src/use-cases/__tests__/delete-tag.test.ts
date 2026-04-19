import { describe, expect, it } from 'vitest'
import { ArticleId } from '../../domain/models/article'
import { restoreTagName, TagId } from '../../domain/models/tag'
import { deleteTag } from '../delete-tag'
import { InMemoryTagRepository } from './in-memory-test-doubles'

describe('deleteTag', () => {
  it('存在するタグを削除できる', async () => {
    const tagRepository = new InMemoryTagRepository()
    const tagId = TagId('tag-1')
    await tagRepository.saveMany([{ id: tagId, name: restoreTagName('React') }])

    const result = await deleteTag(tagId, { tagRepository })

    expect(result).toEqual({ status: 'deleted' })
    expect(await tagRepository.findAll()).toHaveLength(0)
  })

  it('存在しないタグを削除しようとすると not_found を返す', async () => {
    const tagRepository = new InMemoryTagRepository()

    const result = await deleteTag(TagId('missing'), { tagRepository })

    expect(result).toEqual({ status: 'not_found' })
  })

  it('タグ削除時に記事との紐付けも解除される', async () => {
    const tagRepository = new InMemoryTagRepository()
    const tagId = TagId('tag-1')
    const articleId = ArticleId('article-1')
    await tagRepository.saveMany([{ id: tagId, name: restoreTagName('React') }])
    await tagRepository.setArticleTags(articleId, [tagId])

    await deleteTag(tagId, { tagRepository })

    const remaining = await tagRepository.findByArticleId(articleId)
    expect(remaining).toHaveLength(0)
  })
})
