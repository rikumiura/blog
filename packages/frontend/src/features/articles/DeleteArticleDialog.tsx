import { useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'

type DeleteArticleDialogProps = {
  articleTitle: string
  isOpen: boolean
  isDeleting: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteArticleDialog({
  articleTitle,
  isOpen,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteArticleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onCancel()
      }
    },
    [onCancel],
  )

  if (!isOpen) return null

  return (
    <dialog
      ref={dialogRef}
      className="rounded-lg border bg-background p-6 shadow-lg backdrop:bg-black/50"
      onClick={handleBackdropClick}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel()
      }}
      onClose={onCancel}
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">記事の削除</h2>
        <p className="text-sm text-muted-foreground">
          「{articleTitle}」を削除しますか？この操作は取り消せません。
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isDeleting}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? '削除中...' : '削除する'}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
