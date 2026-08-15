import { useState, useMemo } from 'react'
import { ShoppingBag, CheckCircle, ShieldCheck, Clock, AlertCircle, Phone, Mail, FileText, Key, Eye } from 'lucide-react'
import type { Order } from '@/types'
import { OrderAPI } from '@/lib/store'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface SellerOrdersTabProps {
  orders: Order[]
  onRefresh: () => void
}

export function SellerOrdersTab({ orders, onRefresh }: SellerOrdersTabProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'completed'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [pinInput, setPinInput] = useState('')

  // Validation Preuve MoMo
  const handleVerifyPayment = (orderId: string) => {
    OrderAPI.update(orderId, {
      status: 'payment_verified',
      payment_verified: true
    })
    toastSuccess('Preuve de paiement Mobile Money vérifiée avec succès !')
    onRefresh()
  }

  // Marquer comme livrée avec validation du Code PIN
  const handleCompleteOrderWithPin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrder) return

    const expectedPin = selectedOrder.pin_code || '1234'
    if (pinInput.trim() !== expectedPin) {
      toastError(`Code PIN incorrect. (Code PIN de test requis : ${expectedPin})`)
      return
    }

    OrderAPI.update(selectedOrder.id, {
      status: 'completed'
    })

    toastSuccess('Code PIN validé ! La commande est marquée comme Livrée & Complétée.')
    setSelectedOrder(null)
    setPinInput('')
    onRefresh()
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter === 'pending') return o.status === 'new' || o.status === 'payment_uploaded' || o.status === 'pending_payment'
      if (statusFilter === 'verified') return o.status === 'payment_verified'
      if (statusFilter === 'completed') return o.status === 'completed' || o.status === 'sold'
      return true
    })
  }, [orders, statusFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" /> Commandes & Hub Mobile Money ({orders.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Validez les preuves de transfert MTN / Orange Money et confirmez les livraisons via code PIN sécurisé.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card-glass p-3 flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'all', label: `Toutes (${orders.length})` },
          { id: 'pending', label: `En Attente MoMo (${orders.filter(o => o.status === 'payment_uploaded' || o.status === 'new').length})` },
          { id: 'verified', label: `Paiement Vérifié (${orders.filter(o => o.status === 'payment_verified').length})` },
          { id: 'completed', label: `Livrées (${orders.filter(o => o.status === 'completed' || o.status === 'sold').length})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id as any)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
              statusFilter === f.id ? 'bg-primary text-white shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="card-glass p-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucune commande enregistrée pour ce filtre.</p>
          </div>
        ) : (
          filteredOrders.map(ord => (
            <div key={ord.id} className="card-glass p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/30 transition-all">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                    ID #{ord.id.slice(0, 8)}
                  </span>
                  <span className="text-xs font-bold text-foreground truncate">{ord.customer_name}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {ord.customer_phone || 'Non renseigné'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(ord.created_date)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-foreground">
                    Produit: <span className="text-primary">{ord.product_name}</span>
                  </div>
                  <div className="text-sm font-extrabold text-emerald-400">
                    {formatPrice(ord.total)}
                  </div>
                </div>

                {ord.payment_proof_url && (
                  <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 w-fit">
                    <FileText className="w-4 h-4" />
                    <span>Preuve MoMo reçue (MTN/Orange) : </span>
                    <a href={ord.payment_proof_url} target="_blank" rel="noreferrer" className="underline font-bold text-white hover:text-amber-300">Voir le reçu</a>
                  </div>
                )}
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                <div className="text-center sm:text-right">
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

                <div className="flex items-center gap-2">
                  {/* Action WhatsApp Notification to Seller */}
                  <a
                    href={buildWhatsAppUrl(
                      '237680195221',
                      `Bonjour, nouvelle commande #${ord.id.slice(0, 8)} reçue sur MarchéPlus !\nProduit: ${ord.product_name}\nClient: ${ord.customer_name} (${ord.customer_phone || 'N/A'})\nMontant: ${formatPrice(ord.total)}\nStatut: ${ord.status}`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Phone className="w-3.5 h-3.5" /> Alerte WhatsApp 💬
                  </a>

                  {/* Action 1: Validate MoMo proof */}
                  {ord.status === 'payment_uploaded' && (
                    <Button onClick={() => handleVerifyPayment(ord.id)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Valider Preuve MoMo 1-Clic
                    </Button>
                  )}

                  {/* Action 2: Enter Delivery PIN */}
                  {(ord.status === 'payment_verified' || ord.status === 'new') && (
                    <Button onClick={() => { setSelectedOrder(ord); setPinInput('') }} variant="outline" size="sm" className="text-xs gap-1 border-primary/40 text-primary">
                      <Key className="w-3.5 h-3.5" /> Valider PIN Livraison
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* PIN Validation Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title="Validation par Code PIN de Livraison"
      >
        {selectedOrder && (
          <form onSubmit={handleCompleteOrderWithPin} className="space-y-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1 text-xs text-foreground">
              <p><strong>Acheteur :</strong> {selectedOrder.customer_name}</p>
              <p><strong>Article :</strong> {selectedOrder.product_name}</p>
              <p><strong>Montant Total :</strong> {formatPrice(selectedOrder.total)}</p>
              <p className="text-muted-foreground pt-1">
                Entrez le code PIN remis par le client au livreur lors de la remise du colis.
              </p>
            </div>

            <Input
              label="Code PIN Client à 4 chiffres"
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Entrez le code PIN..."
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedOrder(null)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Valider la livraison
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
