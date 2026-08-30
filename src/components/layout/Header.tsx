import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Store, User, LogOut, Settings, LayoutDashboard,
  Menu, X, Moon, Sun, ShoppingCart, Heart, Users,
  Shield, Handshake, HelpCircle, Download, Home, Map, ChevronDown, CheckCircle2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { cn } from '@/lib/utils'
import { SmartSearchBar } from '@/components/shared/SmartSearchBar'

export default function Header() {
  const { user, logout, isAdmin, isAssociate } = useAuth()
  const { count } = useCart()
  const { totalCount: wishCount } = useWishlist()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [dark, setDark] = useState(() => localStorage.getItem('mp_dark') === '1')
  const [scrolled, setScrolled] = useState(false)
  const [announcement, setAnnouncement] = useState(() => localStorage.getItem('mp_announcement') || 'OroMall : Achetez et louez en toute sérénité au Cameroun avec paiement Mobile Money sécurisé.')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('mp_dark', dark ? '1' : '0')
  }, [dark])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 15)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  const navLinks = [
    { to: '/', label: 'Marketplace', icon: Store },
    { to: '/housing', label: 'Logements', icon: Home },
    { to: '/map', label: 'Carte Interactive', icon: Map },
    { to: '/p2p', label: 'P2P & Services', icon: Handshake },
    { to: '/orders', label: 'Mes Commandes', icon: ShoppingBag },
  ]

  return (
    <>
      {/* Top Subtle Announcement */}
      {announcement && (
        <div className="bg-foreground text-background px-4 py-2 text-[12px] font-medium text-center flex items-center justify-center gap-3">
          <span>{announcement}</span>
          <button
            onClick={() => setAnnouncement('')}
            className="text-background/60 hover:text-background transition-colors p-0.5"
            title="Masquer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <header className={cn(
        'sticky top-0 z-40 transition-all duration-200 border-b',
        scrolled
          ? 'bg-card/90 backdrop-blur-md border-border shadow-sm'
          : 'bg-card border-border/60'
      )}>
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-primary text-black font-black text-sm shadow-md flex items-center justify-center transition-transform group-hover:scale-105 border border-amber-400/40">
                OM
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-foreground leading-none flex items-center gap-1">
                  OroMall <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-primary/20 text-primary uppercase">Gold</span>
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase mt-0.5">
                  Cameroun E-Commerce & Logements
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(l => {
                const isActive = location.pathname === l.to
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                      isActive
                        ? 'bg-primary/10 text-primary font-bold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <l.icon className="w-3.5 h-3.5" />
                    {l.label}
                  </Link>
                )
              })}

              {user?.account_type === 'seller' && (
                <Link
                  to="/seller"
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                    location.pathname.startsWith('/seller')
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Espace Vendeur
                </Link>
              )}

              {isAdmin() && (
                <Link
                  to="/admin"
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5',
                    location.pathname.startsWith('/admin')
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  Console Admin
                </Link>
              )}
            </nav>
          </div>

          {/* Smart Omnibar (Desktop) */}
          <div className="hidden lg:flex items-center flex-1 max-w-sm xl:max-w-md mx-4">
            <SmartSearchBar variant="header" placeholder="Recherche intelligente (ex: iPhone, Bastos, ESTLC)..." />
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
              title="Mes Favoris"
            >
              <Heart className="w-4 h-4" />
              {wishCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {wishCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
              title="Mon Panier"
            >
              <ShoppingCart className="w-4 h-4" />
              {count > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {count}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={() => setDark(!dark)}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Account Menu / Auth */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border transition-all text-xs font-semibold",
                    userMenuOpen
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border hover:bg-muted text-foreground"
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline-block max-w-[90px] truncate">{user.name}</span>
                  <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform duration-200", userMenuOpen && "rotate-180 text-primary")} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-card border border-border shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                    <div className="px-4 py-2.5 border-b border-border/60">
                      <p className="font-bold text-foreground truncate">{user.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      <div className="mt-1.5">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold inline-block",
                          user.role === 'admin' && "bg-amber-500/20 text-amber-400 border border-amber-500/30",
                          user.role === 'associate' && "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
                          user.role !== 'admin' && user.role !== 'associate' && (user.account_type === 'seller' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-muted text-muted-foreground")
                        )}>
                          {user.role === 'admin'
                            ? '🛡️ Super-Admin'
                            : user.role === 'associate'
                              ? '🤝 Associé / Agent'
                              : user.account_type === 'seller'
                                ? '🏬 Vendeur / Bailleur'
                                : '🛍️ Client OroMall'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      {/* Espace Associé si habilité */}
                      {(user.role === 'associate' || isAdmin()) && (
                        <Link
                          to="/associate"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-emerald-500 font-extrabold hover:bg-emerald-500/10 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" /> Espace Associé (Logements)
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-foreground font-bold hover:bg-muted transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-primary" /> Mon Profil & Fidélité
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted font-medium transition-colors"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-primary" /> Mes Commandes & Visites
                      </Link>

                      {user.account_type === 'seller' ? (
                        <Link
                          to="/seller"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted font-medium transition-colors"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5 text-primary" /> Dashboard Vendeur
                        </Link>
                      ) : (
                        <Link
                          to="/seller/onboarding"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-semibold transition-colors"
                        >
                          <Store className="w-3.5 h-3.5" /> Devenir Vendeur / Bailleur
                        </Link>
                      )}

                      {isAdmin() && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 font-bold transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5" /> Console Super-Admin
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-border/60 pt-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); logout(); navigate('/') }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-red-500 hover:bg-red-500/10 font-medium transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all shadow-sm"
                >
                  S'inscrire
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ml-1"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
            {/* Mobile Smart Search */}
            <div className="pb-1">
              <SmartSearchBar variant="compact" onSelectResult={() => setMenuOpen(false)} />
            </div>

            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                  location.pathname === l.to
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <l.icon className="w-4 h-4" />
                {l.label}
              </Link>
            ))}

            {/* Role quick links in Mobile Drawer */}
            {(user?.role === 'associate' || isAdmin()) && (
              <Link
                to="/associate"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              >
                <Users className="w-4 h-4" />
                <span>Espace Associé (Enregistrer Logements)</span>
              </Link>
            )}

            {isAdmin() && (
              <Link
                to="/admin"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-black text-primary bg-primary/10 border border-primary/20"
              >
                <Shield className="w-4 h-4" />
                <span>Console Super-Admin</span>
              </Link>
            )}

            {/* Theme & User Profile quick access in Mobile Drawer */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <button
                onClick={() => setDark(!dark)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-foreground bg-muted hover:bg-muted/80 transition-colors"
              >
                {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                <span>{dark ? 'Mode Clair ☀️' : 'Mode Sombre 🌙'}</span>
              </button>

              {user ? (
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-primary bg-primary/10"
                >
                  <User className="w-4 h-4" />
                  <span>Mon Profil ({user.name.split(' ')[0]})</span>
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-white bg-primary"
                >
                  <span>Connexion</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
