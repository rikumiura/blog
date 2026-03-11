// --- Branded Types ---

type Brand<K extends string> = { readonly [P in K]: never }

export type TagId = string & Brand<'TagId'>
export type TagName = string & Brand<'TagName'>

function brand<T>(value: string): T {
  return value as T
}

export const TagId = (value: string): TagId => brand(value)

// DB復元用: バリデーション済みのデータからTagNameを復元する（バリデーションなし）
export const restoreTagName = (value: string): TagName => brand(value)

// --- エンティティ ---

export type Tag = {
  id: TagId
  name: TagName
}

// --- 値オブジェクト バリデーション ---

const TAG_NAME_MAX_LENGTH = 30

export type CreateTagNameResult =
  | { ok: true; value: TagName }
  | { ok: false; message: string }

export function createTagName(value: string): CreateTagNameResult {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return { ok: false, message: 'タグ名は空にできません' }
  }
  if (trimmed.length > TAG_NAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `タグ名は${TAG_NAME_MAX_LENGTH}文字以内にしてください`,
    }
  }
  return { ok: true, value: brand<TagName>(trimmed) }
}
