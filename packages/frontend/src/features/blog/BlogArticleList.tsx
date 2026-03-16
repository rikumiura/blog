import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { BlogTagFilter } from './BlogTagFilter'
import {
  blogErrorAtom,
  blogFetchLoadingAtom,
  blogFilteredArticlesAtom,
  blogSelectedTagsAtom,
  fetchBlogArticlesAtom,
} from './blog.atom'

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function BlogArticleList() {
  const articles = useAtomValue(blogFilteredArticlesAtom)
  const selectedTags = useAtomValue(blogSelectedTagsAtom)
  const isLoading = useAtomValue(blogFetchLoadingAtom)
  const error = useAtomValue(blogErrorAtom)
  const fetchArticles = useSetAtom(fetchBlogArticlesAtom)

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  if (isLoading) {
    return <p className="text-muted-foreground">読み込み中...</p>
  }

  if (error) {
    return <p className="text-destructive">{error}</p>
  }

  return (
    <>
      <BlogTagFilter />
      {articles.length === 0 ? (
        <p className="text-muted-foreground">
          {selectedTags.length > 0
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
                  <time>{formatDate(article.publishedAt)}</time>
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
        </div>
      )}
    </>
  )
}
