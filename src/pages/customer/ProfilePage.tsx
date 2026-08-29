import { useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  User, ShoppingBag, Heart, Award, ShieldCheck, Store, LogOut,
  Clock, Package, MapPin, Phone, Mail, CheckCircle, CreditCard,
  Settings, Key, AlertCircle, ChevronRight, Edit3, ArrowRight, Share2, Copy, Building2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useWishlist } from '@/hooks/useWishlist'
import { useCart } from '@/hooks/useCart'
import { OrderAPI, AvailabilityRequestAPI, UserAPI, ActivationAPI } from '@/lib/store'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { LoyaltyPointsWidget } from '@/components/customer/LoyaltyPointsWidget'

type ProfileTab = 'overview' | 'orders' | 'favorites' | 'availability' | 'loyalty' | 'settings'

export default function ProfilePage() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as ProfileTab) || 'overview'
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab)

  const { favoriteProducts, favoriteHousings, totalCount: wishCount } = useWishlist()
  const wishlistItems = useMemo(() => [
    ...favoriteProducts.map(p => ({ id: p.id, title: p.name, price: p.price, type: 'product' as const })),
    ...favoriteHousings.map(h => ({ id: h.id, title: h.title, price: h.price, type: 'housing' as const }))
  ], [favoriteProducts, favoriteHousings])
  const { count: cartCount } = useCart()

  // User Profile Form State
  const [name, setName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [mtnNumber, setMtnNumber] = useState(user?.mtn_number || '')
  const [orangeNumber, setOrangeNumber] = useState(user?.orange_number || '')

  // User Data Queries
  const orders = useMemo(() => {
    if (!user) return []
    return OrderAPI.filter(o => o.customer_email === user.email)
  }, [user])

  const availabilityRequests = useMemo(() => {
    if (!user) return []
    return AvailabilityRequestAPI.filter(r => r.customer_email === user.email)
  }, [user])

  const userActivation = useMemo(() => {
    if (!user) return null
    return ActivationAPI.filter(a => a.user_email === user.email || (a.user_id && a.user_id === user.id))[0] || null
  }, [user])

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Vous n'êtes pas connecté</h2>
        <p className="text-sm text-muted-foreground">Connectez-vous pour accéder à votre profil, vos commandes et vos points de fidélité VIP.</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/login" className="btn-primary">Connexion</Link>
          <Link to="/register" className="btn-outline">Créer un compte</Link>
        </div>
      </div>
    )
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    UserAPI.update(user.id, {
      name,
      phone,
      mtn_number: mtnNumber,
      orange_number: orangeNumber,
    })
    toastSuccess('Profil mis à jour avec succès !')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    toastSuccess('Déconnexion effectuée.')
  }

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-10 space-y-8 animate-in fade-in duration-200">
      
      {/* Profile Header Hero Box */}
      <div className="card-glass p-6 md:p-8 bg-gradient-to-r from-slate-900 via-card to-background border-primary/30 rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-tr from-primary to-amber-400 text-black font-black text-3xl flex items-center justify-center shadow-xl border-4 border-background shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-display font-extrabold text-foreground">{user.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/30">
                  {user.account_type === 'seller' ? '🏬 Vendeur / Bailleur' : '🛍️ Client Membre'}
                </span>
                {isAdmin() && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    🛡️ Admin
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Phone className="w-3.5 h-3.5" /> {user.phone || 'Aucun numéro configuré'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {user.account_type === 'seller' && (
              <Link to="/seller" className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-black font-extrabold text-xs shadow-md flex items-center gap-2">
                <Store className="w-4 h-4" /> Mon Espace Vendeur
              </Link>
            )}
            {isAdmin() && (
              <Link to="/admin" className="px-4 py-2.5 rounded-xl bg-amber-500 text-black font-extrabold text-xs shadow-md flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Console Admin
              </Link>
            )}
            <Button onClick={handleLogout} variant="outline" size="sm" className="text-red-500 border-red-500/30 hover:bg-red-500/10 text-xs font-bold">
              <LogOut className="w-3.5 h-3.5 mr-1" /> Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar (Responsive Scrollable) */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: '📊 Vue d\'Ensemble', icon: User },
          { id: 'orders', label: `🛒 Mes Commandes (${orders.length})`, icon: ShoppingBag },
          { id: 'favorites', label: `❤️ Favoris (${wishCount})`, icon: Heart },
          { id: 'availability', label: `📋 Demandes (${availabilityRequests.length})`, icon: Clock },
          { id: 'loyalty', label: '⭐ Points & Fidélité', icon: Award },
          { id: 'settings', label: '⚙️ Paramètres du Compte', icon: Settings },
        ].map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as ProfileTab)}
              className={cn(
                'px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap flex items-center gap-2 border',
                activeTab === t.id
                  ? 'bg-primary text-black border-primary shadow-md scale-105'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* TAB CONTENTS */}

      {/* 1. OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <LoyaltyPointsWidget />

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-glass p-5 border-l-4 border-l-primary space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase">Commandes Passées</span>
              <p className="text-3xl font-black text-foreground">{orders.length}</p>
              <Link to="/profile?tab=orders" onClick={() => setActiveTab('orders')} className="text-[11px] font-bold text-primary flex items-center gap-1 pt-1">
                Voir l'historique <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="card-glass p-5 border-l-4 border-l-red-500 space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase">Articles en Favoris</span>
              <p className="text-3xl font-black text-foreground">{wishCount}</p>
              <Link to="/wishlist" className="text-[11px] font-bold text-red-500 flex items-center gap-1 pt-1">
                Consulter mes favoris <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="card-glass p-5 border-l-4 border-l-amber-500 space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase">Demandes de Produits</span>
              <p className="text-3xl font-black text-foreground">{availabilityRequests.length}</p>
              <button onClick={() => setActiveTab('availability')} className="text-[11px] font-bold text-amber-500 flex items-center gap-1 pt-1">
                Voir mes demandes <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="card-glass p-5 border-l-4 border-l-emerald-500 space-y-1">
              <span className="text-xs font-bold text-muted-foreground uppercase">Paiements Mobile Money</span>
              <p className="text-sm font-bold text-emerald-400">MTN & Orange Activés ✅</p>
              <p className="text-[11px] text-muted-foreground">Transactions vérifiées par admin</p>
            </div>
          </div>

          {/* Devenir Vendeur / Bailleur Card (si pas encore vendeur) */}
          {user.account_type !== 'seller' && (
            <div className="card-glass p-6 rounded-2xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground text-base">Devenir Vendeur ou Bailleur sur OroMall</h3>
                    {userActivation?.status === 'pending' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                        Dossier en cours d'examen ⏳
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground max-w-xl">
                    {userActivation?.status === 'pending'
                      ? `Votre candidature pour "${userActivation.shop_name}" a été soumise avec succès. Nos administrateurs vérifient actuellement vos informations.`
                      : 'Ouvrez votre boutique en ligne ou publiez vos logements, studios et chambres d\'étudiants. Remplissez le formulaire de candidature officiel.'
                    }
                  </p>
                </div>
              </div>

              <Link
                to="/seller/onboarding"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow flex items-center gap-2 shrink-0 transition-all"
              >
                {userActivation?.status === 'pending' ? 'Suivre mon dossier →' : 'Remplir le formulaire d\'adhésion →'}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 2. ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" /> Historique de mes Commandes
            </h2>
            <Link to="/orders" className="text-xs font-bold text-primary hover:underline">
              Ouvrir le centre de suivi complet →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="card-glass p-8 text-center space-y-3">
              <Package className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-sm font-bold text-foreground">Vous n'avez pas encore passé de commande.</p>
              <Link to="/" className="btn-primary inline-flex text-xs">Explorer les produits</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(ord => (
                <div key={ord.id} className="card-glass p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        #{ord.id.slice(0, 8)}
                      </span>
                      <h4 className="font-bold text-foreground text-sm">{ord.product_name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">Boutique: <strong>{ord.shop_name}</strong> • Date: {formatDate(ord.created_date)}</p>
                    <p className="text-sm font-black text-emerald-400">{formatPrice(ord.total)}</p>
                  </div>
                  <Link to={`/orders?chat=${ord.id}`} className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-muted text-center">
                    Voir Suivi & Chat 💬
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. FAVORITES */}
      {activeTab === 'favorites' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" /> Mes Articles et Logements Favoris
            </h2>
            <Link to="/wishlist" className="text-xs font-bold text-primary hover:underline">
              Ouvrir la page Favoris complète →
            </Link>
          </div>

          {wishlistItems.length === 0 ? (
            <div className="card-glass p-8 text-center space-y-3">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-sm font-bold text-foreground">Aucun article enregistré en favoris.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {wishlistItems.map(item => (
                <div key={item.id} className="card-glass p-3 flex flex-col justify-between space-y-2">
                  <h4 className="font-bold text-xs text-foreground line-clamp-1">{item.title}</h4>
                  <p className="text-xs font-extrabold text-primary">{formatPrice(item.price)}</p>
                  <Link to={item.type === 'housing' ? `/housing/${item.id}` : `/product/${item.id}`} className="w-full py-1.5 rounded-lg bg-primary text-black font-bold text-xs text-center">
                    Voir la fiche
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. AVAILABILITY */}
      {activeTab === 'availability' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> Mes Demandes de Disponibilité
          </h2>

          {availabilityRequests.length === 0 ? (
            <div className="card-glass p-8 text-center space-y-3">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-sm font-bold text-foreground">Aucune demande envoyée.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availabilityRequests.map(req => (
                <div key={req.id} className="card-glass p-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{req.product_name}</h4>
                    <p className="text-xs text-muted-foreground">Boutique: {req.shop_name} • Quantité: {req.quantity}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {req.status === 'approved' ? 'Disponible ✅' : 'En attente ⏳'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. LOYALTY */}
      {activeTab === 'loyalty' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <LoyaltyPointsWidget />
        </div>
      )}

      {/* 6. SETTINGS */}
      {activeTab === 'settings' && (
        <div className="card-glass p-6 max-w-2xl space-y-6 animate-in fade-in duration-200">
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> Modifier mes Paramètres de Compte
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Input
              label="Nom Complet"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <Input
              label="Téléphone principal / WhatsApp"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Ex: 680195221"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Numéro MTN Mobile Money"
                value={mtnNumber}
                onChange={e => setMtnNumber(e.target.value)}
                placeholder="Ex: 680195221"
              />
              <Input
                label="Numéro Orange Money"
                value={orangeNumber}
                onChange={e => setOrangeNumber(e.target.value)}
                placeholder="Ex: 691576677"
              />
            </div>
            <div className="pt-2">
              <Button type="submit" className="bg-primary text-black font-extrabold text-xs">
                Enregistrer les Modifications
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}
