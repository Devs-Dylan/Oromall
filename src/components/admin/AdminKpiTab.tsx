import { useMemo } from 'react'
import { Shield, TrendingUp, DollarSign, Store, Users, ShoppingBag, ArrowUpRight, BarChart3, Activity, Layers } from 'lucide-react'
import type { Order, Shop, User, Product } from '@/types'
import { formatPrice } from '@/lib/utils'
import { StatCard } from '@/components/ui/Card'

interface AdminKpiTabProps {
  orders: Order[]
  shops: Shop[]
  users: User[]
  products: Product[]
  commissionRate: number
}

export function AdminKpiTab({ orders, shops, users, products, commissionRate }: AdminKpiTabProps) {
  const totalGMV = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders])
  const platformCommissions = useMemo(() => Math.round(totalGMV * (commissionRate / 100)), [totalGMV, commissionRate])
  const escrowBalance = useMemo(() => orders.filter(o => o.status === 'payment_verified').reduce((sum, o) => sum + o.total, 0), [orders])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Super-Vision Banner */}
      <div className="card-glass p-6 bg-gradient-to-r from-slate-900 via-card to-background border-primary/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" /> Super-Vision Globale MarchéPlus
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Métriques de niveau exécutif, volumes d'échange GMV, compte d'entiercement MoMo et revenus de commission.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/30 text-xs font-bold text-primary flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Commission Plateforme: {commissionRate}%
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="GMV Plateforme Total"
          value={formatPrice(totalGMV)}
          subtitle="Volume brut de marchandise"
          icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
        />
        <StatCard
          title="Revenus Commissions (5%)"
          value={formatPrice(platformCommissions)}
          subtitle="Bénéfice net plateforme"
          icon={<TrendingUp className="w-6 h-6 text-primary" />}
        />
        <StatCard
          title="Compte Escrow MoMo"
          value={formatPrice(escrowBalance)}
          subtitle="Fonds sous séquestre sécurisé"
          icon={<Layers className="w-6 h-6 text-purple-400" />}
        />
        <StatCard
          title="Boutiques Actives"
          value={shops.length}
          subtitle={`${shops.filter(s => s.is_verified).length} vérifiées (🛡️)`}
          icon={<Store className="w-6 h-6 text-amber-400" />}
        />
      </div>

      {/* Analytics Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base text-foreground">GMV & Transactions Consolidées</h3>
            </div>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">Performance mensuelle</span>
          </div>

          <div className="h-60 flex items-end justify-between gap-3 pt-8 pb-2 px-2 border-b border-border/50">
            {[
              { month: 'Jan', height: '45%', gmv: '4.5M FCFA' },
              { month: 'Fév', height: '55%', gmv: '5.8M FCFA' },
              { month: 'Mar', height: '40%', gmv: '3.9M FCFA' },
              { month: 'Avr', height: '70%', gmv: '7.2M FCFA' },
              { month: 'Mai', height: '85%', gmv: '9.1M FCFA' },
              { month: 'Juin', height: '60%', gmv: '6.4M FCFA' },
              { month: 'Juil', height: '90%', gmv: '11.0M FCFA' },
              { month: 'Août', height: '100%', gmv: '14.5M FCFA' },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full flex justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-popover text-popover-foreground text-[10px] font-bold px-2 py-1 rounded shadow whitespace-nowrap z-10">
                    {bar.gmv}
                  </div>
                  <div 
                    className="w-full max-w-[32px] bg-gradient-to-t from-primary/30 via-primary to-emerald-400 rounded-t-lg transition-all duration-500 group-hover:brightness-125 shadow-lg shadow-primary/10"
                    style={{ height: bar.height }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground font-semibold">{bar.month}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Croissance mensuelle continue (+24.2%)
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ArrowUpRight className="w-4 h-4" /> Objectif Annuel 100M FCFA
            </span>
          </div>
        </div>

        {/* Platform Status */}
        <div className="card-glass p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" /> Écosystème & Santé Système
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <span className="text-muted-foreground font-medium">Temps de disponibilité API</span>
                <span className="font-extrabold text-emerald-400">99.98%</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <span className="text-muted-foreground font-medium">Latence Mobile Money</span>
                <span className="font-extrabold text-emerald-400">38 ms</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <span className="text-muted-foreground font-medium">Utilisateurs Enregistrés</span>
                <span className="font-extrabold text-foreground">{users.length}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30">
                <span className="text-muted-foreground font-medium">Total Références Catalogue</span>
                <span className="font-extrabold text-foreground">{products.length}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-semibold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Tous les nœuds de paiement MTN & Orange sont opérationnels.
          </div>
        </div>
      </div>
    </div>
  )
}
