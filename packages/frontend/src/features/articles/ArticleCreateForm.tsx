import DOMPurify from 'dompurify'
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
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('edit')
  const isLoading = useAtomValue(createLoadingAtom)
  const error = useAtomValue(articlesErrorAtom)
  const createArticle = useSetAtom(createArticleAtom)
  const navigate = useNavigate()

  const previewHtml = useMemo(() => {
    if (!body) return ''
    const parsed = marked.parse(body)
    return DOMPurify.sanitize(typeof parsed === 'string' ? parsed : '')
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

  const addTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag))
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  const [isPublish, setIsPublish] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const result = await createArticle({
      title,
      body,
      tags,
      publish: isPublish,
    })
    setIsPublish(false)
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
        <label htmlFor="tags" className="text-sm font-medium">
          タグ
        </label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
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
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="タグを入力（Enterで追加）"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag}>
            追加
          </Button>
        </div>
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
                // biome-ignore lint/security/noDangerouslySetInnerHtml: DOMPurify でサニタイズ済み HTML を表示
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-muted-foreground">本文がありません</p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '保存中...' : '下書き保存'}
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          onClick={() => setIsPublish(true)}
        >
          {isLoading ? '公開中...' : '公開する'}
        </Button>
      </div>
    </form>
  )
}
