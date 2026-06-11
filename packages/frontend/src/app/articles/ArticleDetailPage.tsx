import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import type { ArticleDetail } from '@/core/types/article'
import type { Comment } from '@/core/types/comment'
import { articleRepositoryAtom } from '@/features/articles/articles.atom'
import { DeleteArticleDialog } from '@/features/articles/DeleteArticleDialog'
import { CommentList } from '@/features/comments/CommentList'
import { commentRepositoryAtom } from '@/features/comments/comments.atom'

export function ArticleDetailPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const navigate = useNavigate()
  const articleRepository = useAtomValue(articleRepositoryAtom)
  const commentRepository = useAtomValue(commentRepositoryAtom)
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])

  const handleDelete = useCallback(async () => {
    if (!publicId) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await articleRepository.delete(publicId)
      navigate('/admin')
    } catch (e: unknown) {
      setDeleteError(
        e instanceof Error ? e.message : '記事の削除に失敗しました',
      )
      setIsDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }, [publicId, navigate, articleRepository])

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      await commentRepository.deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    },
    [commentRepository],
  )

  useEffect(() => {
    if (!publicId) return

    let cancelled = false
    setIsLoading(true)
    setArticle(null)
    setComments([])
    setError(null)
    Promise.all([
      articleRepository.findByPublicId(publicId),
      commentRepository.listByArticle(publicId),
    ])
      .then(([articleData, commentsData]) => {
        if (cancelled) return
        setArticle(articleData)
        setComments(commentsData)
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
  }, [publicId, articleRepository, commentRepository])

  return (
    <div className="mx-auto max-w-4xl p-5 font-sans">
      <div className="mb-6">
        <Link
          to="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
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
                <Link to={`/admin/articles/${article.publicId}/edit`}>
                  編集
                </Link>
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
                  : article.status === 'scheduled'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {article.status === 'published'
                ? '公開'
                : article.status === 'scheduled'
                  ? '予約'
                  : '下書き'}
            </span>
            {article.status === 'scheduled' && article.scheduledAt && (
              <span>
                予約日時:{' '}
                {new Date(article.scheduledAt).toLocaleString('ja-JP')}
              </span>
            )}
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
          {deleteError && (
            <p className="mb-4 text-destructive">{deleteError}</p>
          )}
          <div className="whitespace-pre-wrap leading-relaxed">
            {article.body}
          </div>
          {article.status === 'published' && (
            <section className="mt-10 border-t border-border pt-6">
              <h2 className="mb-4 text-lg font-bold">
                コメント ({comments.length})
              </h2>
              <CommentList comments={comments} onDelete={handleDeleteComment} />
            </section>
          )}
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
