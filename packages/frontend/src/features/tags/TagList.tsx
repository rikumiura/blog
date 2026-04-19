import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type TagSummary, tagsApi } from './tags.api'

export function TagList() {
  const [tags, setTags] = useState<TagSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await tagsApi.listAll()
      setTags(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'タグの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = useCallback(async (tag: TagSummary) => {
    const confirmed = globalThis.confirm(
      `「${tag.name}」を削除しますか？記事との紐付けも解除されます。`,
    )
    if (!confirmed) return

    setDeletingId(tag.id)
    try {
      await tagsApi.delete(tag.id)
      setTags((prev) => prev.filter((t) => t.id !== tag.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'タグの削除に失敗しました')
    } finally {
      setDeletingId(null)
    }
  }, [])

  if (isLoading) return <p className="text-muted-foreground">読み込み中...</p>

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {tags.length === 0 ? (
        <p className="text-muted-foreground">タグはまだありません。</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>タグ名</TableHead>
              <TableHead className="w-32 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => (
              <TableRow key={tag.id}>
                <TableCell>{tag.name}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(tag)}
                    disabled={deletingId === tag.id}
                  >
                    {deletingId === tag.id ? '削除中...' : '削除'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
