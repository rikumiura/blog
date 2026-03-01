import { PostsTable } from '@/features/posts/PostsTable'

function App() {
  return (
    <div className="mx-auto max-w-4xl p-5 font-sans">
      <h1 className="mb-6 text-2xl font-bold">投稿一覧</h1>
      <PostsTable />
    </div>
  )
}

export default App
