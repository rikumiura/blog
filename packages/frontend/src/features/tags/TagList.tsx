import { useAtomValue } from 'jotai'
import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { TagSummary } from '@/core/types/tag'
import { tagRepositoryAtom } from './tags.atom'

export function TagList() {
  const repository = useAtomValue(tagRepositoryAtom)
  const [tags, setTags] = useState<TagSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await repository.listAll()
      setTags(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'タグの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [repository])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const trimmed = newName.trim()
      if (trimmed.length === 0 || isCreating) return

      setError(null)
      setIsCreating(true)
      try {
        await repository.create(trimmed)
        setNewName('')
        // サーバ側の並び順（ORDER BY name ASC）と一致させるため再フェッチする
        const data = await repository.listAll()
        setTags(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'タグの作成に失敗しました')
      } finally {
        setIsCreating(false)
      }
    },
    [newName, isCreating, repository],
  )

  const handleDelete = useCallback(
    async (tag: TagSummary) => {
      if (deletingId !== null) return

      const confirmed = globalThis.confirm(
        `「${tag.name}」を削除しますか？記事との紐付けも解除されます。`,
      )
      if (!confirmed) return

      setError(null)
      setDeletingId(tag.id)
      try {
        await repository.delete(tag.id)
        setTags((prev) => prev.filter((t) => t.id !== tag.id))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'タグの削除に失敗しました')
      } finally {
        setDeletingId(null)
      }
    },
    [deletingId, repository],
  )

  if (isLoading) return <p className="text-muted-foreground">読み込み中...</p>

  const canSubmit = newName.trim().length > 0 && !isCreating

  return (
    <div className="flex flex-col gap-4">
      <form className="flex gap-2" onSubmit={handleCreate}>
        <label htmlFor="new-tag-name" className="sr-only">
          新しいタグ名
        </label>
        <Input
          id="new-tag-name"
          type="text"
          placeholder="新しいタグ名"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          disabled={isCreating}
          maxLength={30}
        />
        <Button type="submit" disabled={!canSubmit}>
          {isCreating ? '作成中...' : '作成'}
        </Button>
      </form>
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
