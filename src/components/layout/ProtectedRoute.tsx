import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  children: React.ReactNode
  requireSeller?: boolean
  requireAdmin?: boolean
  requireAssociate?: boolean
}

export default function ProtectedRoute({ children, requireSeller, requireAdmin, requireAssociate }: Props) {
  const { user, isLoading, isAdmin, isSeller, isAssociate } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-black text-lg animate-pulse-glow">M+</div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (isAdmin()) return <>{children}</>
  if (requireAssociate && !isAssociate()) return <Navigate to="/admin/login" replace />
  if (!user.account_type && location.pathname !== '/role') return <Navigate to="/role" replace />
  if (requireAdmin && !isAdmin()) return <Navigate to="/" replace />
  if (requireSeller && !isSeller()) return <Navigate to="/" replace />

  return <>{children}</>
}
