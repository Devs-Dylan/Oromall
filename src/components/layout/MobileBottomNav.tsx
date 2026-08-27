import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Store, Home, Map, ShoppingBag, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { cn } from '@/lib/utils'

export function MobileBottomNav() {
  const location = useLocation()
  const { user } = useAuth()
  const { count: cartCount } = useCart()

  const navItems = [
    { to: '/', label: 'Boutique', icon: Store },
    { to: '/housing', label: 'Logements', icon: Home },
    { to: '/map', label: 'Carte', icon: Map },
    { to: '/orders', label: 'Commandes', icon: ShoppingBag, badge: cartCount },
    { to: user ? (user.account_type === 'seller' ? '/seller' : '/orders') : '/login', label: 'Mon Compte', icon: User },
  ]

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl px-2 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-150 relative text-[11px] font-bold',
              isActive
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <Icon className="w-5 h-5 mb-0.5" />
              {!!item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-card">
                  {item.badge}
                </span>
              )}
            </div>
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </div>
  )
}
