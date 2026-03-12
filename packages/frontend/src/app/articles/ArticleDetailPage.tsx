import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ArticleDetail } from '@/core/types/article'
import { articleApi } from '@/features/articles/articles.api'
import {
  updateTagsAtom,
  updateTagsLoadingAtom,
} from '@/features/articles/articles.atom'

export function ArticleDetailPage() {
  const { publicId } = useParams<{ publicId: string }>()
  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [isEditingTags, setIsEditingTags] = useState(false)
  const [editTags, setEditTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)
  const isUpdatingTags = useAtomValue(updateTagsLoadingAtom)
  const updateTags = useSetAtom(updateTagsAtom)

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

  const startEditingTags = () => {
    if (!article) return
    setEditTags([...article.tags])
    setTagInput('')
    setTagError(null)
    setIsEditingTags(true)
  }

  const cancelEditingTags = () => {
    setIsEditingTags(false)
    setTagError(null)
  }

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !editTags.includes(trimmed)) {
      setEditTags([...editTags, trimmed])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setEditTags(editTags.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  const saveTags = async () => {
    if (!publicId) return
    setTagError(null)
    const result = await updateTags({ publicId, tags: editTags })
    if (result.status === 'success') {
      setArticle((prev) => (prev ? { ...prev, tags: result.data } : prev))
      setIsEditingTags(false)
    } else {
      setTagError(result.error)
    }
  }

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

          <div className="mb-6">
            {isEditingTags ? (
              <div className="space-y-2 rounded-md border p-3">
                {tagError && (
                  <p className="text-sm text-destructive">{tagError}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {editTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-0.5 hover:text-blue-600"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="タグを入力（Enterで追加）"
                    className="max-w-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTag}
                  >
                    追加
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={saveTags}
                    disabled={isUpdatingTags}
                  >
                    {isUpdatingTags ? '保存中...' : '保存'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditingTags}
                    disabled={isUpdatingTags}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-2">
                  {article.tags.length > 0 ? (
                    article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      タグなし
                    </span>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={startEditingTags}>
                  編集
                </Button>
              </div>
            )}
          </div>

          <div className="whitespace-pre-wrap leading-relaxed">
            {article.body}
          </div>
        </article>
      ) : null}
    </div>
  )
}
