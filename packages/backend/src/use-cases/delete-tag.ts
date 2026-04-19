import type { TagId } from '../domain/models/tag'
import type { TagRepository } from '../domain/ports/tag-repository'

export type DeleteTagResult = { status: 'deleted' } | { status: 'not_found' }

export async function deleteTag(
  id: TagId,
  deps: {
    tagRepository: TagRepository
  },
): Promise<DeleteTagResult> {
  const deleted = await deps.tagRepository.deleteById(id)
  return deleted ? { status: 'deleted' } : { status: 'not_found' }
}
