import { type Tag, TagId, createTagName } from '../domain/models/tag'
import type { TagRepository } from '../domain/ports/tag-repository'

export type ResolveTagsResult =
  | { ok: true; tags: Tag[] }
  | { ok: false; message: string }

/**
 * タグ名の配列を受け取り、既存タグの検索 + 新規タグの作成を行い、
 * 全てのTagエンティティを返す
 */
export async function resolveTags(
  tagNames: string[],
  deps: {
    tagRepository: TagRepository
    generateTagId: () => TagId
  },
): Promise<ResolveTagsResult> {
  if (tagNames.length === 0) return { ok: true, tags: [] }

  // バリデーション
  const validatedNames = []
  for (const name of tagNames) {
    const result = createTagName(name)
    if (!result.ok) return { ok: false, message: result.message }
    validatedNames.push(result.value)
  }

  // 重複除去
  const uniqueNames = [...new Set(validatedNames)]

  // 既存タグを検索
  const existingTags = await deps.tagRepository.findByNames(uniqueNames)
  const existingNameSet = new Set(existingTags.map((t) => t.name as string))

  // 新規タグを作成
  const newTags: Tag[] = uniqueNames
    .filter((name) => !existingNameSet.has(name))
    .map((name) => ({
      id: deps.generateTagId(),
      name,
    }))

  if (newTags.length > 0) {
    await deps.tagRepository.saveMany(newTags)
  }

  return { ok: true, tags: [...existingTags, ...newTags] }
}
