import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ScheduleDialogProps = {
  articleTitle: string
  isOpen: boolean
  isLoading: boolean
  onConfirm: (scheduledAt: string) => void
  onCancel: () => void
}

function getDefaultScheduledAt(): string {
  // 現在時刻の1時間後をデフォルト値にする（分単位で切り捨て）
  const date = new Date()
  date.setHours(date.getHours() + 1)
  date.setMinutes(0, 0, 0)
  // datetime-local の入力形式に変換（YYYY-MM-DDTHH:mm）
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function ScheduleDialog({
  articleTitle,
  isOpen,
  isLoading,
  onConfirm,
  onCancel,
}: ScheduleDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [scheduledAt, setScheduledAt] = useState('')

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      setScheduledAt(getDefaultScheduledAt())
      dialog.showModal()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  const handleConfirm = useCallback(() => {
    if (!scheduledAt) return
    // datetime-local の値をISO 8601形式に変換
    const isoString = new Date(scheduledAt).toISOString()
    onConfirm(isoString)
  }, [scheduledAt, onConfirm])

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
    // biome-ignore lint/a11y/useKeyWithClickEvents: dialog要素はネイティブのEscapeキーハンドリング（onClose）でキーボード操作に対応済み
    <dialog
      ref={dialogRef}
      className="rounded-lg border bg-background p-6 shadow-lg backdrop:bg-black/50"
      onClick={handleBackdropClick}
      onClose={onCancel}
    >
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">予約公開</h2>
        <p className="text-sm text-muted-foreground">
          「{articleTitle}」の公開日時を設定してください。
        </p>
        <div className="space-y-2">
          <label htmlFor="scheduled-at" className="text-sm font-medium">
            公開日時
          </label>
          <Input
            id="scheduled-at"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isLoading || !scheduledAt}
          >
            {isLoading ? '設定中...' : '予約する'}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
