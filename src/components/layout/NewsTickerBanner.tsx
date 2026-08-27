import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { AdAPI, PromoAPI, HousingAPI } from '@/lib/store'
import type { Advertisement, PromoCode, Housing } from '@/types'
import { formatPrice, cn } from '@/lib/utils'

interface TickerItem {
  id: string
  category: 'ad' | 'promo' | 'housing' | 'platform'
  badge: string
  badgeColor: string
  title: string
  subtitle?: string
  link?: string
}

export function NewsTickerBanner() {
  const [ads, setAds] = useState<Advertisement[]>(() => AdAPI.list())
  const [promos, setPromos] = useState<PromoCode[]>(() => PromoAPI.list())
  const [housings, setHousings] = useState<Housing[]>(() => HousingAPI.list())
  const [isPaused, setIsPaused] = useState<boolean>(false)

  // Listen to storage events to keep ticker synchronized in real-time
  useEffect(() => {
    const handleStorage = () => {
      setAds(AdAPI.list())
      setPromos(PromoAPI.list())
      setHousings(HousingAPI.list())
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  // Build the list of ticker headlines
  const tickerItems: TickerItem[] = useMemo(() => {
    const items: TickerItem[] = []

    // 1. Active Ads from Store
    const activeAds = ads.filter((a: Advertisement) => a.status === 'active')
    activeAds.forEach((ad: Advertisement) => {
      items.push({
        id: `ad-${ad.id}`,
        category: 'ad',
        badge: ad.badge || 'ANNONCE SPÉCIALE ⚡',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        title: ad.title,
        subtitle: ad.subtitle,
        link: ad.link_url || '/'
      })
    })

    // 2. Active Promo Codes
    const activePromos = promos.filter((p: PromoCode) => p.active)
    activePromos.forEach((p: PromoCode) => {
      items.push({
        id: `promo-${p.id}`,
        category: 'promo',
        badge: `CODE PROMO -${p.discount_type === 'percent' ? `${p.value}%` : `${p.value} F`} 🔥`,
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        title: `Code "${p.code}" : ${p.description || 'Remise immédiate sur votre panier !'}`,
        subtitle: 'Utilisez-le dès maintenant à la caisse',
        link: '/cart'
      })
    })

    // 3. Featured Housings
    const activeHousings = housings.filter((h: Housing) => h.status === 'available' || (h.status as any) === 'active').slice(0, 3)
    activeHousings.forEach((h: Housing) => {
      items.push({
        id: `house-${h.id}`,
        category: 'housing',
        badge: 'DISPO LOGEMENT 🏠',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        title: `${h.title} (${h.city} - ${h.neighborhood})`,
        subtitle: `${formatPrice(h.price)} / ${h.price_type === 'day' ? 'jour' : 'mois'}`,
        link: `/housing/${h.id}`
      })
    })

    // 4. Platform Highlights
    items.push(
      {
        id: 'platform-1',
        category: 'platform',
        badge: 'PAIEMENTS SÉCURISÉS 🔒',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        title: 'Transactions protégées par code PIN secret & validation Mobile Money (MTN / Orange)',
        subtitle: 'Achetez et louez sans risque',
        link: '/'
      },
      {
        id: 'platform-2',
        category: 'platform',
        badge: 'CARTE INTERACTIVE 🗺️',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        title: 'Trouvez tous les commerces, résidences et campus universitaires autour de vous en 1 clic',
        subtitle: 'Visualisation GPS en temps réel',
        link: '/map'
      },
      {
        id: 'platform-3',
        category: 'platform',
        badge: 'DEVENIR VENDEUR 🛍️',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        title: 'Ouvrez votre boutique en ligne et commencez à vendre auprès de milliers de clients',
        subtitle: 'Activation rapide & gestion complète',
        link: '/seller/onboarding'
      }
    )

    return items
  }, [ads, promos, housings])

  if (tickerItems.length === 0) return null

  // Duplicate items array to make seamless continuous loop
  const displayItems = [...tickerItems, ...tickerItems]

  return (
    <aside aria-label="Bandeau publicitaire et informations en direct" className="relative w-full overflow-hidden bg-slate-950/95 dark:bg-black/95 border-y border-amber-500/30 text-white shadow-2xl z-20 backdrop-blur-md">
      {/* Top Gold Glow Highlight */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent pointer-events-none" />

      <div className="flex items-center h-12 sm:h-14">
        {/* TV Breaking News Tag (TV news channel style with pulsating red LED) */}
        <div className="flex-shrink-0 z-10 flex items-center h-full px-3 sm:px-5 bg-gradient-to-r from-red-600 to-rose-700 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-lg border-r border-red-400/40 gap-2 select-none">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
          <span className="hidden xs:inline-block font-extrabold tracking-widest">FLASH INFO</span>
          <span className="xs:hidden">LIVE</span>
          <span className="hidden sm:inline-block bg-black/30 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border border-white/20">24/7</span>
        </div>

        {/* Scrolling Ticker Area */}
        <div
          className="flex-1 overflow-hidden relative flex items-center h-full py-1"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Gradient smooth masks on sides */}
          <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-slate-950 dark:from-black to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-slate-950 dark:from-black to-transparent z-10 pointer-events-none" />

          {/* Marquee Track */}
          <div className={cn('animate-ticker flex items-center gap-6 sm:gap-10 whitespace-nowrap pl-4', isPaused && '[animation-play-state:paused]')}>
            {displayItems.map((item, index) => {
              const Content = (
                <div className="inline-flex items-center gap-2.5 group cursor-pointer py-1 px-2.5 rounded-lg transition-all duration-200 hover:bg-white/10">
                  {/* Category Badge */}
                  <span className={cn('px-2 py-0.5 text-[10px] sm:text-[11px] font-black rounded-md border tracking-wider uppercase', item.badgeColor)}>
                    {item.badge}
                  </span>

                  {/* Title & Subtitle */}
                  <span className="text-xs sm:text-sm font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </span>

                  {item.subtitle && (
                    <span className="hidden md:inline-block text-[11px] sm:text-xs text-slate-400 font-normal">
                      • {item.subtitle}
                    </span>
                  )}

                  {/* Arrow Indicator */}
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400/80 group-hover:translate-x-1 group-hover:text-amber-300 transition-transform flex-shrink-0" />

                  {/* Separator icon between headlines */}
                  <span className="text-amber-500/60 ml-4 text-xs font-bold select-none">✦</span>
                </div>
              )

              if (item.link) {
                return (
                  <Link
                    key={`${item.id}-${index}`}
                    to={item.link}
                    className="inline-flex items-center"
                  >
                    {Content}
                  </Link>
                )
              }

              return (
                <div key={`${item.id}-${index}`} className="inline-flex items-center">
                  {Content}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Gold Glow Highlight */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent pointer-events-none" />
    </aside>
  )
}
