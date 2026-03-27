import { LoginForm } from '@/features/auth/LoginForm'

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-6">
        <h1 className="text-center text-2xl font-bold">管理者ログイン</h1>
        <LoginForm />
      </div>
    </div>
  )
}
