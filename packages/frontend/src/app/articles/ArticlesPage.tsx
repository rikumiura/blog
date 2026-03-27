import { useSetAtom } from 'jotai'
import { Link, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { ArticleList } from '@/features/articles/ArticleList'
import { logoutAtom } from '@/features/auth/auth.atom'

export function ArticlesPage() {
  const logout = useSetAtom(logoutAtom)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="mx-auto max-w-4xl p-5 font-sans">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">記事一覧</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/admin/articles/new">新規作成</Link>
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            ログアウト
          </Button>
        </div>
      </div>
      <ArticleList />
    </div>
  )
}
