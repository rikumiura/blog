import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect } from 'react'
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
  fetchLoadingAtom,
  publishLoadingAtom,
  fetchArticlesAtom,
  publishArticleAtom,
} from './articles.atom'

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
  const error = useAtomValue(articlesErrorAtom)
  const fetchArticles = useSetAtom(fetchArticlesAtom)
  const publishArticle = useSetAtom(publishArticleAtom)

  useEffect(() => {
    fetchArticles()
  }, [fetchArticles])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ステータス</TableHead>
          <TableHead>タイトル</TableHead>
          <TableHead>作成日時</TableHead>
          <TableHead>更新日時</TableHead>
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isFetching ? (
          <TableRow>
            <TableCell
              colSpan={5}
              className="text-center text-muted-foreground"
            >
              読み込み中...
            </TableCell>
          </TableRow>
        ) : error ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-destructive">
              {error}
            </TableCell>
          </TableRow>
        ) : articles.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={5}
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
              <TableCell className="font-medium">{article.title}</TableCell>
              <TableCell>{formatDateTime(article.createdAt)}</TableCell>
              <TableCell>{formatDateTime(article.updatedAt)}</TableCell>
              <TableCell>
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
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}
