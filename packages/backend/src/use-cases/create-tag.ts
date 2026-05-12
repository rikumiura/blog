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

  // saveMany は onConflictDoNothing で重複時に挿入をスキップする可能性があるため、
  // 永続化された行を再取得して、自分が挿入した ID と一致するか確認する。
  // 一致しなければ事前チェックと saveMany の間に他者が同名タグを挿入した
  // race condition なので duplicate を返す。
  const persisted = await deps.tagRepository.findByNames([nameResult.value])
  const persistedTag = persisted[0]
  if (!persistedTag) {
    throw new Error('タグの保存に失敗しました')
  }
  if (persistedTag.id !== tag.id) {
    return { status: 'duplicate' }
  }
  return { status: 'created', tag: persistedTag }
}
