import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, Settings, Home,
  DollarSign, Calendar, Tag, Star, MessageSquare, FileSpreadsheet, Store
} from 'lucide-react'
import { ProductAPI, ShopAPI, OrderAPI, HousingAPI, VisitBookingAPI, PromoAPI, ReviewAPI, ChatAPI } from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'
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

export default function SellerDashboard() {
  const { user } = useAuth()
  const [, forceUpdate] = useState(0)

  // 10 Tabs State
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'housing' | 'visits' | 'promos' | 'messages' | 'reviews' | 'customizer' | 'exports'
  >('overview')

  const refreshData = () => forceUpdate(n => n + 1)

  const allShops = useMemo(() => ShopAPI.list(), [])
  const [adminSelectedShopId, setAdminSelectedShopId] = useState<string>('')

  // Find seller shop
  const shop = useMemo(() => {
    if (user?.role === 'admin' && adminSelectedShopId) {
      return ShopAPI.get(adminSelectedShopId) || allShops[0]
    }
    if (!user) return undefined
    return ShopAPI.filter(s => s.owner_email === user.email || s.owner_id === user.id)[0] || allShops[0]
  }, [user, adminSelectedShopId, allShops])

  const products = useMemo(() => {
    return shop ? ProductAPI.filter(p => p.shop_id === shop.id) : ProductAPI.list()
  }, [shop])

  const orders = useMemo(() => {
    return shop ? OrderAPI.filter(o => o.shop_id === shop.id) : OrderAPI.list()
  }, [shop])

  const housings = useMemo(() => HousingAPI.list(), [])
  const visitBookings = useMemo(() => VisitBookingAPI.list(), [])
  const storePromos = useMemo(() => PromoAPI.filter(p => p.owner_email === user?.email || p.code.startsWith('SHOP')), [user])
  const shopReviews = useMemo(() => shop ? ReviewAPI.filter(r => r.shop_id === shop.id) : [], [shop])
  const chatMessages = useMemo(() => ChatAPI.list(), [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Header Card */}
      <div className="card-glass p-6 md:p-8 bg-gradient-to-r from-slate-900 via-card to-background border-primary/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Store className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-display font-extrabold text-foreground">Console Vendeur & Bailleur</h1>
              <span className="badge-primary bg-primary/20 text-primary border border-primary/30">Business Pro ⚡</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Gestion centralisée de votre catalogue Shopify, transactions Mobile Money, biens immobiliers et avis clients.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {user?.role === 'admin' && (
              <div className="px-3 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 whitespace-nowrap">
                  🛡️ Switcher Boutique Admin :
                </span>
                <select
                  value={shop?.id || ''}
                  onChange={(e) => setAdminSelectedShopId(e.target.value)}
                  className="bg-card text-foreground text-xs font-bold px-2.5 py-1 rounded-xl border border-border focus:ring-amber-500"
                >
                  {allShops.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {shop && (
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
          { id: 'housing', label: `🏠 Immobilier (${housings.length})`, icon: Home },
          { id: 'visits', label: `📅 Visites (${visitBookings.length})`, icon: Calendar },
          { id: 'promos', label: `🎟️ Coupons (${storePromos.length})`, icon: Tag },
          { id: 'messages', label: '💬 Messagerie Client', icon: MessageSquare },
          { id: 'reviews', label: `⭐ Avis (${shopReviews.length})`, icon: Star },
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
        <SellerAnalyticsTab shop={shop} orders={orders} products={products} housings={housings} />
      )}

      {activeTab === 'products' && (
        <SellerProductsTab shop={shop} products={products} onRefresh={refreshData} />
      )}

      {activeTab === 'orders' && (
        <SellerOrdersTab orders={orders} onRefresh={refreshData} />
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

      {activeTab === 'customizer' && (
        <SellerCustomizerTab shop={shop} onRefresh={refreshData} />
      )}

      {activeTab === 'exports' && (
        <SellerExportsTab orders={orders} products={products} housings={housings} />
      )}
    </div>
  )
}
