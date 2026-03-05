import { useAtomValue, useSetAtom } from 'jotai'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  articlesErrorAtom,
  articlesLoadingAtom,
  createArticleAtom,
} from './articles.atom'

export function ArticleCreateForm() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const isLoading = useAtomValue(articlesLoadingAtom)
  const error = useAtomValue(articlesErrorAtom)
  const createArticle = useSetAtom(createArticleAtom)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await createArticle({ title, body })
    navigate('/articles')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          タイトル
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="記事のタイトルを入力"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="body" className="text-sm font-medium">
          本文（Markdown）
        </label>
        <textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={15}
          className="w-full rounded-md border px-3 py-2 font-mono text-sm"
          placeholder="Markdown で本文を入力"
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? '作成中...' : '下書き保存'}
      </Button>
    </form>
  )
}
