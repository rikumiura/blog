import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toAbsoluteImageUrl, uploadImage } from './image.api'

type Tab = 'edit' | 'preview' | 'split'

type Props = {
  value: string
  onChange: (value: string) => void
}

export function MarkdownEditor({ value, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('edit')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // アップロード完了時点で最新の value を参照するための ref（P1対策）
  const latestValueRef = useRef(value)
  latestValueRef.current = value

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setIsUploading(true)
    try {
      const result = await uploadImage(file)
      const absoluteUrl = toAbsoluteImageUrl(result.url)
      // P1: uploadImage 完了後に最新の value を使う
      const current = latestValueRef.current
      // P2: 末尾に改行がなければ改行を挟む
      const separator =
        current.length > 0 && !current.endsWith('\n') ? '\n' : ''
      onChange(`${current}${separator}![${file.name}](${absoluteUrl})`)
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : '画像のアップロードに失敗しました',
      )
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            画像挿入
          </Button>
          <Button
            type="button"
            variant={activeTab === 'edit' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setActiveTab('edit')
              setUploadError(null)
            }}
          >
            編集
          </Button>
          <Button
            type="button"
            variant={activeTab === 'preview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setActiveTab('preview')
              setUploadError(null)
            }}
          >
            プレビュー
          </Button>
          <Button
            type="button"
            variant={activeTab === 'split' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              setActiveTab('split')
              setUploadError(null)
            }}
          >
            分割
          </Button>
        </div>
      </div>
      {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}

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
