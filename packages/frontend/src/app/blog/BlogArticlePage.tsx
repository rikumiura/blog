import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { ArticleDetail } from '@/core/types/article'
import { BlogArticleContent } from '@/features/blog/BlogArticleContent'
import { blogApi } from '@/features/blog/blog.api'

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function BlogArticlePage() {
  const { publicId } = useParams<{ publicId: string }>()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!publicId) return

    setIsLoading(true)
    blogApi
      .findByPublicId(publicId)
      .then(setArticle)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '記事の取得に失敗しました')
      })
      .finally(() => setIsLoading(false))
  }, [publicId])

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 font-sans">
      <nav className="mb-8">
        <Link
          to="/blog"
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; 記事一覧に戻る
        </Link>
      </nav>

      {isLoading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : error ? (
        <p className="text-destructive">{error}</p>
      ) : article ? (
        <article>
          <header className="mb-8">
            <h1 className="mb-4 text-3xl font-bold leading-tight">
              {article.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {article.publishedAt && (
                <time>{formatDate(article.publishedAt)}</time>
              )}
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
          </header>
          <BlogArticleContent body={article.body} />
        </article>
      ) : null}
    </div>
  )
}
