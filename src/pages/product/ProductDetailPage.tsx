import { useState, useMemo, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, ShoppingBag, Heart, ArrowLeft,
  CheckCircle, MessageSquare, Star, User, ShieldCheck, Share2, Tag, Package
} from 'lucide-react'
import { ProductAPI, ShopAPI, ReviewAPI, WishlistAPI, OrderAPI, ChatAPI, NotificationAPI, AvailabilityRequestAPI, CommissionAPI } from '@/lib/store'
import { CONDITION_LABELS } from '@/types'
import { formatPrice, cn, buildWhatsAppUrl, generatePin } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { ProductCheckoutModal } from '@/components/product/ProductCheckoutModal'

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { user } = useAuth()
  const [, forceUpdate] = useState(0)

  const product = ProductAPI.get(id || '')
  const shop = product ? ShopAPI.get(product.shop_id) : undefined
  const reviews = useMemo(() => ReviewAPI.filter(r => r.product_id === id), [id])

  // State for ordering modal
  const [orderModalOpen, setOrderModalOpen] = useState(false)

  // State for availability request modal
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false)
  const [availQuantity, setAvailQuantity] = useState(1)
  const [availDeadline, setAvailDeadline] = useState('')
  const [availCustomerPhone, setAvailCustomerPhone] = useState('')

  // State for Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground">Produit non trouvé</h2>
        <p className="text-muted-foreground mt-2">Le produit demandé n'existe plus ou a été retiré.</p>
        <Link to="/" className="btn-primary inline-flex mt-6"><ArrowLeft className="w-4 h-4" /> Retour à l'accueil</Link>
      </div>
    )
  }

  const isWishlisted = user ? WishlistAPI.filter(w => w.user_id === user.id && w.product_id === product.id).length > 0 : false

  const toggleWishlist = () => {
    if (!user) { toastError('Connexion requise', 'Connectez-vous pour ajouter aux favoris.'); return }
    const existing = WishlistAPI.filter(w => w.user_id === user.id && w.product_id === product.id)[0]
    if (existing) {
      WishlistAPI.delete(existing.id)
      toastSuccess('Retiré des favoris')
    } else {
      WishlistAPI.create({ user_id: user.id, product_id: product.id })
      toastSuccess('Ajouté aux favoris !')
    }
    forceUpdate(n => n + 1)
  }

  const handleContactVendor = () => {
    const pin = generatePin()
    const order = OrderAPI.create({
      shop_id: product.shop_id,
      shop_name: product.shop_name,
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      total: product.price,
      customer_name: user?.name || 'Client OroMall',
      customer_email: user?.email || '',
      customer_phone: user?.phone || user?.mtn_number || user?.orange_number || '',
      status: 'pending_payment',
      pin_code: pin,
    })

    ChatAPI.create({
      order_id: order.id,
      sender_role: 'customer',
      sender_name: user?.name || 'Client',
      message: `Bonjour ${product.shop_name}, je souhaite des informations concernant l'article "${product.name}" (${formatPrice(product.price)}).`,
    })

    NotificationAPI.create({
      shop_id: product.shop_id,
      title: `Demande d'informations - ${product.name}`,
      message: `${user?.name || 'Un client'} a ouvert une discussion sur le chat interne.`,
      type: 'chat',
      read: false,
    })

    toastSuccess('Chat plateforme ouvert !', 'Le vendeur recevra une notification système.')
    navigate(`/orders?chat=${order.id}`)
  }

  const handleAvailabilityRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!availCustomerPhone) {
      toastError('Veuillez remplir votre numéro de téléphone.')
      return
    }
    if (!availDeadline) {
      toastError('Veuillez sélectionner une date limite.')
      return
    }

    const request = AvailabilityRequestAPI.create({
      product_id: product.id,
      product_name: product.name,
      shop_id: product.shop_id,
      shop_name: product.shop_name,
      customer_name: user?.name || 'Client',
      customer_email: user?.email || '',
      customer_phone: availCustomerPhone,
      quantity: availQuantity,
      deadline_date: availDeadline,
      status: 'pending',
    })

    NotificationAPI.create({
      shop_id: product.shop_id,
      title: `Nouvelle demande de disponibilité - ${product.name}`,
      message: `${request.customer_name} demande ${request.quantity}x "${product.name}" pour le ${request.deadline_date}.`,
      type: 'system',
      read: false,
    })

    setAvailabilityModalOpen(false)
    setAvailQuantity(1)
    setAvailDeadline('')
    setAvailCustomerPhone('')
    toastSuccess('Demande envoyée au vendeur !', 'Vous serez notifié quand il validera la disponibilité.')
  }

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewComment.trim()) return
    ReviewAPI.create({
      product_id: product.id,
      shop_id: product.shop_id,
      user_name: user?.name || 'Client OroMall',
      rating,
      comment: reviewComment,
    })
    setReviewModalOpen(false)
    setReviewComment('')
    toastSuccess('Avis publié avec succès !')
    forceUpdate(n => n + 1)
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0'

  const relatedProducts = ProductAPI.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4)

  const defaultColors = useMemo(() => [
    { name: 'Noir Sidéral', hex: '#1e293b', image_url: product?.image_url },
    { name: 'Argent / Blanc', hex: '#cbd5e1', image_url: product?.image_url },
    { name: 'Bleu Intense', hex: '#2563eb', image_url: product?.image_url },
    { name: 'Or Luxe', hex: '#d97706', image_url: product?.image_url },
  ], [product])

  const availableColors = (product?.colors && product.colors.length > 0) ? product.colors : defaultColors
  const [selectedColor, setSelectedColor] = useState(availableColors[0])
  const [activeImage, setActiveImage] = useState(product?.image_url || '')
  const previousProductId = useRef(product?.id)

  useEffect(() => {
    if (product && product.id !== previousProductId.current) {
      previousProductId.current = product.id
      setActiveImage(product.image_url)
    }
  }, [product?.id])

  const galleryImages = useMemo(() => {
    const list = [product?.image_url || '']
    if (product?.images) list.push(...product.images)
    availableColors.forEach(c => {
      if (c.image_url && !list.includes(c.image_url)) list.push(c.image_url)
    })
    return list.filter(Boolean)
  }, [product, availableColors])

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-12">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour à la marketplace
      </Link>

      {/* Main product view grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Image gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden border border-border bg-card shadow-lg relative group">
            <img
              src={activeImage || product.image_url || ''}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <button
              onClick={toggleWishlist}
              className={cn(
                'absolute top-4 right-4 p-3 rounded-full backdrop-blur-md shadow-lg transition-transform active:scale-95',
                isWishlisted ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-black/60 text-muted-foreground hover:text-red-500'
              )}
            >
              <Heart className={cn('w-5 h-5', isWishlisted && 'fill-current')} />
            </button>
          </div>

          {/* Photo Gallery Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={cn(
                    'w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0',
                    activeImage === img ? 'border-primary scale-105 shadow-md' : 'border-border opacity-70 hover:opacity-100'
                  )}
                >
                  <img src={img} alt={`Aperçu ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & Order CTA */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-primary">{product.category}</span>
              <span className="badge-success">{CONDITION_LABELS[product.condition]}</span>
            </div>
            <h1 className="text-3xl font-display font-extrabold text-foreground">{product.name}</h1>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="text-2xl font-bold gradient-text">{formatPrice(product.price)}</span>
              <div className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="w-4 h-4 fill-current" /> {avgRating} <span className="text-muted-foreground font-normal">({reviews.length} avis)</span>
              </div>
            </div>
          </div>

          {/* Color Selection Selector */}
          <div className="card-glass p-4 rounded-2xl space-y-3 border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                Couleur sélectionnée : <span className="text-primary">{selectedColor?.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {availableColors.map((color, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedColor(color)
                    if (color.image_url) setActiveImage(color.image_url)
                  }}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all',
                    selectedColor?.name === color.name
                      ? 'border-primary bg-primary/10 text-primary shadow-sm scale-105 font-bold'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  )}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-inner"
                    style={{ backgroundColor: color.hex || '#64748b' }}
                  />
                  <span>{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card-glass p-4 rounded-2xl space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Description & Spécifications</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
          </div>

          {/* Seller Card */}
          {shop && (
            <div className="card-glass p-5 rounded-2xl border border-border flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                {shop.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/shop/${shop.id}`} className="font-bold text-foreground text-base hover:text-primary transition-colors block truncate">
                  {shop.name}
                </Link>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> {shop.city} • Vendeur vérifié <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 inline" />
                </p>
                {(shop.mtn_number || shop.orange_number) && (
                  <div className="flex gap-2 mt-2">
                    {shop.mtn_number && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px]">MTN MoMo</span>}
                    {shop.orange_number && <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold text-[10px]">Orange Money</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  addItem({
                    product_id: product.id,
                    shop_id: product.shop_id,
                    shop_name: product.shop_name,
                    product_name: product.name,
                    product_price: product.price,
                    quantity: 1,
                    image_url: product.image_url,
                  })
                  toastSuccess('Ajouté au panier !')
                }}
                variant="outline"
                className="w-full justify-center"
              >
                <ShoppingBag className="w-4 h-4" /> Ajouter au panier
              </Button>

              <Button onClick={() => setOrderModalOpen(true)} className="w-full justify-center">
                Commander directement
              </Button>
            </div>

            <Button
              onClick={() => setAvailabilityModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Package className="w-5 h-5" /> Disponible ? Vérifier la dispo
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="space-y-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display font-bold text-foreground">Avis clients ({reviews.length})</h2>
          <Button variant="outline" size="sm" onClick={() => setReviewModalOpen(true)}>
            Laisser un avis
          </Button>
        </div>

        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun avis pour le moment. Soyez le premier à donner votre avis !</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map(r => (
              <div key={r.id} className="card-glass p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> {r.user_name}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn('w-3.5 h-3.5', i < r.rating ? 'fill-current' : 'text-muted')} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-border">
          <h2 className="text-2xl font-display font-bold text-foreground">Produits similaires</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map(rel => (
              <Link key={rel.id} to={`/product/${rel.id}`} className="product-card p-4 space-y-2">
                <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2">
                  <img src={rel.image_url} alt={rel.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-semibold text-sm line-clamp-1">{rel.name}</h4>
                <p className="font-bold text-primary text-sm">{formatPrice(rel.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Comprehensive Direct Checkout & Reservation Modal */}
      <ProductCheckoutModal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        product={product}
        shop={shop}
        quantity={1}
      />

      {/* Review Modal */}
      <Modal open={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title="Donner votre avis">
        <form onSubmit={handleAddReview} className="space-y-4">
          <div>
            <label className="form-label mb-2 block">Note sur 5 étoiles</label>
            <div className="flex gap-2 text-amber-500">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star className={cn('w-7 h-7', star <= rating ? 'fill-current' : 'text-muted')} />
                </button>
              ))}
            </div>
          </div>

          <Textarea label="Votre commentaire" rows={4} placeholder="Racontez votre expérience avec cet article ou vendeur..." required value={reviewComment} onChange={e => setReviewComment(e.target.value)} />

          <div className="pt-3 flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setReviewModalOpen(false)}>Annuler</Button>
            <Button type="submit">Publier l'avis</Button>
          </div>
        </form>
      </Modal>

      {/* Availability Request Modal */}
      <Modal open={availabilityModalOpen} onClose={() => setAvailabilityModalOpen(false)} title="Demande de disponibilité">
        <form onSubmit={handleAvailabilityRequest} className="space-y-4">
          <div className="bg-muted/40 p-4 rounded-xl flex items-center justify-between text-sm">
            <div>
              <p className="font-semibold text-foreground">{product.name}</p>
              <p className="text-xs text-muted-foreground">{product.shop_name}</p>
            </div>
            <p className="font-bold text-primary">{formatPrice(product.price)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantité souhaitée"
              type="number"
              min="1"
              required
              value={availQuantity}
              onChange={e => setAvailQuantity(parseInt(e.target.value) || 1)}
            />
            <Input
              label="Date limite souhaitée"
              type="date"
              required
              value={availDeadline}
              onChange={e => setAvailDeadline(e.target.value)}
            />
          </div>

          <Input
            label="Votre numéro de téléphone"
            type="tel"
            placeholder="6XX XXX XXX"
            required
            value={availCustomerPhone}
            onChange={e => setAvailCustomerPhone(e.target.value)}
          />

          <div className="pt-3 flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setAvailabilityModalOpen(false)}>Annuler</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500">
              <CheckCircle className="w-4 h-4" /> Envoyer la demande
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
