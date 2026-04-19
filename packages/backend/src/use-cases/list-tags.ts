import type { Tag } from '../domain/models/tag'
import type { TagRepository } from '../domain/ports/tag-repository'

export type ListTagsResult = {
  tags: Tag[]
}

export async function listTags(deps: {
  tagRepository: TagRepository
}): Promise<ListTagsResult> {
  const tags = await deps.tagRepository.findAll()
  return { tags }
}
