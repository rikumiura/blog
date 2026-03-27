import { useAtomValue } from 'jotai'
import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { isAuthenticatedAtom } from './auth.atom'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom)

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
