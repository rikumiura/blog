import { useAtomValue, useSetAtom } from 'jotai'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  articlesErrorAtom,
  createLoadingAtom,
  createArticleAtom,
} from './articles.atom'

export function ArticleCreateForm() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const isLoading = useAtomValue(createLoadingAtom)
  const error = useAtomValue(articlesErrorAtom)
  const createArticle = useSetAtom(createArticleAtom)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = await createArticle({ title, body })
    if (result.status === 'success') {
      navigate('/articles')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          タイトル
        </label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="記事のタイトルを入力"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="body" className="text-sm font-medium">
          本文（Markdown）
        </label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={15}
          required
          className="font-mono"
          placeholder="Markdown で本文を入力"
        />
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? '作成中...' : '下書き保存'}
      </Button>
    </form>
  )
}
