import { useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/pagination'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  articlesErrorAtom,
  cancelScheduleAtom,
  changePageAtom,
  currentPageAtom,
  deleteArticleAtom,
  deleteLoadingAtom,
  fetchArticlesAtom,
  fetchLoadingAtom,
  filteredArticlesAtom,
  publishArticleAtom,
  publishLoadingAtom,
  scheduleArticleAtom,
  scheduleLoadingAtom,
  selectedTagsAtom,
  totalPagesAtom,
} from './articles.atom'
import { DeleteArticleDialog } from './DeleteArticleDialog'
import { ScheduleDialog } from './ScheduleDialog'
import { TagFilter } from './TagFilter'

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    published: 'bg-green-100 text-green-800',
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-yellow-100 text-yellow-800',
  }
  const labels = {
    published: '公開',
    draft: '下書き',
    scheduled: '予約',
  }
  const key = status as keyof typeof styles
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[key] ?? styles.draft}`}
    >
      {labels[key] ?? status}
    </span>
  )
}

export function ArticleList() {
  const articles = useAtomValue(filteredArticlesAtom)
  const selectedTags = useAtomValue(selectedTagsAtom)
  const currentPage = useAtomValue(currentPageAtom)
  const totalPages = useAtomValue(totalPagesAtom)
  const isFetching = useAtomValue(fetchLoadingAtom)
  const isPublishing = useAtomValue(publishLoadingAtom)
  const isDeleting = useAtomValue(deleteLoadingAtom)
  const isScheduling = useAtomValue(scheduleLoadingAtom)
  const error = useAtomValue(articlesErrorAtom)
  const fetchArticles = useSetAtom(fetchArticlesAtom)
  const changePage = useSetAtom(changePageAtom)
  const publishArticle = useSetAtom(publishArticleAtom)
  const deleteArticle = useSetAtom(deleteArticleAtom)
  const scheduleArticle = useSetAtom(scheduleArticleAtom)
  const cancelSchedule = useSetAtom(cancelScheduleAtom)
  const [deleteTarget, setDeleteTarget] = useState<{
    publicId: string
    title: string
  } | null>(null)
  const [scheduleTarget, setScheduleTarget] = useState<{
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

  const handleScheduleConfirm = useCallback(
    async (scheduledAt: string) => {
      if (!scheduleTarget) return
      const result = await scheduleArticle({
        publicId: scheduleTarget.publicId,
        scheduledAt,
      })
      if (result.status === 'success') {
        setScheduleTarget(null)
      }
    },
    [scheduleTarget, scheduleArticle],
  )

  return (
    <>
      <TagFilter />
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
                {selectedTags.length > 0
                  ? '選択したタグに一致する記事がありません'
                  : '記事がありません'}
              </TableCell>
            </TableRow>
          ) : (
            articles.map((article) => (
              <TableRow key={article.publicId}>
                <TableCell>
                  <div className="space-y-1">
                    <StatusBadge status={article.status} />
                    {article.status === 'scheduled' && article.scheduledAt && (
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(article.scheduledAt)}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    to={`/admin/articles/${article.publicId}`}
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
                      <Link to={`/admin/articles/${article.publicId}/edit`}>
                        編集
                      </Link>
                    </Button>
                    {article.status === 'draft' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => publishArticle(article.publicId)}
                          disabled={isPublishing}
                        >
                          公開する
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setScheduleTarget({
                              publicId: article.publicId,
                              title: article.title,
                            })
                          }
                          disabled={isScheduling}
                        >
                          予約公開
                        </Button>
                      </>
                    )}
                    {article.status === 'scheduled' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => publishArticle(article.publicId)}
                          disabled={isPublishing}
                        >
                          今すぐ公開
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelSchedule(article.publicId)}
                          disabled={isScheduling}
                        >
                          予約取消
                        </Button>
                      </>
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
      {selectedTags.length === 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={changePage}
        />
      )}
      <DeleteArticleDialog
        articleTitle={deleteTarget?.title ?? ''}
        isOpen={deleteTarget !== null}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
      <ScheduleDialog
        articleTitle={scheduleTarget?.title ?? ''}
        isOpen={scheduleTarget !== null}
        isLoading={isScheduling}
        onConfirm={handleScheduleConfirm}
        onCancel={() => setScheduleTarget(null)}
      />
    </>
  )
}
