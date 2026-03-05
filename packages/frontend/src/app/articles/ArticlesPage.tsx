import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { ArticleList } from '@/features/articles/ArticleList'

export function ArticlesPage() {
  return (
    <div className="mx-auto max-w-4xl p-5 font-sans">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">記事一覧</h1>
        <Button asChild>
          <Link to="/articles/new">新規作成</Link>
        </Button>
      </div>
      <ArticleList />
    </div>
  )
}
