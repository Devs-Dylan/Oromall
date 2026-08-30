import React, { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import { NewsTickerBanner } from './NewsTickerBanner'
import { MobileBottomNav } from './MobileBottomNav'
import { RouteProgressBar } from './PageTransitionLoader'
import { Toaster } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { useAuth } from '@/hooks/useAuth'
import { Lock, Sparkles, UserCheck, X } from 'lucide-react'

export default function AppLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const isAuthPage = ['/login', '/register', '/admin/login', '/role'].includes(location.pathname)

  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0 relative">
      {/* Route Navigation Top Progress Beam */}
      <RouteProgressBar />

      {/* Visiteur non connecté : Barre d'invitation sécurisée */}
      {!user && !isAuthPage && !bannerDismissed && (
        <div className="bg-gradient-to-r from-amber-600 via-primary to-amber-700 text-black text-xs font-semibold py-2 px-4 shadow-md flex items-center justify-between gap-3 sticky top-0 z-40">
          <div className="flex items-center gap-2 truncate mx-auto text-center sm:text-left">
            <span className="p-1 rounded-md bg-black/10 hidden sm:inline-flex">
              <Lock className="w-3.5 h-3.5 text-black" />
            </span>
            <span className="truncate">
              <strong>Mode Visiteur :</strong> Connectez-vous pour commander des produits, réserver des visites et vendre vos articles.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/login"
              state={{ from: location }}
              className="px-3 py-1 rounded-lg bg-black text-white text-[11px] font-bold hover:bg-black/80 transition-colors inline-flex items-center gap-1 shadow-sm"
            >
              <UserCheck className="w-3 h-3 text-primary" /> Connexion
            </Link>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 rounded-md hover:bg-black/10 text-black transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <NewsTickerBanner />
      <Footer />
      <MobileBottomNav />
      <Toaster />
    </div>
  )
}
