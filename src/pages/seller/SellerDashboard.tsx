import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, Settings, Home,
  DollarSign, Calendar, Tag, Star, MessageSquare, FileSpreadsheet, Store, CheckCircle, CreditCard
} from 'lucide-react'
import { ProductAPI, ShopAPI, OrderAPI, HousingAPI, VisitBookingAPI, PromoAPI, ReviewAPI, ChatAPI, AvailabilityRequestAPI, SubscriptionAPI, CommissionAPI } from '@/lib/store'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

// Import 10 Dedicated Seller Tabs
import { SellerAnalyticsTab } from '@/components/seller/SellerAnalyticsTab'
import { SellerProductsTab } from '@/components/seller/SellerProductsTab'
import { SellerOrdersTab } from '@/components/seller/SellerOrdersTab'
import { SellerHousingTab } from '@/components/seller/SellerHousingTab'
import { SellerVisitsTab } from '@/components/seller/SellerVisitsTab'
import { SellerPromosTab } from '@/components/seller/SellerPromosTab'
import { SellerMessagesTab } from '@/components/seller/SellerMessagesTab'
import { SellerReviewsTab } from '@/components/seller/SellerReviewsTab'
import { SellerCustomizerTab } from '@/components/seller/SellerCustomizerTab'
import { SellerExportsTab } from '@/components/seller/SellerExportsTab'
import { SellerAvailabilityTab } from '@/components/seller/SellerAvailabilityTab'
import { SellerSubscriptionTab } from '@/components/seller/SellerSubscriptionTab'

export default function SellerDashboard() {
  const { user } = useAuth()
  const [, forceUpdate] = useState(0)

  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'housing' | 'visits' | 'promos' | 'messages' | 'reviews' | 'customizer' | 'exports' | 'status' | 'availability' | 'subscription'
  >('overview')

  const refreshData = () => forceUpdate(n => n + 1)

  const allShops = useMemo(() => ShopAPI.list(), [])

  // Admin inspection mode
  const urlParams = new URLSearchParams(window.location.search)
  const inspectShopId = urlParams.get('inspect')

  // Find shop: admin inspection > seller own shop > first shop
  const shop = useMemo(() => {
    if (inspectShopId) {
      return ShopAPI.get(inspectShopId) || allShops[0]
    }
    if (user?.role === 'admin' && !inspectShopId) {
      return allShops[0]
    }
    if (!user) return undefined
    return ShopAPI.filter(s => s.owner_email === user.email || s.owner_id === user.id)[0]
  }, [user, inspectShopId, allShops])

  const isInspecting = !!inspectShopId

  const products = useMemo(() => {
    return shop ? ProductAPI.filter(p => p.shop_id === shop.id) : []
  }, [shop])

  const orders = useMemo(() => {
    return shop ? OrderAPI.filter(o => o.shop_id === shop.id) : OrderAPI.list()
  }, [shop])

  const housings = useMemo(() => HousingAPI.list(), [])
  const visitBookings = useMemo(() => VisitBookingAPI.list(), [])
  const storePromos = useMemo(() => PromoAPI.filter(p => p.owner_email === user?.email || p.code.startsWith('SHOP')), [user])
  const shopReviews = useMemo(() => shop ? ReviewAPI.filter(r => r.shop_id === shop.id) : [], [shop])
  const chatMessages = useMemo(() => ChatAPI.list(), [])
  const availabilityRequests = useMemo(() => {
    return shop ? AvailabilityRequestAPI.filter(r => r.shop_id === shop.id) : []
  }, [shop])
  const subscription = useMemo(() => {
    if (!shop) return undefined
    return SubscriptionAPI.filter(s => s.shop_id === shop.id)[0]
  }, [shop])
  const commissions = useMemo(() => {
    if (!shop) return []
    return CommissionAPI.filter(c => c.shop_id === shop.id)
  }, [shop])
  const totalCommission = useMemo(() => commissions.reduce((sum, c) => sum + c.amount, 0), [commissions])
  const paidCommission = useMemo(() => commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0), [commissions])
  const pendingCommission = useMemo(() => commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0), [commissions])

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* Top Header Card */}
      <div className="card-glass p-6 md:p-8 bg-gradient-to-r from-slate-900 via-card to-background border-primary/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Store className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-display font-extrabold text-foreground">
                {isInspecting ? 'Inspection Dashboard Vendeur' : 'Console Vendeur & Bailleur'}
              </h1>
              <span className={cn(
                'badge-primary text-xs border',
                isInspecting ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-primary/20 text-primary border-primary/30'
              )}>
                {isInspecting ? '🛡️ Mode Inspection Admin' : 'Business Pro ⚡'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isInspecting 
                ? `Inspection de la boutique "${shop?.name}" (${shop?.city}) - Vue administrateur`
                : 'Gestion centralisée de votre catalogue Shopify, transactions Mobile Money, biens immobiliers et avis clients.'
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {isInspecting && (
              <Link to="/admin" className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow flex items-center justify-center gap-1.5 whitespace-nowrap">
                ← Retour Admin
              </Link>
            )}

            {shop && !isInspecting && (
              <Link to={`/shop/${shop.id}`} className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap">
                Voir La Boutique 🛍️
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 10 Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: '📊 Analytics & KPIs', icon: LayoutDashboard },
          { id: 'products', label: `📦 Catalogue (${products.length})`, icon: Package },
          { id: 'orders', label: `🛒 Commandes & MoMo (${orders.length})`, icon: ShoppingBag },
          { id: 'status', label: '📋 Statut Commandes', icon: CheckCircle },
          { id: 'housing', label: `🏠 Immobilier (${housings.length})`, icon: Home },
          { id: 'visits', label: `📅 Visites (${visitBookings.length})`, icon: Calendar },
          { id: 'promos', label: `🎟️ Coupons (${storePromos.length})`, icon: Tag },
          { id: 'messages', label: '💬 Messagerie Client', icon: MessageSquare },
          { id: 'reviews', label: `⭐ Avis (${shopReviews.length})`, icon: Star },
          { id: 'availability', label: `📋 Disponibilités (${availabilityRequests.filter(r => r.status === 'pending').length})`, icon: Package },
          { id: 'subscription', label: `💳 Abonnement`, icon: CreditCard },
          { id: 'customizer', label: '🎨 Vitrine Theme Customizer', icon: Settings },
          { id: 'exports', label: '📊 Exports CSV', icon: FileSpreadsheet },
        ].map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5',
                activeTab === t.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <SellerAnalyticsTab shop={shop} orders={orders} products={products} housings={housings} commissions={commissions} totalCommission={totalCommission} paidCommission={paidCommission} pendingCommission={pendingCommission} />
      )}

      {activeTab === 'products' && (
        <SellerProductsTab shop={shop} products={products} onRefresh={refreshData} />
      )}

      {activeTab === 'orders' && (
        <SellerOrdersTab orders={orders} onRefresh={refreshData} />
      )}

      {activeTab === 'status' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" /> Vue d'ensemble des Commandes
          </h2>
          <p className="text-xs text-muted-foreground">Suivi rapide de toutes les commandes par statut.</p>

          {/* Status Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'En attente', count: orders.filter(o => o.status === 'new' || o.status === 'pending_payment').length, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
              { label: 'Preuve reçue', count: orders.filter(o => o.status === 'payment_uploaded').length, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
              { label: 'Payée & vérifiée', count: orders.filter(o => o.status === 'payment_verified').length, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
              { label: 'Livrée', count: orders.filter(o => o.status === 'completed' || o.status === 'sold').length, color: 'bg-primary/10 text-primary border-primary/20' },
            ].map((stat, idx) => (
              <div key={idx} className={`card-glass p-4 border ${stat.color}`}>
                <p className="text-xs text-muted-foreground font-semibold">{stat.label}</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{stat.count}</p>
              </div>
            ))}
          </div>

          {/* Orders List */}
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="card-glass p-12 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">Aucune commande enregistrée.</p>
              </div>
            ) : (
              orders.map(ord => (
                <div key={ord.id} className="card-glass p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                        #{ord.id.slice(0, 8)}
                      </span>
                      <span className="text-xs font-bold text-foreground truncate">{ord.customer_name}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Produit: <span className="text-primary font-semibold">{ord.product_name}</span></p>
                    <p className="text-xs text-muted-foreground">{formatPrice(ord.total)} • {formatDate(ord.created_date)}</p>
                  </div>
                  <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-bold inline-block border',
                    ord.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    ord.status === 'payment_verified' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    ord.status === 'payment_uploaded' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  )}>
                    {ord.status === 'payment_uploaded' ? 'Preuve reçue 📥' :
                     ord.status === 'payment_verified' ? 'Payé (Vérifié) 💳' :
                     ord.status === 'completed' ? 'Livrée & Validée ✅' : 'En attente'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'housing' && (
        <SellerHousingTab housings={housings} userEmail={user?.email} shopWhatsapp={shop?.whatsapp_number} onRefresh={refreshData} />
      )}

      {activeTab === 'visits' && (
        <SellerVisitsTab visits={visitBookings} onRefresh={refreshData} />
      )}

      {activeTab === 'promos' && (
        <SellerPromosTab promos={storePromos} userEmail={user?.email} onRefresh={refreshData} />
      )}

      {activeTab === 'messages' && (
        <SellerMessagesTab messages={chatMessages} onRefresh={refreshData} />
      )}

      {activeTab === 'reviews' && (
        <SellerReviewsTab reviews={shopReviews} onRefresh={refreshData} />
      )}

      {activeTab === 'availability' && (
        <SellerAvailabilityTab requests={availabilityRequests} onRefresh={refreshData} />
      )}

      {activeTab === 'subscription' && (
        <SellerSubscriptionTab subscription={subscription} onRefresh={refreshData} />
      )}

      {activeTab === 'customizer' && (
        <SellerCustomizerTab shop={shop} onRefresh={refreshData} />
      )}

      {activeTab === 'exports' && (
        <SellerExportsTab orders={orders} products={products} housings={housings} />
      )}
    </div>
  )
}
