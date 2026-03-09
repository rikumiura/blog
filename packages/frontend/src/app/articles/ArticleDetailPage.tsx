import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import type { ArticleDetail } from '@/core/types/article'
import { articleApi } from '@/features/articles/articles.api'

export function ArticleDetailPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!publicId) return

    setIsLoading(true)
    articleApi
      .findByPublicId(publicId)
      .then(setArticle)
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '記事の取得に失敗しました')
      })
      .finally(() => setIsLoading(false))
  }, [publicId])

  return (
    <div className="mx-auto max-w-4xl p-5 font-sans">
      <div className="mb-6">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">
          &larr; 記事一覧に戻る
        </Link>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : error ? (
        <p className="text-destructive">{error}</p>
      ) : article ? (
        <article>
          <h1 className="mb-4 text-2xl font-bold">{article.title}</h1>
          <div className="mb-6 flex items-center gap-4 text-sm text-muted-foreground">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                article.status === 'published'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {article.status === 'published' ? '公開' : '下書き'}
            </span>
            <span>
              作成日: {new Date(article.createdAt).toLocaleDateString('ja-JP')}
            </span>
            <span>
              更新日: {new Date(article.updatedAt).toLocaleDateString('ja-JP')}
            </span>
          </div>
          {article.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="whitespace-pre-wrap leading-relaxed">
            {article.body}
          </div>
        </article>
      ) : null}
    </div>
  )
}
