import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, XCircle, Clock, Phone, MessageSquare, ShoppingBag, Package } from 'lucide-react'
import type { AvailabilityRequest } from '@/types'
import { AvailabilityRequestAPI, OrderAPI, NotificationAPI, ChatAPI, CommissionAPI } from '@/lib/store'
import { formatPrice, formatDate, cn, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { toastSuccess } from '@/components/ui/Toast'

interface SellerAvailabilityTabProps {
  requests: AvailabilityRequest[]
  onRefresh: () => void
}

export function SellerAvailabilityTab({ requests, onRefresh }: SellerAvailabilityTabProps) {
  const { user } = useAuth()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const pending = useMemo(() => requests.filter(r => r.status === 'pending'), [requests])
  const approved = useMemo(() => requests.filter(r => r.status === 'approved'), [requests])
  const rejected = useMemo(() => requests.filter(r => r.status === 'rejected'), [requests])

  const handleApprove = async (req: AvailabilityRequest) => {
    setProcessingId(req.id)
    await new Promise(r => setTimeout(r, 600))

    AvailabilityRequestAPI.update(req.id, { status: 'approved', updated_date: new Date().toISOString() })

    const order = OrderAPI.create({
      shop_id: req.shop_id,
      shop_name: req.shop_name,
      product_id: req.product_id,
      product_name: req.product_name,
      product_price: 0,
      total: 0,
      customer_name: req.customer_name,
      customer_email: req.customer_email,
      customer_phone: req.customer_phone,
      status: 'new',
      message: `Commande suite à demande de disponibilité #${req.id.slice(0, 8)}. Qté: ${req.quantity}, Date limite: ${req.deadline_date}`,
    })

    const commissionAmount = Math.round(order.total * 0.02)
    if (commissionAmount > 0) {
      CommissionAPI.create({
        order_id: order.id,
        shop_id: req.shop_id,
        shop_name: req.shop_name,
        vendor_name: user?.name || 'Vendeur',
        vendor_email: user?.email || '',
        order_total: order.total,
        rate: 2,
        amount: commissionAmount,
        status: 'pending',
      })
    }

    NotificationAPI.create({
      shop_id: req.shop_id,
      title: `Disponibilité confirmée - ${req.product_name}`,
      message: `Vous avez confirmé la disponibilité pour ${req.customer_name}. Commande #${order.id.slice(0, 8)} créée.`,
      type: 'order',
      read: false,
    })

    NotificationAPI.create({
      user_email: req.customer_email,
      title: `Produit disponible ! - ${req.product_name}`,
      message: `Bonne nouvelle ! Le vendeur a confirmé la disponibilité de ${req.quantity}x "${req.product_name}". Vous pouvez maintenant commander.`,
      type: 'system',
      read: false,
    })

    ChatAPI.create({
      order_id: order.id,
      sender_role: 'vendor',
      sender_name: user?.name || 'Vendeur',
      message: `Bonjour ${req.customer_name}, nous confirmons la disponibilité de ${req.quantity}x "${req.product_name}" pour le ${req.deadline_date}. Vous pouvez passer commande.`,
    })

    setProcessingId(null)
    toastSuccess('Disponibilité confirmée !', 'Le client a été notifié.')
    onRefresh()
  }

  const handleReject = async (req: AvailabilityRequest) => {
    setProcessingId(req.id)
    await new Promise(r => setTimeout(r, 600))

    AvailabilityRequestAPI.update(req.id, { status: 'rejected', updated_date: new Date().toISOString() })

    NotificationAPI.create({
      user_email: req.customer_email,
      title: `Demande non disponible - ${req.product_name}`,
      message: `Désolé, nous ne pouvons pas honorer votre demande de ${req.quantity}x "${req.product_name}" pour le ${req.deadline_date}.`,
      type: 'system',
      read: false,
    })

    setProcessingId(null)
    toastSuccess('Demande refusée', 'Le client a été notifié.')
    onRefresh()
  }

  const handleWhatsAppAlert = (req: AvailabilityRequest) => {
    const message = `Bonjour ${req.customer_name}, votre demande de disponibilité pour ${req.quantity}x "${req.product_name}" (date limite: ${req.deadline_date}) a été reçue. Nous vous confirmons la disponibilité.`
    window.open(buildWhatsAppUrl(req.customer_phone, message), '_blank')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Demandes de Disponibilité
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gérez les demandes clients et validez les disponibilités.</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="card-glass p-12 text-center space-y-3">
          <Package className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-sm font-semibold text-foreground">Aucune demande de disponibilité.</p>
          <p className="text-xs text-muted-foreground">Les demandes apparaîtront ici quand un client cliquera sur "Disponible ?" sur vos produits.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2">
                <Clock className="w-4 h-4" /> En attente ({pending.length})
              </h3>
              {pending.map(req => (
                <div key={req.id} className="card-glass p-5 border border-amber-500/30 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">#{req.id.slice(0, 8)}</span>
                        <span className="badge-warning">En attente</span>
                      </div>
                      <p className="font-semibold text-foreground text-sm">{req.product_name}</p>
                      <p className="text-xs text-muted-foreground">Boutique: {req.shop_name}</p>
                      <p className="text-xs text-muted-foreground">Client: <strong className="text-foreground">{req.customer_name}</strong> ({req.customer_phone})</p>
                      <p className="text-xs text-muted-foreground">Quantité: <strong className="text-foreground">{req.quantity}</strong> • Date limite: <strong className="text-foreground">{req.deadline_date}</strong></p>
                      <p className="text-[10px] text-muted-foreground mt-1">Demande du {formatDate(req.created_date)}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(req)}
                        disabled={processingId === req.id}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        <CheckCircle className="w-4 h-4" /> Confirmer dispo
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(req)}
                        disabled={processingId === req.id}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="w-4 h-4" /> Refuser
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWhatsAppAlert(req)}
                        className="text-emerald-600 hover:bg-emerald-500/10"
                      >
                        <Phone className="w-4 h-4" /> Alerter WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {approved.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Confirmées ({approved.length})
              </h3>
              {approved.map(req => (
                <div key={req.id} className="card-glass p-4 border border-emerald-500/20 opacity-75">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{req.product_name} x{req.quantity}</p>
                      <p className="text-xs text-muted-foreground">Client: {req.customer_name} • Date limite: {req.deadline_date}</p>
                    </div>
                    <span className="badge-success">Disponible</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rejected.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-destructive flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Refusées ({rejected.length})
              </h3>
              {rejected.map(req => (
                <div key={req.id} className="card-glass p-4 border border-destructive/20 opacity-60">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{req.product_name} x{req.quantity}</p>
                      <p className="text-xs text-muted-foreground">Client: {req.customer_name} • Date limite: {req.deadline_date}</p>
                    </div>
                    <span className="badge-destructive">Refusée</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
