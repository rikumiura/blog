import type { Comment } from '@/core/types/comment'
import { formatDate } from '@/lib/format'

type Props = {
  comments: Comment[]
  onDelete?: (id: string) => void
}

export function CommentList({ comments, onDelete }: Props) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        コメントはまだありません。
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li
          key={comment.id}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <span className="text-sm font-semibold">
                {comment.authorName}
              </span>
              <time
                dateTime={comment.createdAt}
                className="ml-3 text-xs text-muted-foreground"
              >
                {formatDate(comment.createdAt)}
              </time>
            </div>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="shrink-0 text-xs text-destructive hover:underline"
              >
                削除
              </button>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {comment.content}
          </p>
        </li>
      ))}
    </ul>
  )
}
