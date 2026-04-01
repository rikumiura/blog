import { useAtomValue, useSetAtom } from 'jotai'
import { type ReactNode, useEffect } from 'react'
import { Navigate } from 'react-router'
import {
  isAuthenticatedAtom,
  verifyingTokenAtom,
  verifyTokenAtom,
} from './auth.atom'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom)
  const verifying = useAtomValue(verifyingTokenAtom)
  const verifyToken = useSetAtom(verifyTokenAtom)

  useEffect(() => {
    verifyToken()
  }, [verifyToken])

  if (verifying) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
