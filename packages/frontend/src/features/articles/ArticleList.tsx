import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  articlesAtom,
  articlesErrorAtom,
  deleteArticleAtom,
  deleteLoadingAtom,
  fetchArticlesAtom,
  fetchLoadingAtom,
  publishArticleAtom,
  publishLoadingAtom,
} from './articles.atom'
import { DeleteArticleDialog } from './DeleteArticleDialog'

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ArticleList() {
  const articles = useAtomValue(articlesAtom)
  const isFetching = useAtomValue(fetchLoadingAtom)
  const isPublishing = useAtomValue(publishLoadingAtom)
  const isDeleting = useAtomValue(deleteLoadingAtom)
  const error = useAtomValue(articlesErrorAtom)
  const fetchArticles = useSetAtom(fetchArticlesAtom)
  const publishArticle = useSetAtom(publishArticleAtom)
  const deleteArticle = useSetAtom(deleteArticleAtom)
  const [deleteTarget, setDeleteTarget] = useState<{
    publicId: string
    title: string
  } | null>(null)

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    const result = await deleteArticle(deleteTarget.publicId)
    if (result.status === 'success') {
      setDeleteTarget(null)
    }
  }, [deleteTarget, deleteArticle])

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ステータス</TableHead>
            <TableHead>タイトル</TableHead>
            <TableHead>タグ</TableHead>
            <TableHead>作成日時</TableHead>
            <TableHead>更新日時</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isFetching ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                読み込み中...
              </TableCell>
            </TableRow>
          ) : error ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-destructive">
                {error}
              </TableCell>
            </TableRow>
          ) : articles.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                記事がありません
              </TableCell>
            </TableRow>
          ) : (
            articles.map((article) => (
              <TableRow key={article.publicId}>
                <TableCell>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      article.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {article.status === 'published' ? '公開' : '下書き'}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    to={`/articles/${article.publicId}`}
                    className="hover:underline"
                  >
                    {article.title}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{formatDateTime(article.createdAt)}</TableCell>
                <TableCell>{formatDateTime(article.updatedAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/articles/${article.publicId}/edit`}>
                        編集
                      </Link>
                    </Button>
                    {article.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => publishArticle(article.publicId)}
                        disabled={isPublishing}
                      >
                        公開する
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setDeleteTarget({
                          publicId: article.publicId,
                          title: article.title,
                        })
                      }
                      disabled={isDeleting}
                    >
                      削除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <DeleteArticleDialog
        articleTitle={deleteTarget?.title ?? ''}
        isOpen={deleteTarget !== null}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}
