import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import type { ArticleDetail } from '@/core/types/article'
import { articleApi } from '@/features/articles/articles.api'
import { DeleteArticleDialog } from '@/features/articles/DeleteArticleDialog'

export function ArticleDetailPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = useCallback(async () => {
    if (!publicId) return
    setIsDeleting(true)
    try {
      await articleApi.delete(publicId)
      navigate('/')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '記事の削除に失敗しました')
      setIsDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }, [publicId, navigate])

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
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">{article.title}</h1>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={`/articles/${article.publicId}/edit`}>編集</Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                削除
              </Button>
            </div>
          </div>
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
      <DeleteArticleDialog
        articleTitle={article?.title ?? ''}
        isOpen={isDeleteDialogOpen}
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  )
}
