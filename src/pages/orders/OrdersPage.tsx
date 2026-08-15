import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ShoppingBag, CheckCircle, Clock, Upload, Key,
  MessageSquare, Store, AlertCircle, FileText, Printer, ShieldCheck, Send, Sparkles, Phone
} from 'lucide-react'
import { OrderAPI, ChatAPI, NotificationAPI } from '@/lib/store'
import { ORDER_STATUS_LABELS, type Order } from '@/types'
import { formatPrice, formatDate, getStatusColor, cn, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { toastSuccess } from '@/components/ui/Toast'

export default function OrdersPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [, forceUpdate] = useState(0)

  const orders = user ? OrderAPI.filter(o => o.customer_email === user.email) : OrderAPI.list()

  // Modal states
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [proofModalOpen, setProofModalOpen] = useState(false)
  const [proofUrl, setProofUrl] = useState('')

  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')

  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)

  // Auto-open Chat Modal if ?chat=ORDER_ID is present in URL
  useEffect(() => {
    const chatOrderId = searchParams.get('chat')
    if (chatOrderId) {
      const targetOrder = OrderAPI.get(chatOrderId) || orders.find(o => o.id === chatOrderId)
      if (targetOrder) {
        setActiveOrder(targetOrder)
        setChatModalOpen(true)
      }
    }
  }, [searchParams, orders])

  const handleUploadProof = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOrder || !proofUrl.trim()) return
    OrderAPI.update(activeOrder.id, {
      payment_proof_url: proofUrl,
      status: 'payment_uploaded',
    })

    // Notify Vendor in-app
    NotificationAPI.create({
      shop_id: activeOrder.shop_id,
      title: `Preuve MoMo Reçue - Commande #${activeOrder.id.slice(0, 8)}`,
      message: `Le client ${activeOrder.customer_name} a envoyé un reçu de paiement.`,
      type: 'payment',
      read: false,
      created_date: new Date().toISOString(),
    })

    setProofModalOpen(false)
    setProofUrl('')
    toastSuccess('Preuve transmise !', 'Le vendeur a été notifié sur la plateforme.')
    forceUpdate(n => n + 1)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOrder || !chatMessage.trim()) return
    ChatAPI.create({
      order_id: activeOrder.id,
      sender_role: 'customer',
      sender_name: user?.name || activeOrder.customer_name || 'Client',
      message: chatMessage,
    })

    // Notify Vendor in-app
    NotificationAPI.create({
      shop_id: activeOrder.shop_id,
      title: `Nouveau Message Client - Commande #${activeOrder.id.slice(0, 8)}`,
      message: `${user?.name || activeOrder.customer_name}: "${chatMessage.slice(0, 50)}..."`,
      type: 'chat',
      read: false,
      created_date: new Date().toISOString(),
    })

    setChatMessage('')
    toastSuccess('Message transmis au vendeur !')
    forceUpdate(n => n + 1)
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <ShoppingBag className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Mes Commandes & Reçus</h1>
          <p className="text-sm text-muted-foreground">Suivez vos achats et téléchargez vos reçus officiels Mobile Money.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 card-glass">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold text-foreground">Aucune commande pour l'instant</h3>
          <p className="text-sm text-muted-foreground">Vos commandes apparaîtront ici dès que vous aurez effectué un achat.</p>
          <Link to="/" className="btn-primary inline-flex mt-6"><Store className="w-4 h-4" /> Explorer le marché</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const chatLogs = ChatAPI.filter(c => c.order_id === order.id)

            return (
              <div key={order.id} className="card-glass p-6 space-y-4">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-base">Commande #{order.id.slice(0, 8)}</span>
                      <span className={cn('badge', getStatusColor(order.status))}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Date: {formatDate(order.created_date)} • Boutique: <strong className="text-foreground">{order.shop_name}</strong></p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold gradient-text">{formatPrice(order.total)}</span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl">
                  <div className="w-12 h-12 rounded-lg bg-card flex items-center justify-center font-bold text-primary border border-border">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm line-clamp-1">{order.product_name || 'Commande multi-articles'}</p>
                    {order.pin_code && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                        <Key className="w-3.5 h-3.5" /> PIN de livraison: <span className="bg-emerald-500/10 px-2 py-0.5 rounded font-mono">{order.pin_code}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {order.status === 'pending_payment' && (
                    <Button
                      size="sm"
                      onClick={() => { setActiveOrder(order); setProofModalOpen(true) }}
                    >
                      <Upload className="w-4 h-4" /> Envoyer preuve MoMo
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setActiveOrder(order); setInvoiceModalOpen(true) }}
                  >
                    <FileText className="w-4 h-4 text-emerald-400" /> Reçu / Facture
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setActiveOrder(order); setChatModalOpen(true) }}
                  >
                    <MessageSquare className="w-4 h-4" /> Discuter ({chatLogs.length})
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Official Receipt / Invoice Modal */}
      {activeOrder && (
        <Modal open={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} title={`Reçu Officiel - Commande #${activeOrder.id.slice(0, 8)}`}>
          <div className="space-y-6 text-foreground print:p-0">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-black">M+</div>
                    <span className="font-display font-bold text-lg gradient-text">MarchéPlus Cameroun</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Plateforme Marketplace & Logements</p>
                </div>
                <div className="text-right">
                  <span className="badge-success bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" /> Reçu Vérifié
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(activeOrder.created_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground font-semibold">Acheteur :</p>
                  <p className="font-bold text-foreground">{activeOrder.customer_name}</p>
                  <p className="text-muted-foreground">{activeOrder.customer_email}</p>
                  {activeOrder.customer_phone && <p className="text-muted-foreground">{activeOrder.customer_phone}</p>}
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Vendeur / Boutique :</p>
                  <p className="font-bold text-foreground">{activeOrder.shop_name}</p>
                  <p className="text-muted-foreground">Mode de paiement : MTN MoMo / Orange Money</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-xs font-bold text-foreground">
                  <span>Désignation de l'article</span>
                  <span>Prix</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground py-1 border-b border-border/50">
                  <span>{activeOrder.product_name}</span>
                  <span className="font-mono">{formatPrice(activeOrder.total)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-foreground pt-2">
                  <span>Total payé</span>
                  <span className="text-emerald-400 font-mono">{formatPrice(activeOrder.total)}</span>
                </div>
              </div>

              {activeOrder.payment_proof_url && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  <strong>ID Preuve MoMo :</strong> {activeOrder.payment_proof_url}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 print:hidden">
              <Button variant="outline" onClick={() => setInvoiceModalOpen(false)}>Fermer</Button>
              <Button onClick={handlePrintReceipt} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                <Printer className="w-4 h-4" /> Imprimer / Télécharger le reçu
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Proof upload Modal */}
      <Modal open={proofModalOpen} onClose={() => setProofModalOpen(false)} title="Uploader une preuve de paiement">
        <form onSubmit={handleUploadProof} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Entrez l'URL de votre capture d'écran d'envoi Mobile Money ou l'ID de transaction (ex: 23894829384).
          </p>
          <Input label="ID de transaction / Lien de l'image" placeholder="Ex: TXN1294829048" required value={proofUrl} onChange={e => setProofUrl(e.target.value)} />
          <div className="pt-3 flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setProofModalOpen(false)}>Annuler</Button>
            <Button type="submit">Valider la preuve</Button>
          </div>
        </form>
      </Modal>

      {/* Chat Modal */}
      <Modal open={chatModalOpen} onClose={() => setChatModalOpen(false)} title={`Chat Plateforme - Commande #${activeOrder?.id.slice(0, 8)}`}>
        <div className="space-y-4">
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-foreground">Vendeur: {activeOrder?.shop_name}</p>
              <p className="text-muted-foreground">Article: {activeOrder?.product_name} ({formatPrice(activeOrder?.total || 0)})</p>
            </div>
            <a
              href={buildWhatsAppUrl('237680195221', `Bonjour ${activeOrder?.shop_name}, concernant ma commande #${activeOrder?.id.slice(0, 8)} sur MarchéPlus.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow"
            >
              <Phone className="w-3 h-3" /> WhatsApp
            </a>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-3 p-3 bg-muted/30 rounded-xl border border-border/40">
            {activeOrder && ChatAPI.filter(c => c.order_id === activeOrder.id).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun message pour le moment.</p>
            ) : (
              activeOrder && ChatAPI.filter(c => c.order_id === activeOrder.id).map(msg => (
                <div key={msg.id} className={cn('p-3 rounded-2xl max-w-[85%] text-xs space-y-1', msg.sender_role === 'customer' ? 'ml-auto bg-primary text-white rounded-br-none' : 'mr-auto bg-card border border-border text-foreground rounded-bl-none shadow-sm')}>
                  <p className="font-bold text-[10px] opacity-80">{msg.sender_name}</p>
                  <p>{msg.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Presets :
            </span>
            {[
              'Paiement MoMo effectué 💳',
              'Pouvez-vous valider ma commande ?',
              'Quel est le délai de livraison ?',
              'Article bien reçu, merci !'
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setChatMessage(preset)}
                className="px-2 py-0.5 rounded-md bg-card border border-border/60 hover:bg-muted text-[10px] text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input placeholder="Écrire un message au vendeur..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} className="flex-1 text-xs" />
            <Button type="submit" className="gap-1 text-xs">
              <Send className="w-3.5 h-3.5" /> Envoyer
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  )
}
