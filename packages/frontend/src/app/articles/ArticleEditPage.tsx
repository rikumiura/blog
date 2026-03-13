import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { ArticleDetail } from '@/core/types/article'
import { ArticleEditForm } from '@/features/articles/ArticleEditForm'
import { articleApi } from '@/features/articles/articles.api'

export function ArticleEditPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!publicId) {
      setError('記事IDが指定されていません')
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setArticle(null)
    setError(null)
    articleApi
      .findByPublicId(publicId)
      .then((data) => {
        if (!cancelled) setArticle(data)
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

  return (
    <div className="mx-auto max-w-4xl p-5 font-sans">
      <div className="mb-6">
        <Link
          to={publicId ? `/articles/${publicId}` : '/'}
          className="text-sm text-muted-foreground hover:underline"
        >
          &larr; 記事に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold">記事を編集</h1>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : error ? (
        <p className="text-destructive">{error}</p>
      ) : article ? (
        <ArticleEditForm article={article} />
      ) : null}
    </div>
  )
}
