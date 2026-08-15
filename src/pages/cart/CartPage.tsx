import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingCart, Trash2, Plus, Minus, Tag, ArrowRight,
  Package, Store, ChevronRight, AlertCircle
} from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { OrderAPI, ChatAPI, NotificationAPI } from '@/lib/store'
import type { CartItem } from '@/types'

export default function CartPage() {
  const { user } = useAuth()
  const { items, total, count, byShop, removeItem, updateQuantity, clearCart, applyPromo } = useCart()
  const navigate = useNavigate()
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [promoApplied, setPromoApplied] = useState<string | null>(null)

  const handleApplyPromo = () => {
    if (!promoCode.trim()) return
    const promo = applyPromo(promoCode)
    if (!promo) { toastError('Code invalide', 'Ce code promo n\'existe pas ou est expiré.'); return }
    const d = promo.discount_type === 'percent' ? Math.round(total * promo.value / 100) : promo.value
    setDiscount(d)
    setPromoApplied(promo.code)
    toastSuccess('Promo appliquée !', `Réduction de ${formatPrice(d)}`)
  }

  const finalTotal = Math.max(0, total - discount)

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">Votre panier est vide</h1>
        <p className="text-muted-foreground mb-8">Explorez la marketplace pour trouver des produits qui vous plaisent.</p>
        <Link to="/" className="btn-primary inline-flex">
          <Store className="w-4 h-4" />Aller à la marketplace
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart className="w-7 h-7 text-primary" />
        <h1 className="text-3xl font-display font-bold text-foreground">Mon panier</h1>
        <span className="badge-primary">{count} article{count > 1 ? 's' : ''}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
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
            <Trash2 className="w-4 h-4" />Vider le panier
          </Button>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card-glass p-6 sticky top-24">
            <h2 className="text-xl font-display font-bold text-foreground mb-6">Récapitulatif</h2>

            {/* Promo */}
            <div className="mb-4">
              <div className="flex gap-2">
                <Input placeholder="Code promo" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} className="flex-1 text-sm py-2" />
                <Button variant="outline" size="sm" onClick={handleApplyPromo} className="px-3">
                  <Tag className="w-4 h-4" />
                </Button>
              </div>
              {promoApplied && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <Tag className="w-3 h-3" />Code <strong>{promoApplied}</strong> appliqué !
                </p>
              )}
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-medium">{formatPrice(total)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600">
                  <span>Réduction</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Livraison</span>
                <span className="text-emerald-600 font-medium">À négocier</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
                <span>Total</span>
                <span className="gradient-text">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {!user ? (
                <Link to="/login" className="btn-primary w-full justify-center">
                  Se connecter pour commander
                </Link>
              ) : (
                <Button
                  className="w-full text-xs font-bold py-3 bg-primary text-white shadow-lg shadow-primary/20"
                  onClick={() => {
                    let firstOrderId = ''
                    Object.entries(byShop).forEach(([shopId, { shop_name, items: shopItems }]) => {
                      const item = shopItems[0]
                      const pin = Math.floor(1000 + Math.random() * 9000).toString()
                      const order = OrderAPI.create({
                        shop_id: shopId,
                        shop_name,
                        product_id: item.product_id,
                        product_name: shopItems.length > 1 ? `${item.product_name} (+${shopItems.length - 1} autres)` : item.product_name,
                        product_price: item.product_price,
                        total: shopItems.reduce((s, i) => s + (i.product_price * i.quantity), 0),
                        customer_name: user.name,
                        customer_email: user.email,
                        customer_phone: '680195221',
                        status: 'pending_payment',
                        pin_code: pin,
                      })

                      if (!firstOrderId) firstOrderId = order.id

                      // In-app Notification for Seller
                      NotificationAPI.create({
                        shop_id: shopId,
                        title: `Nouvelle Commande Panier #${order.id.slice(0, 8)}`,
                        message: `${user.name} a passé commande (${formatPrice(order.total)}).`,
                        type: 'order',
                        read: false,
                        created_date: new Date().toISOString(),
                      })

                      // Chat Message
                      ChatAPI.create({
                        order_id: order.id,
                        sender_role: 'customer',
                        sender_name: user.name,
                        message: `Bonjour ${shop_name}, commande #${order.id.slice(0, 8)} validée via le panier.`,
                      })
                    })

                    clearCart()
                    toastSuccess('Commande enregistrée sur la plateforme !', 'Notification transmise aux vendeurs.')
                    navigate(`/orders?chat=${firstOrderId}`)
                  }}
                >
                  <ArrowRight className="w-4 h-4" /> Commander sur la plateforme 🛒
                </Button>
              )}

              <Link to="/" className="btn-outline w-full justify-center text-xs py-3 font-semibold">
                Continuer mes achats 🛍️
              </Link>
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
              <span>Paiement via MTN MoMo ou Orange Money directement avec le vendeur.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CartItemRow({ item, onRemove, onUpdateQty }: {
  item: CartItem
  onRemove: (id: string) => void
  onUpdateQty: (id: string, qty: number) => void
}) {
  return (
    <div className="flex gap-4 p-5 group hover:bg-muted/20 transition-colors">
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
        {item.image_url ? (
          <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-muted-foreground" /></div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Link to={`/product/${item.product_id}`} className="font-semibold text-foreground hover:text-primary transition-colors text-sm leading-tight line-clamp-2">
          {item.product_name}
        </Link>
        <p className="text-lg font-bold gradient-text mt-1">{formatPrice(item.product_price)}</p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button onClick={() => onUpdateQty(item.id, item.quantity - 1)} className="px-2.5 py-1.5 hover:bg-muted transition-colors text-foreground">
              <Minus className="w-3 h-3" />
            </button>
            <span className="px-3 py-1.5 text-sm font-semibold text-foreground border-x border-border">{item.quantity}</span>
            <button onClick={() => onUpdateQty(item.id, item.quantity + 1)} className="px-2.5 py-1.5 hover:bg-muted transition-colors text-foreground">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button onClick={() => onRemove(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-foreground">{formatPrice(item.product_price * item.quantity)}</p>
      </div>
    </div>
  )
}
