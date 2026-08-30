import { useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function useRequireAuth() {
  const { user } = useAuth()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [modalMeta, setModalMeta] = useState<{ title?: string; description?: string; actionName?: string }>({})

  const requireAuth = useCallback((
    callback: () => void,
    meta?: { title?: string; description?: string; actionName?: string }
  ) => {
    if (user) {
      callback()
    } else {
      setModalMeta(meta || {
        title: 'Connexion requise',
        description: 'Veuillez vous connecter pour continuer cette action.',
      })
      setAuthModalOpen(true)
    }
  }, [user])

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false)
  }, [])

  return {
    isAuthenticated: Boolean(user),
    user,
    requireAuth,
    authModalOpen,
    closeAuthModal,
    modalMeta,
  }
}
