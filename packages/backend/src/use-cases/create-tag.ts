import { createTagName, type Tag, type TagId } from '../domain/models/tag'
import type { TagRepository } from '../domain/ports/tag-repository'

export type CreateTagResult =
  | { status: 'created'; tag: Tag }
  | { status: 'duplicate' }
  | { status: 'validation_error'; message: string }

export async function createTag(
  input: { name: string },
  deps: {
    tagRepository: TagRepository
    generateTagId: () => TagId
  },
): Promise<CreateTagResult> {
  const nameResult = createTagName(input.name)
  if (!nameResult.ok) {
    return { status: 'validation_error', message: nameResult.message }
  }

  const existing = await deps.tagRepository.findByNames([nameResult.value])
  if (existing.length > 0) {
    return { status: 'duplicate' }
  }

  const tag: Tag = {
    id: deps.generateTagId(),
    name: nameResult.value,
  }
  await deps.tagRepository.saveMany([tag])
  return { status: 'created', tag }
}
