import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Props = {
  onSubmit: (input: { authorName: string; content: string }) => Promise<void>
}

export function CommentForm({ onSubmit }: Props) {
  const [authorName, setAuthorName] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit({ authorName, content })
      setAuthorName('')
      setContent('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'コメントの投稿に失敗しました',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="authorName" className="mb-1 block text-sm font-medium">
          お名前
        </label>
        <Input
          id="authorName"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="名前を入力してください"
          maxLength={50}
          required
        />
      </div>
      <div>
        <label htmlFor="content" className="mb-1 block text-sm font-medium">
          コメント
        </label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="コメントを入力してください"
          maxLength={500}
          rows={4}
          required
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {content.length} / 500
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '投稿中...' : 'コメントを投稿'}
      </Button>
    </form>
  )
}
