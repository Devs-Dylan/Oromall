import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  X, CheckCircle, Phone, MapPin, Upload, MessageCircle,
  ShoppingBag, ShieldCheck, CreditCard, Key, ArrowRight, Tag
} from 'lucide-react'
import type { Product, Shop, PaymentMethod } from '@/types'
import { CITIES_CAMEROON } from '@/types'
import { OrderAPI, ProductAPI, ChatAPI, NotificationAPI, CommissionAPI } from '@/lib/store'
import { formatPrice, buildWhatsAppUrl, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { FileUploadField } from '@/components/ui/FileUploadField'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'

interface ProductCheckoutModalProps {
  open: boolean
  onClose: () => void
  product: Product
  shop?: Shop | null
  quantity?: number
  onSuccess?: () => void
}

const ADMIN_MTN = '680195221'
const ADMIN_ORANGE = '691576677'
const SUPPORT_WHATSAPP = '237680195221'

export function ProductCheckoutModal({
  open,
  onClose,
  product,
  shop,
  quantity = 1,
  onSuccess,
}: ProductCheckoutModalProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Form State
  const [customerName, setCustomerName] = useState(user?.name || '')
  const [customerEmail, setCustomerEmail] = useState(user?.email || '')
  const [whatsappNumber, setWhatsappNumber] = useState(user?.phone || user?.mtn_number || user?.orange_number || '')
  const [deliveryCity, setDeliveryCity] = useState('Yaoundé')
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn')
  const [paymentProof, setPaymentProof] = useState<string | undefined>(undefined)
  const [paymentReference, setPaymentReference] = useState('')
  const [processing, setProcessing] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<any>(null)

  if (!open) return null

  const unitPrice = product.price
  const totalAmount = unitPrice * quantity
  const targetMoMoNumber = paymentMethod === 'mtn'
    ? (shop?.mtn_number || ADMIN_MTN)
    : (shop?.orange_number || ADMIN_ORANGE)

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!customerName.trim()) {
      toastError('Veuillez renseigner votre nom complet.')
      return
    }

    if (!whatsappNumber.trim()) {
      toastError('Le numéro WhatsApp est obligatoire pour les notifications de livraison.')
      return
    }

    if (!deliveryNeighborhood.trim()) {
      toastError('Veuillez indiquer votre quartier de livraison.')
      return
    }

    setProcessing(true)
    await new Promise(r => setTimeout(r, 600))

    // 4-digit secret delivery pin code
    const pin = Math.floor(1000 + Math.random() * 9000).toString()

    const order = OrderAPI.create({
      shop_id: product.shop_id,
      shop_name: product.shop_name,
      product_id: product.id,
      product_name: quantity > 1 ? `${product.name} (x${quantity})` : product.name,
      product_price: product.price,
      total: totalAmount,
      customer_name: customerName.trim(),
      customer_email: customerEmail.trim() || `${whatsappNumber.replace(/\D/g, '')}@client.oromall.cm`,
      customer_phone: whatsappNumber.trim(),
      shipping_address: {
        city: deliveryCity,
        neighborhood: deliveryNeighborhood.trim(),
        notes: deliveryNotes.trim() || undefined
      },
      message: deliveryNotes.trim() || undefined,
      status: paymentProof || paymentReference.trim() ? 'payment_uploaded' : 'pending_payment',
      payment_method: paymentMethod,
      payment_proof_url: paymentProof,
      payment_reference: paymentReference.trim() || undefined,
      payment_verified: false,
      pin_code: pin,
    })

    // Update stock if applicable
    if (product.stock > 0) {
      ProductAPI.update(product.id, {
        stock: Math.max(0, product.stock - quantity)
      })
    }

    // Register commission
    const commissionAmount = Math.round(order.total * 0.02)
    if (commissionAmount > 0) {
      CommissionAPI.create({
        order_id: order.id,
        shop_id: product.shop_id,
        shop_name: product.shop_name,
        vendor_name: shop?.owner_name || product.shop_name,
        vendor_email: shop?.owner_email || shop?.owner_name || product.shop_name,
        order_total: order.total,
        rate: 2,
        amount: commissionAmount,
        status: 'pending',
      })
    }

    // In-app initial chat message
    ChatAPI.create({
      order_id: order.id,
      sender_role: 'customer',
      sender_name: customerName,
      message: `Bonjour ${product.shop_name}, commande #${order.id.slice(0, 8)} passée pour "${product.name}" (${formatPrice(totalAmount)}). Livraison demandée à ${deliveryCity} (${deliveryNeighborhood}). Contact WhatsApp: ${whatsappNumber}.`,
    })

    // In-app Notification for Seller
    NotificationAPI.create({
      shop_id: product.shop_id,
      title: `Nouvelle Commande #${order.id.slice(0, 8)}`,
      message: `${customerName} (${whatsappNumber}) a commandé "${product.name}" (${formatPrice(totalAmount)}).`,
      type: 'order',
      read: false,
    })

    setCreatedOrder(order)
    setProcessing(false)
    toastSuccess('Commande & Réservation enregistrées avec succès ! 🎉')
    onSuccess?.()
  }

  const sellerWhatsApp = shop?.whatsapp_number || shop?.whatsapp || SUPPORT_WHATSAPP

  const whatsappNotificationText = createdOrder
    ? `Bonjour ${product.shop_name} ! J'ai validé ma commande sur OroMall :\n• Produit : ${product.name} (x${quantity})\n• Montant : ${formatPrice(totalAmount)}\n• Client : ${customerName}\n• WhatsApp : ${whatsappNumber}\n• Lieu de livraison : ${deliveryCity} (${deliveryNeighborhood})\n• Paiement choisi : ${paymentMethod === 'mtn' ? 'MTN MoMo' : 'Orange Money'}\n• Code PIN de livraison : ${createdOrder.pin_code}\nRéf: ${paymentReference || 'Preuve envoyée'}`
    : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="card-glass p-5 sm:p-7 max-w-lg w-full space-y-5 max-h-[90vh] overflow-y-auto border border-primary/40 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-black font-black flex items-center justify-center text-sm shadow">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-display text-foreground">Finaliser la Commande & Réserver</h2>
              <p className="text-xs text-muted-foreground">Paiement Mobile Money & confirmation WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation View */}
        {createdOrder ? (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-foreground">Commande #{createdOrder.id.slice(0, 8)} Validée !</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Votre commande a été enregistrée et transmise à la boutique <strong className="text-foreground">{product.shop_name}</strong>.
              </p>
            </div>

            {/* Secret PIN Security Box */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
              <p className="font-bold text-amber-400 flex items-center justify-center gap-1.5">
                <Key className="w-4 h-4" /> Code PIN Secret de Réception :
              </p>
              <div className="text-2xl font-black font-mono tracking-widest text-primary">
                {createdOrder.pin_code}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Donnez ce code PIN au vendeur / livreur uniquement lorsque vous recevrez votre colis en main propre.
              </p>
            </div>

            {/* Summary Details */}
            <div className="p-3.5 bg-muted/40 rounded-xl border border-border text-left text-xs space-y-1.5">
              <p><span className="text-muted-foreground">Article :</span> <strong>{product.name} (x{quantity})</strong></p>
              <p><span className="text-muted-foreground">Montant Total :</span> <strong className="text-emerald-400">{formatPrice(totalAmount)}</strong></p>
              <p><span className="text-muted-foreground">Livraison :</span> {deliveryCity} ({deliveryNeighborhood})</p>
              <p><span className="text-muted-foreground">WhatsApp client :</span> {whatsappNumber}</p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2.5 pt-2">
              <a
                href={buildWhatsAppUrl(sellerWhatsApp, whatsappNotificationText)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/25"
              >
                <MessageCircle className="w-4 h-4" /> Notifier le vendeur sur WhatsApp 💬
              </a>

              <Button
                onClick={() => {
                  onClose()
                  navigate(`/orders?chat=${createdOrder.id}`)
                }}
                className="w-full bg-primary text-white text-xs font-bold py-2.5"
              >
                Voir ma commande & Discuter dans l'application
              </Button>
            </div>
          </div>
        ) : (
          /* Step-by-step Checkout Form */
          <form onSubmit={handleSubmitOrder} className="space-y-4 text-xs">
            {/* 1. Product Summary Card */}
            <div className="p-3 rounded-2xl bg-muted/30 border border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-14 h-14 object-cover rounded-xl border border-border flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-bold text-foreground truncate text-sm">{product.name}</h4>
                  <p className="text-[11px] text-muted-foreground">Vendu par <strong className="text-foreground">{product.shop_name}</strong></p>
                  <p className="text-[11px] text-primary font-extrabold">{formatPrice(unitPrice)} {quantity > 1 ? `x ${quantity}` : ''}</p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-[10px] text-muted-foreground block font-bold uppercase">Total à payer</span>
                <span className="text-base font-black text-emerald-400">{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {/* 2. Customer Info & WhatsApp */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-card border border-border">
              <h3 className="font-bold text-foreground flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" /> 1. Vos Coordonnées & Contact WhatsApp
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Nom complet *</label>
                  <Input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Ex: Paul Biya"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Numéro WhatsApp *</label>
                  <Input
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    placeholder="Ex: 680195221"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Ville de livraison *</label>
                  <Select
                    value={deliveryCity}
                    onChange={e => setDeliveryCity(e.target.value)}
                    options={CITIES_CAMEROON.map(c => ({ value: c, label: c }))}
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">Quartier / Repère *</label>
                  <Input
                    value={deliveryNeighborhood}
                    onChange={e => setDeliveryNeighborhood(e.target.value)}
                    placeholder="Ex: Bastos, Ngoa-Ekellé, Akwa..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Instructions de livraison (Optionnel)</label>
                <Input
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  placeholder="Ex: Livrer devant le portail vert, appeler à l'arrivée..."
                />
              </div>
            </div>

            {/* 3. Mobile Money Payment Choice (Identical to Visit Payment) */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-card border border-border">
              <h3 className="font-bold text-foreground flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" /> 2. Mode de Paiement Mobile Money
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mtn')}
                  className={cn(
                    'p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center',
                    paymentMethod === 'mtn'
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-bold ring-2 ring-amber-400/20'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  )}
                >
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                  <span className="text-xs font-black">MTN Mobile Money</span>
                  <span className="text-[10px] opacity-80">{shop?.mtn_number || ADMIN_MTN}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('orange')}
                  className={cn(
                    'p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center',
                    paymentMethod === 'orange'
                      ? 'border-orange-500 bg-orange-500/10 text-orange-300 font-bold ring-2 ring-orange-500/20'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  )}
                >
                  <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
                  <span className="text-xs font-black">Orange Money</span>
                  <span className="text-[10px] opacity-80">{shop?.orange_number || ADMIN_ORANGE}</span>
                </button>
              </div>

              {/* Payment instructions */}
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-[11px] space-y-1 text-muted-foreground">
                <p className="font-bold text-foreground">
                  Transférez <strong className="text-emerald-400">{formatPrice(totalAmount)}</strong> au numéro :
                </p>
                <p className="font-mono font-black text-xs text-primary bg-card p-1.5 rounded border border-border inline-block">
                  {targetMoMoNumber} ({paymentMethod === 'mtn' ? 'MTN MoMo' : 'Orange Money'})
                </p>
                <p className="text-[10px]">
                  Après transfert, vous pouvez joindre la capture ou l'identifiant de transaction ci-dessous (ou l'envoyer dans le chat).
                </p>
              </div>

              {/* Upload Proof / Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <FileUploadField
                    label="Capture du reçu MoMo"
                    value={paymentProof}
                    onChange={setPaymentProof}
                    accept="image/*,.pdf"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Réf / ID Transaction</label>
                  <Input
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    placeholder="Ex: MP240822.0915.A..."
                  />
                </div>
              </div>
            </div>

            {/* Total & Action Button */}
            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="submit"
                disabled={processing}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
              >
                <ShieldCheck className="w-4 h-4" />
                {processing ? 'Enregistrement en cours...' : `Confirmer la commande & Réserver (${formatPrice(totalAmount)})`}
              </Button>

              <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                <Key className="w-3 h-3 text-emerald-400" /> Paiement protégé et sécurisé par code PIN secret à la livraison
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
