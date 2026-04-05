import { useAtomValue, useSetAtom } from 'jotai'
import {
  allTagsAtom,
  clearTagFilterAtom,
  selectedTagsAtom,
  toggleTagAtom,
} from './articles.atom'

export function TagFilter() {
  const allTags = useAtomValue(allTagsAtom)
  const selectedTags = useAtomValue(selectedTagsAtom)
  const toggleTag = useSetAtom(toggleTagAtom)
  const clearFilter = useSetAtom(clearTagFilterAtom)

  if (allTags.length === 0) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        タグで絞り込み:
      </span>
      {allTags.map((tag) => {
        const isSelected = selectedTags.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`inline-block cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
            }`}
          >
            {tag}
          </button>
        )
      })}
      {selectedTags.length > 0 && (
        <button
          type="button"
          onClick={clearFilter}
          className="cursor-pointer text-xs text-muted-foreground underline hover:text-foreground"
        >
          クリア
        </button>
      )}
    </div>
  )
}
