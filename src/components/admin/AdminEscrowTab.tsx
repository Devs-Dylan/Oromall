import { useMemo } from 'react'
import { DollarSign, Layers, ShieldCheck, ArrowDownRight, CheckCircle, Clock, Smartphone } from 'lucide-react'
import type { Order } from '@/types'
import { OrderAPI, AuditLogAPI } from '@/lib/store'
import { formatPrice, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { toastSuccess } from '@/components/ui/Toast'

interface AdminEscrowTabProps {
  orders: Order[]
  commissionRate: number
  adminName?: string
  onRefresh: () => void
}

export function AdminEscrowTab({ orders, commissionRate, adminName = 'SuperAdmin', onRefresh }: AdminEscrowTabProps) {
  const verifiedOrders = useMemo(() => orders.filter(o => o.status === 'payment_verified'), [orders])
  const escrowTotal = useMemo(() => verifiedOrders.reduce((sum, o) => sum + o.total, 0), [verifiedOrders])
  const totalGMV = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders])
  const totalCommissionRevenue = useMemo(() => Math.round(totalGMV * (commissionRate / 100)), [totalGMV, commissionRate])

  const handleReleaseFunds = (orderId: string, shopName: string, amount: number) => {
    OrderAPI.update(orderId, { status: 'completed' })

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Déblocage des fonds Escrow MoMo',
      details: `Virement vers la boutique ${shopName} - Montant: ${amount} FCFA`,
      severity: 'info'
    })

    toastSuccess(`Fonds débloqués pour la boutique "${shopName}" ! (${formatPrice(amount)})`)
    onRefresh()
  }

  const handleWithdrawCommissions = () => {
    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Retrait du Solde des Commissions Plateforme',
      details: `Montant transféré vers la trésorerie: ${totalCommissionRevenue} FCFA`,
      severity: 'warning'
    })

    toastSuccess(`Ordre de virement des commissions (${formatPrice(totalCommissionRevenue)}) exécuté vers le compte d'entreprise !`)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="card-glass p-6 bg-gradient-to-r from-emerald-500/10 via-card to-background border-emerald-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" /> Mobile Money Escrow & Commissions {commissionRate}%
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Supervision des comptes séquestres MTN / Orange Money et libération manuelle des paiements vendeurs.
            </p>
          </div>

          <Button onClick={handleWithdrawCommissions} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 shadow-lg shadow-emerald-600/20">
            <ArrowDownRight className="w-4 h-4" /> Virer les Commissions Plateforme
          </Button>
        </div>
      </div>

      {/* Escrow & Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-glass p-5 space-y-2 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <Layers className="w-4 h-4 text-emerald-400" /> Fonds sous Séquestre Escrow
            </span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              {verifiedOrders.length} transactions en attente de libération
            </span>
          </div>
          <p className="text-3xl font-extrabold font-display text-foreground">{formatPrice(escrowTotal)}</p>
          <p className="text-[11px] text-muted-foreground">Fonds garantis par MTN Money & Orange Money Cameroun.</p>
        </div>

        <div className="card-glass p-5 space-y-2 border-primary/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-primary" /> Commissions Cumulées Plateforme ({commissionRate}%)
            </span>
            <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full border border-primary/20">
              Disponibles pour retrait
            </span>
          </div>
          <p className="text-3xl font-extrabold font-display text-primary">{formatPrice(totalCommissionRevenue)}</p>
          <p className="text-[11px] text-muted-foreground">Prélèvement automatique de 5% sur l'ensemble des ventes.</p>
        </div>
      </div>

      {/* Escrow Orders Queue */}
      <div className="card-glass p-6 space-y-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" /> Files des Paiements MoMo à Libérer ({verifiedOrders.length})
        </h3>

        <div className="divide-y divide-border/40">
          {verifiedOrders.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">Aucun solde sous séquestre en attente de déblocage.</p>
          ) : (
            verifiedOrders.map(ord => (
              <div key={ord.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">Client: {ord.customer_name}</span>
                    <span className="text-xs text-muted-foreground">&rarr; Boutique: <strong className="text-primary">{ord.shop_name}</strong></span>
                  </div>
                  <p className="text-xs text-muted-foreground">Article: {ord.product_name} • Montant Total: <strong className="text-emerald-400">{formatPrice(ord.total)}</strong></p>
                </div>

                <Button
                  onClick={() => handleReleaseFunds(ord.id, ord.shop_name, ord.total)}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Débloquer Virement Vendeur
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
