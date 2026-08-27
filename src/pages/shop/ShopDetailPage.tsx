import { useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, Phone, MessageSquare, Store, ShieldCheck,
  ArrowLeft, ShoppingBag, Star, Clock, Truck, RefreshCw, CheckCircle, Search, Map, Package
} from 'lucide-react'
import { ShopAPI, ProductAPI, OrderAPI, ChatAPI, NotificationAPI } from '@/lib/store'
import type { Product } from '@/types'
import { formatPrice, cn, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import LeafletMap, { MapMarkerItem } from '@/components/shared/LeafletMap'
import { ProductCheckoutModal } from '@/components/product/ProductCheckoutModal'

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { user } = useAuth()
  const shop = ShopAPI.get(id || '')
  const products = ProductAPI.filter(p => p.shop_id === id && p.status === 'active')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes')
  const [activeTab, setActiveTab] = useState<'products' | 'location' | 'policies'>('products')

  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [customerName, setCustomerName] = useState(user?.name || '')
  const [customerEmail, setCustomerEmail] = useState(user?.email || '')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderNote, setOrderNote] = useState('')

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category)))
    return ['Toutes', ...cats]
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCat = selectedCategory === 'Toutes' || product.category === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [products, searchQuery, selectedCategory])

  const openOrderModal = (product: Product) => {
    if (!user) {
      toastError('Connexion requise', 'Connectez-vous pour commander.')
      navigate('/login')
      return
    }
    setSelectedProduct(product)
    setCustomerName(user?.name || '')
    setCustomerEmail(user?.email || '')
    setCustomerPhone('')
    setOrderNote('')
    setOrderModalOpen(true)
  }

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop || !selectedProduct || !customerName || !customerEmail || !customerPhone) {
      toastError('Veuillez remplir tous les champs.')
      return
    }
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    const order = OrderAPI.create({
      shop_id: shop.id,
      shop_name: shop.name,
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      product_price: selectedProduct.price,
      total: selectedProduct.price,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      status: 'pending_payment',
      message: orderNote,
      pin_code: pin,
      payment_method: shop.mtn_number ? 'mtn' : 'orange',
    })

    if (selectedProduct.stock > 0) {
      ProductAPI.update(selectedProduct.id, { stock: selectedProduct.stock - 1 })
    }

    ChatAPI.create({
      order_id: order.id,
      sender_role: 'customer',
      sender_name: customerName,
      message: `Bonjour ${shop.name}, j'ai passé commande pour "${selectedProduct.name}" (${formatPrice(selectedProduct.price)}). Je vais effectuer le paiement Mobile Money.`,
    })
    NotificationAPI.create({
      shop_id: shop.id,
      title: `Nouvelle Commande #${order.id.slice(0, 8)}`,
      message: `${customerName} a commandé "${selectedProduct.name}". En attente de paiement.`,
      type: 'order',
      read: false,
    })
    setOrderModalOpen(false)
    toastSuccess('Commande créée !', 'Veuillez effectuer le paiement et envoyer la preuve.')
    navigate(`/orders?chat=${order.id}`)
  }

  if (!shop) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground">Boutique non trouvée</h2>
        <p className="text-muted-foreground mt-2">Cette boutique n'existe plus ou est temporairement indisponible.</p>
        <Link to="/" className="btn-primary inline-flex mt-6"><ArrowLeft className="w-4 h-4" /> Retour à la marketplace</Link>
      </div>
    )
  }

  const mapMarker: MapMarkerItem[] = shop.latitude && shop.longitude ? [{
    id: shop.id,
    title: shop.name,
    type: 'shop',
    latitude: shop.latitude,
    longitude: shop.longitude,
    subtitle: shop.city,
    image_url: shop.logo_url || shop.profile_image || shop.cover_image,
  }] : []

  return (
    <div className="min-h-screen pb-16 space-y-8">
      {/* Banner & Pro Header */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-primary to-amber-500 overflow-hidden">
        {shop.cover_image ? (
          <img src={shop.cover_image} alt={shop.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20 text-white font-black text-6xl select-none">
            {shop.name}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        <div className="absolute bottom-6 left-6 right-6 max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-card border-4 border-background flex items-center justify-center text-primary font-black text-3xl shadow-xl overflow-hidden shrink-0">
              {shop.profile_image ? <img src={shop.profile_image} alt={shop.name} className="w-full h-full object-cover" /> : shop.logo_url ? <img src={shop.logo_url} alt={shop.name} className="w-full h-full object-cover" /> : shop.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl md:text-4xl font-display font-extrabold">{shop.name}</h1>
                {shop.is_verified && (
                  <span className="badge-success bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <ShieldCheck className="w-3.5 h-3.5" /> Boutique Vérifiée
                  </span>
                )}
              </div>
              <p className="text-sm opacity-90 flex flex-wrap items-center gap-3 mt-1">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-amber-300" /> {shop.city} {shop.address ? `• ${shop.address}` : ''}</span>
                <span>•</span>
                <span className="font-semibold text-amber-300">{shop.category}</span>
                {shop.rating && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-4 h-4 fill-amber-400" /> {shop.rating} ({shop.reviews_count || 0} avis)
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <Button
              onClick={() => {
                const pin = Math.floor(1000 + Math.random() * 9000).toString()
                const firstProduct = products[0]
                const order = OrderAPI.create({
                  shop_id: shop.id,
                  shop_name: shop.name,
                  product_name: firstProduct ? firstProduct.name : `Demande générale - ${shop.name}`,
                  product_price: firstProduct ? firstProduct.price : 0,
                  total: firstProduct ? firstProduct.price : 0,
                  customer_name: user?.name || 'Client',
                  customer_email: user?.email || '',
                  customer_phone: user?.mtn_number || user?.orange_number || '',
                  status: 'pending_payment',
                  pin_code: pin,
                })

                ChatAPI.create({
                  order_id: order.id,
                  sender_role: 'customer',
                  sender_name: user?.name || 'Client',
                  message: `Bonjour ${shop.name}, je consulte votre boutique en ligne et souhaite échanger avec vous.`,
                })

                NotificationAPI.create({
                  shop_id: shop.id,
                  title: `Message Client sur votre Boutique`,
                  message: `${user?.name || 'Un client'} a ouvert une discussion sur le chat interne.`,
                  type: 'chat',
                  read: false,
                })

                toastSuccess('Chat plateforme ouvert !', 'La boutique recevra une notification système.')
                navigate(`/orders?chat=${order.id}`)
              }}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm flex items-center gap-2 transition-all shadow-lg"
            >
              <MessageSquare className="w-4 h-4" /> Contacter la Boutique sur le Chat Interne 💬
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 space-y-8">

        {/* Shopify-like info overview card */}
        <div className="card-glass p-6 grid md:grid-cols-4 gap-6">
          <div className="md:col-span-2 space-y-3">
            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" /> À propos de la boutique
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{shop.description}</p>
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground text-sm flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary" /> Horaires & Contact</p>
            <p className="text-emerald-500 font-medium">{shop.business_hours || 'Ouvert 6j/7 : 08h - 19h'}</p>
            <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" /> Tel: {shop.whatsapp_number}</p>
            {shop.mtn_number && <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> MTN MoMo: {shop.mtn_number}</p>}
            {shop.orange_number && <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500" /> Orange Money: {shop.orange_number}</p>}
          </div>

          <div className="space-y-2 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground text-sm flex items-center gap-1.5"><Truck className="w-4 h-4 text-primary" /> Garanties & Retours</p>
            <p className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> {shop.policies?.shipping || 'Livraison rapide en ville'}</p>
            <p className="flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 text-primary" /> {shop.policies?.returns || 'Satisfait ou remplacé'}</p>
            {shop.policies?.guarantee && <p className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> {shop.policies.guarantee}</p>}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border gap-6">
          <button
            onClick={() => setActiveTab('products')}
            className={cn("pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2", activeTab === 'products' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            <ShoppingBag className="w-4 h-4" /> Catalogue Produits ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={cn("pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2", activeTab === 'location' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
          >
            <Map className="w-4 h-4" /> Géolocalisation & Carte
          </button>
        </div>

        {activeTab === 'location' && (
          <div className="space-y-4">
            <h3 className="font-bold text-foreground text-lg">Emplacement exact sur la carte</h3>
            {shop.latitude && shop.longitude ? (
              <LeafletMap markers={mapMarker} center={[shop.latitude, shop.longitude]} zoom={14} height="400px" />
            ) : (
              <div className="p-8 text-center card-glass">
                <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">La position GPS exacte de cette boutique n'a pas encore été renseignée.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Search & Internal Categories */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Internal Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher dans cette boutique..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-card border border-border focus:border-primary focus:outline-none"
                />
              </div>

              {/* Internal Categories Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors",
                      selectedCategory === cat ? "bg-primary text-white" : "bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 card-glass">
                <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="font-semibold text-foreground">Aucun produit ne correspond à votre recherche.</p>
                <p className="text-xs text-muted-foreground mt-1">Essayez un autre mot-clé ou modifiez les filtres.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className="product-card group flex flex-col justify-between">
                    <div>
                      <div className="aspect-square overflow-hidden bg-muted rounded-t-2xl relative">
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {(product.images && product.images.length > 0) && (
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                            +{product.images.length} photo{product.images.length > 1 ? 's' : ''}
                          </span>
                        )}
                        <div className="absolute top-2 right-2">
                          {product.stock > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white shadow">
                              En stock ({product.stock})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/90 text-white shadow">
                              Rupture de stock
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 space-y-1">
                        <Link to={`/product/${product.id}`} className="font-semibold text-foreground text-sm line-clamp-2 hover:text-primary transition-colors">
                          {product.name}
                        </Link>
                        <p className="text-lg font-bold gradient-text">{formatPrice(product.price)}</p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
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
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Panier
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => openOrderModal(product)}
                        className="flex-1 bg-primary hover:bg-primary/90 text-white text-xs font-bold"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Commander directement
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comprehensive Direct Checkout Modal */}
      {selectedProduct && (
        <ProductCheckoutModal
          open={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          product={selectedProduct}
          shop={shop}
          quantity={1}
        />
      )}
    </div>
  )
}
