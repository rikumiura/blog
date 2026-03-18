import { useAtom, useAtomValue } from 'jotai'
import { blogAllTagsAtom, blogSelectedTagsAtom } from './blog.atom'

export function BlogTagFilter() {
  const allTags = useAtomValue(blogAllTagsAtom)
  const [selectedTags, setSelectedTags] = useAtom(blogSelectedTagsAtom)

  if (allTags.length === 0) return null

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const clearFilter = () => {
    setSelectedTags([])
  }

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
