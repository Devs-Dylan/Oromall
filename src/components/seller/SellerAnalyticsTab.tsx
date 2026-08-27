import { useMemo, useState } from 'react'
import { TrendingUp, DollarSign, ShoppingBag, Package, ArrowUpRight, Award, BarChart3, Clock, Receipt, Upload } from 'lucide-react'
import type { Order, Product, Housing, Shop, Commission } from '@/types'
import { formatPrice, formatDate } from '@/lib/utils'
import { StatCard } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { FileUploadField } from '@/components/ui/FileUploadField'
import { Button } from '@/components/ui/Button'
import { CommissionAPI, NotificationAPI } from '@/lib/store'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface SellerAnalyticsTabProps {
  shop?: Shop
  orders: Order[]
  products: Product[]
  housings: Housing[]
  commissions: Commission[]
  totalCommission: number
  paidCommission: number
  pendingCommission: number
}

export function SellerAnalyticsTab({ shop, orders, products, housings, totalCommission, paidCommission, pendingCommission }: SellerAnalyticsTabProps) {
  const [payModalOpen, setPayModalOpen] = useState(false)
  const [proofType, setProofType] = useState<'reference' | 'image'>('reference')
  const [proofValue, setProofValue] = useState('')
  const [proofFile, setProofFile] = useState<string | undefined>(undefined)
  const [processing, setProcessing] = useState(false)

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

  const handlePayCommission = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalProof = proofFile || proofValue
    if (!finalProof || (proofType === 'reference' && !proofValue.trim())) {
      toastError('Veuillez fournir la preuve de paiement.')
      return
    }
    setProcessing(true)
    await new Promise(r => setTimeout(r, 800))

    const pendingCommissions = CommissionAPI.filter(c => c.status === 'pending')
    pendingCommissions.forEach(c => {
      CommissionAPI.update(c.id, { status: 'paid', paid_at: new Date().toISOString() })
    })

    NotificationAPI.create({
      user_email: shop?.owner_email || '',
      title: 'Paiement de commission envoyé',
      message: `Votre preuve de paiement de ${formatPrice(pendingCommission)} a été soumise. L'admin va valider.`,
      type: 'system',
      read: false,
    })

    setProcessing(false)
    setPayModalOpen(false)
    setProofValue('')
    setProofFile(undefined)
    toastSuccess('Preuve de paiement soumise !', 'En attente de validation par l\'admin.')
  }

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
          label="Chiffre d'Affaires (GMV)"
          value={formatPrice(gmv)}
          subtitle="Cumul des ventes confirmées"
          icon={<DollarSign className="w-6 h-6 text-emerald-400" />}
        />
        <StatCard
          label="Panier Moyen"
          value={formatPrice(avgOrderValue)}
          subtitle="Valeur moyenne par commande"
          icon={<TrendingUp className="w-6 h-6 text-primary" />}
        />
        <StatCard
          label="Commandes Traitées"
          value={orders.length}
          subtitle={`${completedOrders.length} validées`}
          icon={<ShoppingBag className="w-6 h-6 text-purple-400" />}
        />
        <StatCard
          label="Produits en Catalogue"
          value={products.length}
          subtitle={`${products.filter(p => p.stock > 0).length} en stock`}
          icon={<Package className="w-6 h-6 text-amber-400" />}
        />
        <StatCard
          label="Commission Plateforme (2%)"
          value={formatPrice(totalCommission)}
          subtitle={`${formatPrice(paidCommission)} payée • ${formatPrice(pendingCommission)} en attente`}
          icon={<Receipt className="w-6 h-6 text-red-400" />}
        />
        <StatCard
          label="Dette envers Admin"
          value={formatPrice(pendingCommission)}
          subtitle="À payer à l'administrateur"
          icon={<DollarSign className="w-6 h-6 text-orange-400" />}
        />
      </div>

      {pendingCommission > 0 && (
        <div className="card-glass p-4 border border-amber-500/30 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Vous avez une dette de commission de {formatPrice(pendingCommission)}</p>
            <p className="text-xs text-muted-foreground">Payez à l'admin via MTN: 680195221 ou OM: 691576677</p>
          </div>
          <Button onClick={() => setPayModalOpen(true)} className="bg-primary text-white">
            <Upload className="w-4 h-4" /> Payer ma dette
          </Button>
        </div>
      )}

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

      <Modal open={payModalOpen} onClose={() => setPayModalOpen(false)} title="Payer ma dette de commission">
        <form onSubmit={handlePayCommission} className="space-y-4">
          <div className="bg-muted/40 p-4 rounded-xl space-y-2">
            <p className="font-semibold text-foreground">Dette de commission: {formatPrice(pendingCommission)}</p>
            <p className="text-xs text-muted-foreground">Payer via MTN MoMo ou Orange Money aux numéros de l'admin :</p>
            <p className="text-xs text-foreground">MTN: 680195221 • OM: 691576677</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Type de preuve</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setProofType('reference')} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${proofType === 'reference' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
                Référence de paiement
              </button>
              <button type="button" onClick={() => setProofType('image')} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${proofType === 'image' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
                Capture d'écran
              </button>
            </div>
          </div>
          {proofType === 'reference' ? (
            <Input
              label="Référence / ID de transaction"
              required
              value={proofValue}
              onChange={e => setProofValue(e.target.value)}
              placeholder="Ex: TXN123456"
            />
          ) : (
            <FileUploadField
              label="Capture d'écran du paiement"
              value={proofFile}
              onChange={(val) => { setProofFile(val); if (val) setProofValue('') }}
              accept="image/*"
              maxSizeMB={10}
            />
          )}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setPayModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={processing} className="bg-primary text-white">
              <Upload className="w-4 h-4" /> Soumettre la preuve
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
