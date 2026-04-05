import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type Tab = 'edit' | 'preview' | 'split'

type Props = {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('edit')

  const previewHtml = useMemo(() => {
    if (!value) return ''
    const parsed = marked.parse(value)
    return DOMPurify.sanitize(typeof parsed === 'string' ? parsed : '')
  }, [value])

  const previewPane = (
    <div
      data-testid="preview-pane"
      className="prose min-h-[60vh] max-w-none overflow-y-auto rounded-md border p-4"
    >
      {value ? (
        <div
          // biome-ignore lint/security/noDangerouslySetInnerHtml: DOMPurify でサニタイズ済み HTML を表示
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      ) : (
        <p className="text-muted-foreground">本文がありません</p>
      )}
    </div>
  )

  return (
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
          <Button
            type="button"
            variant={activeTab === 'split' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('split')}
          >
            分割
          </Button>
        </div>
      </div>

      {activeTab === 'edit' && (
        <Textarea
          id="body"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={15}
          required
          className="min-h-[60vh] font-mono"
          placeholder="Markdown で本文を入力"
        />
      )}

      {activeTab === 'preview' && previewPane}

      {activeTab === 'split' && (
        <div className="grid h-[60vh] grid-cols-2 gap-2">
          <Textarea
            id="body"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={15}
            required
            className="h-full font-mono"
            placeholder="Markdown で本文を入力"
          />
          {previewPane}
        </div>
      )}
    </div>
  )
}
