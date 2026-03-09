import { Link } from 'react-router'
import { ArticleCreateForm } from '@/features/articles/ArticleCreateForm'

export function ArticleCreatePage() {
  return (
    <div className="mx-auto max-w-4xl p-5 font-sans">
      <div className="mb-6">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">
          &larr; 記事一覧に戻る
        </Link>
        <h1 className="mt-2 text-2xl font-bold">記事を作成</h1>
      </div>
      <ArticleCreateForm />
    </div>
  )
}
