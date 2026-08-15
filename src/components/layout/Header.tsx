import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Store, User, LogOut, Settings, LayoutDashboard,
  Menu, X, Bell, Moon, Sun, ShoppingCart, Heart, Users,
  Shield, BookOpen, Handshake, HelpCircle, Gift, Download, Home, Map
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { cn } from '@/lib/utils'

export default function Header() {
  const { user, logout, isAdmin } = useAuth()
  const { count } = useCart()
  const { totalCount: wishCount } = useWishlist()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [dark, setDark] = useState(() => localStorage.getItem('mp_dark') === '1')
  const [scrolled, setScrolled] = useState(false)
  const [pwaPrompt, setPwaPrompt] = useState<Event | null>(null)
  const [announcement, setAnnouncement] = useState(() => localStorage.getItem('mp_announcement') || '🔥 Offres spéciales rentrée académique : Jusqu\'à -20% sur la catégorie Électronique !')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('mp_dark', dark ? '1' : '0')
  }, [dark])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setPwaPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const navLinks = [
    { to: '/', label: 'Marketplace', icon: Store },
    { to: '/housing', label: 'Logements', icon: Home },
    { to: '/map', label: 'Carte', icon: Map },
    { to: '/p2p', label: 'P2P', icon: Handshake },
    { to: '/orders', label: 'Commandes', icon: ShoppingBag },
    { to: '/faq', label: 'Aide', icon: HelpCircle },
  ]

  return (
    <>
      {/* Global Announcement Banner */}
      {announcement && (
        <div className="bg-gradient-to-r from-amber-600 via-primary to-emerald-600 text-white px-4 py-1.5 text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-sm">
          <span>{announcement}</span>
          <button onClick={() => setAnnouncement('')} className="p-0.5 hover:opacity-80"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* PWA Banner */}
      {pwaPrompt && (
        <div className="bg-gradient-to-r from-primary to-accent text-white px-4 py-2 text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Installez MarchéPlus sur votre téléphone pour un accès rapide !
          </span>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const e = pwaPrompt as BeforeInstallPromptEvent
                e.prompt?.()
                setPwaPrompt(null)
              }}
              className="px-3 py-1 bg-white text-primary rounded-lg font-semibold text-xs hover:bg-white/90"
            >Installer</button>
            <button onClick={() => setPwaPrompt(null)} className="p-1"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <header className={cn(
        'sticky top-0 z-40 border-b transition-all duration-300',
        scrolled
          ? 'bg-card/95 backdrop-blur-md shadow-sm border-border'
          : 'bg-card border-transparent'
      )}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-sm font-black">M+</div>
            <span className="gradient-text hidden sm:block">MarchéPlus</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                location.pathname === l.to
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}>
                <l.icon className="w-4 h-4" />{l.label}
              </Link>
            ))}
{user?.account_type === 'seller' ? (
            <Link to="/seller" className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              location.pathname.startsWith('/seller')
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}>
              <LayoutDashboard className="w-4 h-4" />Dashboard
            </Link>
          ) : null}
            {isAdmin() && (
              <Link to="/admin" className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                location.pathname.startsWith('/admin')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}>
                <Shield className="w-4 h-4" />Admin
              </Link>
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => setDark(d => !d)} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link to="/wishlist" className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Mes Favoris">
              <Heart className="w-5 h-5" />
              {wishCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {wishCount > 9 ? '9+' : wishCount}
                </span>
              )}
            </Link>

            <Link to="/cart" className="relative p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground" title="Mon Panier">
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-foreground max-w-[100px] truncate">{user.name}</span>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-40 animate-scale-in overflow-hidden">
                      <div className="p-3 border-b border-border">
                        <p className="font-semibold text-foreground text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="p-1">
                        {(user.account_type === 'seller') && (
                          <button onClick={() => { navigate('/seller'); setUserMenuOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
                            <LayoutDashboard className="w-4 h-4" />Mon dashboard
                          </button>
                        )}
                        {isAdmin() && (
                          <>
                            <button onClick={() => { navigate('/admin'); setUserMenuOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
                              <Shield className="w-4 h-4" />Administration
                            </button>
                            <button onClick={() => { navigate('/project'); setUserMenuOpen(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors">
                              <BookOpen className="w-4 h-4" />Explorateur projet
                            </button>
                          </>
                        )}
                        <button onClick={() => { logout(); setUserMenuOpen(false); navigate('/login') }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                          <LogOut className="w-4 h-4" />Se déconnecter
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm py-2 px-4">
                <User className="w-4 h-4" />Connexion
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button onClick={() => setMenuOpen(o => !o)} className="lg:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground">
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-1">
            {navLinks.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors',
                location.pathname === l.to ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
              )}>
                <l.icon className="w-4 h-4" />{l.label}
              </Link>
            ))}
            {(user?.account_type === 'seller') && (
              <Link to="/seller" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted">
                <LayoutDashboard className="w-4 h-4" />Dashboard vendeur
              </Link>
            )}
            {isAdmin() && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted">
                <Shield className="w-4 h-4" />Administration
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  )
}

// Type declaration for PWA
declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt?: () => Promise<void>
  }
}
