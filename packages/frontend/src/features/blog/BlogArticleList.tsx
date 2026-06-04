import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Pagination } from '@/components/ui/pagination'
import { formatDate } from '@/lib/format'
import { BlogArticleCount } from './BlogArticleCount'
import { BlogTagFilter } from './BlogTagFilter'
import {
  blogCurrentPageAtom,
  blogErrorAtom,
  blogFetchLoadingAtom,
  blogFilteredArticlesAtom,
  blogSearchQueryAtom,
  blogSelectedTagsAtom,
  blogTotalCountAtom,
  blogTotalPagesAtom,
  changeBlogPageAtom,
  fetchBlogArticlesAtom,
  searchBlogArticlesAtom,
} from './blog.atom'

export function BlogArticleList() {
  const articles = useAtomValue(blogFilteredArticlesAtom)
  const selectedTags = useAtomValue(blogSelectedTagsAtom)
  const currentPage = useAtomValue(blogCurrentPageAtom)
  const totalPages = useAtomValue(blogTotalPagesAtom)
  const totalCount = useAtomValue(blogTotalCountAtom)
  const isLoading = useAtomValue(blogFetchLoadingAtom)
  const error = useAtomValue(blogErrorAtom)
  const confirmedQuery = useAtomValue(blogSearchQueryAtom)
  const fetchArticles = useSetAtom(fetchBlogArticlesAtom)
  const changePage = useSetAtom(changeBlogPageAtom)
  const searchArticles = useSetAtom(searchBlogArticlesAtom)

  /** 入力欄の一時的な値（Enterまたはボタンで確定） */
  const [inputValue, setInputValue] = useState(confirmedQuery)

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  function handleSearch() {
    searchArticles(inputValue)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch()
  }

  if (isLoading) {
    return <p className="text-muted-foreground">読み込み中...</p>
  }

  if (error) {
    return <p className="text-destructive">{error}</p>
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        <input
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="記事を検索..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          検索
        </button>
      </div>
      <BlogTagFilter />
      <BlogArticleCount
        count={totalCount}
        searchQuery={confirmedQuery}
        hasTagFilter={selectedTags.length > 0}
      />
      {articles.length === 0 ? (
        <p className="text-muted-foreground">
          {confirmedQuery
            ? `「${confirmedQuery}」に一致する記事がありません`
            : selectedTags.length > 0
              ? '選択したタグに一致する記事がありません'
              : 'まだ記事がありません'}
        </p>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => (
            <article
              key={article.publicId}
              className="rounded-lg border p-6 transition-colors hover:bg-muted/50"
            >
              <Link to={`/articles/${article.publicId}`} className="block">
                <h2 className="mb-2 text-xl font-bold hover:underline">
                  {article.title}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <time dateTime={article.publishedAt}>
                    {formatDate(article.publishedAt)}
                  </time>
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </article>
          ))}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={changePage}
          />
        </div>
      )}
    </>
  )
}
