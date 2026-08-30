import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sparkles, ShoppingBag } from 'lucide-react'

export function PageTransitionLoader({ fullScreen = false }: { fullScreen?: boolean }) {
  const [dots, setDots] = useState('.')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={`flex flex-col items-center justify-center transition-all duration-300 ${
        fullScreen
          ? 'fixed inset-0 z-50 bg-background/90 backdrop-blur-md'
          : 'min-h-[65vh] w-full p-8'
      }`}
    >
      <div className="relative flex flex-col items-center space-y-6 max-w-sm text-center">
        
        {/* Animated Glowing Emblem */}
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Aura */}
          <div className="absolute w-28 h-28 rounded-full bg-gradient-to-tr from-amber-500/30 via-primary/30 to-amber-600/30 blur-xl animate-pulse" />
          
          {/* Dual Orbiting Rings */}
          <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-primary/40 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute w-20 h-20 rounded-full border border-amber-400/60 border-t-transparent animate-spin" style={{ animationDuration: '2.5s' }} />
          
          {/* Center Logo Box */}
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-0.5 shadow-xl shadow-primary/30">
            <div className="w-full h-full bg-[#0a0a0f] rounded-[14px] flex flex-col items-center justify-center text-primary font-black">
              <span className="text-xl tracking-tighter bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200 bg-clip-text text-transparent">
                ORO
              </span>
              <span className="text-[8px] tracking-widest uppercase text-amber-500/80 -mt-1 font-mono">
                MALL
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Loading Text & Progress Bar */}
        <div className="space-y-3 w-full px-4">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: '4s' }} />
            <span>Mise à jour de la page{dots}</span>
          </div>

          {/* Shimmering Animated Bar */}
          <div className="h-1.5 w-48 mx-auto bg-muted rounded-full overflow-hidden relative shadow-inner">
            <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 via-primary to-amber-500 w-full animate-[progress_1.4s_ease-in-out_infinite] rounded-full shadow-[0_0_12px_rgba(245,158,11,0.8)]" />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Chargement instantané des offres et logements sécurisés
          </p>
        </div>

      </div>
    </div>
  )
}

/**
 * Top Glowing Progress Laser Beam on every page navigation
 */
export function RouteProgressBar() {
  const location = useLocation()
  const [navigating, setNavigating] = useState(false)

  useEffect(() => {
    setNavigating(true)
    // Scroll automatically to top on route change
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })

    const timer = setTimeout(() => {
      setNavigating(false)
    }, 450)

    return () => clearTimeout(timer)
  }, [location.pathname, location.search])

  if (!navigating) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-1">
      <div className="h-full w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 animate-[laserBeam_0.45s_ease-out_forwards] shadow-[0_0_15px_rgba(245,158,11,1)]" />
    </div>
  )
}
