import { useEffect, useState } from 'react'
import type { Comment } from '@/core/types/comment'
import { commentsApi } from '@/features/comments/comments.api'
import { CommentForm } from './CommentForm'
import { CommentList } from './CommentList'

type Props = {
  publicId: string
}

export function BlogCommentSection({ publicId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    commentsApi
      .listByArticle(publicId)
      .then((data) => {
        if (!cancelled) setComments(data)
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : 'コメントの取得に失敗しました',
          )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [publicId])

  const handlePostComment = async (input: {
    authorName: string
    content: string
  }) => {
    const newComment = await commentsApi.post(publicId, input)
    setComments((prev) => [...prev, newComment])
  }

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="mb-6 text-xl font-bold">コメント</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">コメントを読み込み中...</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <CommentList comments={comments} className="mb-8" />
      )}
      <h3 className="mb-4 mt-8 text-base font-semibold">
        コメントを投稿する
      </h3>
      <CommentForm onSubmit={handlePostComment} />
    </section>
  )
}
