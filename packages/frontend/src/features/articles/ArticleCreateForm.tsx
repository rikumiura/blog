import { useAtomValue, useSetAtom } from 'jotai'
import { marked } from 'marked'
import { type ChangeEvent, type FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  articlesErrorAtom,
  createArticleAtom,
  createLoadingAtom,
} from './articles.atom'

type Tab = 'edit' | 'preview'

export function ArticleCreateForm() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('edit')
  const isLoading = useAtomValue(createLoadingAtom)
  const error = useAtomValue(articlesErrorAtom)
  const createArticle = useSetAtom(createArticleAtom)
  const navigate = useNavigate()

  const previewHtml = useMemo(() => {
    if (!body) return ''
    return marked.parse(body) as string
  }, [body])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setTitle((prev) => {
      if (prev) return prev
      return file.name.replace(/\.md$/, '')
    })

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        setBody(content)
      }
    }
    reader.readAsText(file)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = await createArticle({ title, body })
    if (result.status === 'success') {
      navigate('/')
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
        <div className="flex items-center justify-between">
          <label htmlFor="body" className="text-sm font-medium">
            本文（Markdown）
          </label>
          <div className="flex gap-1">
            <Button
              type="button"
              variant={activeTab === 'edit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('edit')}
            >
              編集
            </Button>
            <Button
              type="button"
              variant={activeTab === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('preview')}
            >
              プレビュー
            </Button>
          </div>
        </div>
        <Input
          id="md-file"
          type="file"
          accept=".md"
          onChange={handleFileChange}
          className="w-auto"
        />
        {activeTab === 'edit' ? (
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={15}
            required
            className="min-h-[60vh] font-mono"
            placeholder="Markdown で本文を入力"
          />
        ) : (
          <div className="prose min-h-[60vh] max-w-none rounded-md border p-4">
            {body ? (
              <div
                // biome-ignore lint/security/noDangerouslySetInnerHtml: marked によるサニタイズ済み HTML を表示
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-muted-foreground">本文がありません</p>
            )}
          </div>
        )}
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? '作成中...' : '下書き保存'}
      </Button>
    </form>
  )
}
