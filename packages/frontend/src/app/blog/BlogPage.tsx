import { BlogArticleList } from '@/features/blog/BlogArticleList'

export function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 font-sans">
      <header className="mb-10">
        <h1 className="text-3xl font-bold">ブログ</h1>
      </header>
      <main>
        <BlogArticleList />
      </main>
    </div>
  )
}
