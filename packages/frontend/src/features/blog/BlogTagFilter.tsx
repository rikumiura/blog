import { useAtomValue, useSetAtom } from 'jotai'
import {
  blogAllTagsAtom,
  blogSelectedTagsAtom,
  clearBlogTagFilterAtom,
  toggleBlogTagAtom,
} from './blog.atom'

export function BlogTagFilter() {
  const allTags = useAtomValue(blogAllTagsAtom)
  const selectedTags = useAtomValue(blogSelectedTagsAtom)
  const toggleTag = useSetAtom(toggleBlogTagAtom)
  const clearFilter = useSetAtom(clearBlogTagFilterAtom)

  if (allTags.length === 0) return null

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {allTags.map((tag) => {
        const isSelected = selectedTags.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`inline-block cursor-pointer rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
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
          className="cursor-pointer text-sm text-muted-foreground underline hover:text-foreground"
        >
          クリア
        </button>
      )}
    </div>
  )
}
