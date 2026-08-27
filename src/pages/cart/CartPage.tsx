import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Trash2, Plus, Minus, Tag, ArrowRight,
  Package, Store, ChevronRight, AlertCircle, Phone, MapPin,
  CreditCard, ShieldCheck, Key, MessageCircle, CheckCircle, X
} from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, cn, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { FileUploadField } from '@/components/ui/FileUploadField'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { OrderAPI, ChatAPI, NotificationAPI, CommissionAPI, ShopAPI } from '@/lib/store'
import { CITIES_CAMEROON, type PaymentMethod, type CartItem } from '@/types'

const ADMIN_MTN = '680195221'
const ADMIN_ORANGE = '691576677'
const SUPPORT_WHATSAPP = '237680195221'

export default function CartPage() {
  const { user } = useAuth()
  const { items, total, count, byShop, removeItem, updateQuantity, clearCart, applyPromo } = useCart()
  const navigate = useNavigate()

  // Promo State
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoApplied, setPromoApplied] = useState<string | null>(null)

  // Checkout Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
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
  const [completedOrderGroupId, setCompletedOrderGroupId] = useState<string | null>(null)
  const [createdOrderPin, setCreatedOrderPin] = useState<string>('')

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return
    const promo = applyPromo(promoCode)
    if (!promo) {
      toastError('Code invalide', 'Ce code promo n\'existe pas ou est expiré.')
      return
    }
    const d = promo.discount_type === 'percent' ? Math.round((total * promo.value) / 100) : promo.value
    setDiscount(d)
    setPromoApplied(promo.code)
    toastSuccess('Promo appliquée !', `Réduction de ${formatPrice(d)}`)
  }

  const finalTotal = Math.max(0, total - discount)

  const handleConfirmCartOrder = async (e: React.FormEvent) => {
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

    let firstOrderId = ''
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString()
    setCreatedOrderPin(generatedPin)

    Object.entries(byShop).forEach(([shopId, { shop_name, items: shopItems }]) => {
      const item = shopItems[0]
      const shopTotal = shopItems.reduce((s, i) => s + (i.product_price * i.quantity), 0)

      const order = OrderAPI.create({
        shop_id: shopId,
        shop_name,
        product_id: item.product_id,
        product_name: shopItems.length > 1 ? `${item.product_name} (+${shopItems.length - 1} autres)` : item.product_name,
        product_price: item.product_price,
        total: shopTotal,
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
        pin_code: generatedPin,
        promo_code: promoApplied || undefined,
        discount_amount: discount > 0 ? discount : undefined,
      })

      const shop = ShopAPI.get(shopId)
      const commissionAmount = Math.round(order.total * 0.02)
      if (commissionAmount > 0) {
        CommissionAPI.create({
          order_id: order.id,
          shop_id: shopId,
          shop_name,
          vendor_name: shop?.owner_name || shop_name,
          vendor_email: shop?.owner_email || shop?.owner_name || shop_name,
          order_total: order.total,
          rate: 2,
          amount: commissionAmount,
          status: 'pending',
        })
      }

      if (!firstOrderId) firstOrderId = order.id

      // In-app Notification for Seller
      NotificationAPI.create({
        shop_id: shopId,
        title: `Nouvelle Commande Panier #${order.id.slice(0, 8)}`,
        message: `${customerName} (${whatsappNumber}) a commandé (${formatPrice(order.total)}).`,
        type: 'order',
        read: false,
      })

      // Chat Message
      ChatAPI.create({
        order_id: order.id,
        sender_role: 'customer',
        sender_name: customerName,
        message: `Bonjour ${shop_name}, commande #${order.id.slice(0, 8)} validée via le panier. Livraison à ${deliveryCity} (${deliveryNeighborhood}). Contact WhatsApp : ${whatsappNumber}.`,
      })
    })

    setCompletedOrderGroupId(firstOrderId)
    setProcessing(false)
    clearCart()
    toastSuccess('Commande & Réservation enregistrées avec succès ! 🎉')
  }

  const targetMoMoNumber = paymentMethod === 'mtn' ? ADMIN_MTN : ADMIN_ORANGE

  const whatsappNotificationText = `Bonjour OroMall ! J'ai validé ma commande sur la plateforme :\n• Montant Total : ${formatPrice(finalTotal)}\n• Client : ${customerName}\n• WhatsApp : ${whatsappNumber}\n• Ville & Quartier : ${deliveryCity} (${deliveryNeighborhood})\n• Paiement choisi : ${paymentMethod === 'mtn' ? 'MTN MoMo' : 'Orange Money'}\n• Code PIN de livraison : ${createdOrderPin}\nRéf: ${paymentReference || 'Preuve envoyée'}`

  if (items.length === 0 && !completedOrderGroupId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Votre panier est vide</h1>
        <p className="text-muted-foreground mb-8">Explorez la marketplace pour trouver des produits qui vous plaisent.</p>
        <Link to="/" className="btn-primary inline-flex">
          <Store className="w-4 h-4" /> Aller à la marketplace
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-display font-bold text-foreground">Mon panier</h1>
        <span className="badge-primary">{count} article{count > 1 ? 's' : ''}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items list */}
        <div className="lg:col-span-2 space-y-6">
          {Object.entries(byShop).map(([shopId, { shop_name, items: shopItems }]) => (
            <div key={shopId} className="card-glass overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center gap-3">
                <Store className="w-5 h-5 text-primary" />
                <Link to={`/shop/${shopId}`} className="font-semibold text-foreground hover:text-primary transition-colors">
                  {shop_name}
                </Link>
                <span className="text-sm text-muted-foreground">({shopItems.length} article{shopItems.length > 1 ? 's' : ''})</span>
              </div>
              <div className="divide-y divide-border">
                {shopItems.map(item => (
                  <CartItemRow key={item.id} item={item} onRemove={removeItem} onUpdateQty={updateQuantity} />
                ))}
              </div>
            </div>
          ))}

          <Button variant="ghost" onClick={clearCart} className="text-destructive hover:bg-destructive/10 text-sm">
            <Trash2 className="w-4 h-4" /> Vider le panier
          </Button>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="card-glass p-6 sticky top-24">
            <h2 className="text-xl font-display font-bold text-foreground mb-6">Récapitulatif</h2>

            {/* Promo input */}
            <div className="mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Code promo"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 text-sm py-2"
                />
                <Button variant="outline" size="sm" onClick={handleApplyPromo} className="px-3">
                  <Tag className="w-4 h-4" />
                </Button>
              </div>
              {promoApplied && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1 font-semibold">
                  <Tag className="w-3 h-3" /> Code <strong>{promoApplied}</strong> appliqué (-{formatPrice(discount)})
                </p>
              )}
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                  <span>Réduction promo</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Livraison</span>
                <span className="text-emerald-500 font-medium">À convenir avec le vendeur</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
                <span>Total à régler</span>
                <span className="text-emerald-400 font-black text-xl">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                className="w-full text-xs sm:text-sm font-bold py-3 bg-primary text-white shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                onClick={() => setCheckoutModalOpen(true)}
              >
                <ShieldCheck className="w-4 h-4" /> Commander sur la plateforme ({formatPrice(finalTotal)})
              </Button>

              <Link to="/" className="btn-outline w-full justify-center text-xs py-3 font-semibold">
                Continuer mes achats 🛍️
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CHECKOUT MODAL (MATCHES HOUSING VISIT PAYMENT FLOW) */}
      {/* ========================================================================= */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="card-glass p-5 sm:p-7 max-w-lg w-full space-y-5 max-h-[90vh] overflow-y-auto border border-primary/40 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary text-black font-black flex items-center justify-center text-sm shadow">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-display text-foreground">Validation Panier & Paiement MoMo</h2>
                  <p className="text-xs text-muted-foreground">Paiement Mobile Money & confirmation WhatsApp</p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success confirmation */}
            {completedOrderGroupId ? (
              <div className="space-y-5 text-center py-2">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-foreground">Commande Validée avec Succès !</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Votre commande a été transmise aux vendeurs concernés.
                  </p>
                </div>

                {/* Secret PIN Security Box */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
                  <p className="font-bold text-amber-400 flex items-center justify-center gap-1.5">
                    <Key className="w-4 h-4" /> Code PIN Secret de Réception :
                  </p>
                  <div className="text-2xl font-black font-mono tracking-widest text-primary">
                    {createdOrderPin}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Remettez ce code PIN aux vendeurs / livreurs uniquement après avoir inspecté et reçu vos articles.
                  </p>
                </div>

                {/* Summary */}
                <div className="p-3.5 bg-muted/40 rounded-xl border border-border text-left text-xs space-y-1.5">
                  <p><span className="text-muted-foreground">Articles :</span> <strong>{count} article(s) commandé(s)</strong></p>
                  <p><span className="text-muted-foreground">Total Réglé :</span> <strong className="text-emerald-400">{formatPrice(finalTotal)}</strong></p>
                  <p><span className="text-muted-foreground">Lieu de Livraison :</span> {deliveryCity} ({deliveryNeighborhood})</p>
                  <p><span className="text-muted-foreground">WhatsApp client :</span> {whatsappNumber}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2.5 pt-2">
                  <a
                    href={buildWhatsAppUrl(SUPPORT_WHATSAPP, whatsappNotificationText)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-600/25"
                  >
                    <MessageCircle className="w-4 h-4" /> Notifier le support sur WhatsApp 💬
                  </a>

                  <Button
                    onClick={() => {
                      setCheckoutModalOpen(false)
                      navigate(`/orders?chat=${completedOrderGroupId}`)
                    }}
                    className="w-full bg-primary text-white text-xs font-bold py-2.5"
                  >
                    Suivre mes commandes & Discuter avec les vendeurs
                  </Button>
                </div>
              </div>
            ) : (
              /* Checkout Form */
              <form onSubmit={handleConfirmCartOrder} className="space-y-4 text-xs">
                {/* 1. Order Summary header */}
                <div className="p-3 rounded-2xl bg-muted/30 border border-border flex items-center justify-between">
                  <div>
                    <span className="font-bold text-foreground block">{count} article(s) dans le panier</span>
                    <span className="text-[11px] text-muted-foreground">Boutiques : {Object.values(byShop).map(b => b.shop_name).join(', ')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground block font-bold uppercase">Total à payer</span>
                    <span className="text-base font-black text-emerald-400">{formatPrice(finalTotal)}</span>
                  </div>
                </div>

                {/* 2. Customer Coords & WhatsApp */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-card border border-border">
                  <h3 className="font-bold text-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" /> 1. Vos Coordonnées & WhatsApp
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

                {/* 3. Mobile Money Payment Choice */}
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
                      <span className="text-[10px] opacity-80">{ADMIN_MTN}</span>
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
                      <span className="text-[10px] opacity-80">{ADMIN_ORANGE}</span>
                    </button>
                  </div>

                  <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-[11px] space-y-1 text-muted-foreground">
                    <p className="font-bold text-foreground">
                      Transférez <strong className="text-emerald-400">{formatPrice(finalTotal)}</strong> au compte :
                    </p>
                    <p className="font-mono font-black text-xs text-primary bg-card p-1.5 rounded border border-border inline-block">
                      {targetMoMoNumber} ({paymentMethod === 'mtn' ? 'MTN MoMo' : 'Orange Money'})
                    </p>
                  </div>

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
                    {processing ? 'Validation en cours...' : `Confirmer la commande & Réserver (${formatPrice(finalTotal)})`}
                  </Button>

                  <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1">
                    <Key className="w-3 h-3 text-emerald-400" /> Paiement protégé et sécurisé par code PIN secret à la livraison
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function CartItemRow({
  item,
  onRemove,
  onUpdateQty
}: {
  item: CartItem
  onRemove: (id: string) => void
  onUpdateQty: (id: string, qty: number) => void
}) {
  return (
    <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <img
          src={item.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
          alt={item.product_name}
          className="w-16 h-16 object-cover rounded-xl border border-border flex-shrink-0"
        />
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-sm line-clamp-1">{item.product_name}</h3>
          <p className="text-xs text-muted-foreground">{formatPrice(item.product_price)} l'unité</p>
          <span className="text-xs font-bold text-primary mt-1 inline-block">
            Sous-total : {formatPrice(item.product_price * item.quantity)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
        <div className="flex items-center border border-border rounded-xl bg-card overflow-hidden">
          <button
            onClick={() => onUpdateQty(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="px-3 text-xs font-bold text-foreground">{item.quantity}</span>
          <button
            onClick={() => onUpdateQty(item.id, item.quantity + 1)}
            className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="text-destructive hover:bg-destructive/10 p-2"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
