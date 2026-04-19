import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { TagList } from '@/features/tags/TagList'

export function TagsPage() {
  return (
    <div className="mx-auto max-w-4xl p-5 font-sans">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">タグ管理</h1>
        <Button variant="outline" asChild>
          <Link to="/admin">記事一覧へ戻る</Link>
        </Button>
      </div>
      <TagList />
    </div>
  )
}
