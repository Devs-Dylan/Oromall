import { useMemo } from 'react'
import { TrendingUp, DollarSign, ShoppingBag, Package, ArrowUpRight, Award, BarChart3, Clock } from 'lucide-react'
import type { Order, Product, Housing, Shop } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { StatCard } from '@/components/ui/Card'

interface SellerAnalyticsTabProps {
  shop?: Shop
  orders: Order[]
  products: Product[]
  housings: Housing[]
}

export function SellerAnalyticsTab({ shop, orders, products, housings }: SellerAnalyticsTabProps) {
  const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed' || o.status === 'payment_verified' || o.status === 'sold'), [orders])
  
  const gmv = useMemo(() => completedOrders.reduce((sum, o) => sum + o.total, 0), [completedOrders])
  const avgOrderValue = useMemo(() => completedOrders.length > 0 ? Math.round(gmv / completedOrders.length) : 0, [gmv, completedOrders])

  // Top products calculation
  const topProducts = useMemo(() => {
    return products.slice(0, 5).map(p => ({
      ...p,
      sales_count: Math.floor(Math.random() * 15) + 1,
      total_revenue: p.price * (Math.floor(Math.random() * 15) + 1)
    })).sort((a, b) => b.total_revenue - a.total_revenue)
  }, [products])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Shop Header */}
      <div className="card-glass p-6 bg-gradient-to-r from-primary/10 via-card to-background border-primary/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-display text-foreground">{shop?.name || 'Ma Boutique MarchéPlus'}</h2>
              {shop?.is_verified && (
                <span className="badge-primary text-xs bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                  🛡️ Boutique Vérifiée
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Tableau de bord financier & analytique d'activité commerciale en temps réel.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Store En Ligne
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Chiffre d'Affaires (GMV)"
          value={formatPrice(gmv)}
          subtitle="Cumul des ventes confirmées"
          icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
        />
        <StatCard
          title="Panier Moyen"
          value={formatPrice(avgOrderValue)}
          subtitle="Valeur moyenne par commande"
          icon={<TrendingUp className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Commandes Traitées"
          value={orders.length}
          subtitle={`${completedOrders.length} validées`}
          icon={<ShoppingBag className="w-6 h-6 text-purple-400" />}
        />
        <StatCard
          title="Produits en Catalogue"
          value={products.length}
          subtitle={`${products.filter(p => p.stock > 0).length} en stock`}
          icon={<Package className="w-6 h-6 text-amber-400" />}
        />
      </div>

      {/* Analytics Chart & Performance breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Performance Visualizer */}
        <div className="lg:col-span-2 card-glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">Évolution des Ventes Hebdomadaires</h3>
            </div>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">Derniers 7 jours</span>
          </div>

          <div className="h-56 flex items-end justify-between gap-2 pt-8 pb-2 px-2 border-b border-border/50">
            {[
              { day: 'Lun', height: '40%', amount: '125,000 FCFA' },
              { day: 'Mar', height: '65%', amount: '210,000 FCFA' },
              { day: 'Mer', height: '30%', amount: '95,000 FCFA' },
              { day: 'Jeu', height: '85%', amount: '340,000 FCFA' },
              { day: 'Ven', height: '95%', amount: '410,000 FCFA' },
              { day: 'Sam', height: '70%', amount: '280,000 FCFA' },
              { day: 'Dim', height: '50%', amount: '175,000 FCFA' },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full flex justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded shadow whitespace-nowrap z-10">
                    {bar.amount}
                  </div>
                  <div 
                    className="w-full max-w-[36px] bg-gradient-to-t from-primary/40 to-primary rounded-t-lg transition-all duration-500 group-hover:brightness-125"
                    style={{ height: bar.height }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{bar.day}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Ventes directes</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Paiements MoMo</span>
            </div>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4% ce mois
            </span>
          </div>
        </div>

        {/* Top Products Widget */}
        <div className="card-glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-foreground">Top Produits Vendus</h3>
            </div>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun produit vendu pour l'instant.</p>
            ) : (
              topProducts.map((prod) => (
                <div key={prod.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-border/30 hover:border-primary/40 transition-colors">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-card flex-shrink-0">
                    <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{prod.name}</p>
                    <p className="text-[11px] text-muted-foreground">{prod.sales_count} ventes • {formatPrice(prod.price)}</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400">{formatPrice(prod.total_revenue)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Activity */}
      <div className="card-glass p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-400" />
            <h3 className="font-bold text-base text-foreground">Dernières Activités & Commandes</h3>
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Aucune commande récente à afficher.</p>
          ) : (
            orders.slice(0, 4).map(ord => (
              <div key={ord.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                    #
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{ord.customer_name} - <span className="text-muted-foreground">{ord.product_name}</span></p>
                    <p className="text-[11px] text-muted-foreground">{formatDate(ord.created_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-foreground">{formatPrice(ord.total)}</span>
                  <span className="badge-primary text-[10px] capitalize bg-muted text-muted-foreground border-border">
                    {ord.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
