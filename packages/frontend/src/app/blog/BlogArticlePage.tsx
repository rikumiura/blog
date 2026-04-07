import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { ArticleDetail } from '@/core/types/article'
import type { Comment } from '@/core/types/comment'
import { BlogArticleContent } from '@/features/blog/BlogArticleContent'
import { blogApi } from '@/features/blog/blog.api'
import { CommentForm } from '@/features/comments/CommentForm'
import { CommentList } from '@/features/comments/CommentList'
import { commentsApi } from '@/features/comments/comments.api'
import { formatDate } from '@/lib/format'

export function BlogArticlePage() {
  const { publicId } = useParams<{ publicId: string }>()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [comments, setComments] = useState<Comment[]>([])

  useEffect(() => {
    if (!publicId) return

    let cancelled = false
    setIsLoading(true)
    setArticle(null)
    setError(null)
    setComments([])

    Promise.all([
      blogApi.findByPublicId(publicId),
      commentsApi.listByArticle(publicId),
    ])
      .then(([articleData, commentsData]) => {
        if (!cancelled) {
          setArticle(articleData)
          setComments(commentsData)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '記事の取得に失敗しました')
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [publicId])

  const handlePostComment = async (input: {
    authorName: string
    content: string
  }) => {
    if (!publicId) return
    const newComment = await commentsApi.post(publicId, input)
    setComments((prev) => [...prev, newComment])
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 font-sans">
      <nav className="mb-8">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">
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
                <time dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt)}
                </time>
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
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="mb-6 text-xl font-bold">コメント</h2>
            <div className="mb-8">
              <CommentList comments={comments} />
            </div>
            <div>
              <h3 className="mb-4 text-base font-semibold">
                コメントを投稿する
              </h3>
              <CommentForm onSubmit={handlePostComment} />
            </div>
          </section>
        </article>
      ) : null}
    </div>
  )
}
