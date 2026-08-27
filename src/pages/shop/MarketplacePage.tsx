import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, SlidersHorizontal, MapPin, Store,
  ShoppingBag, ArrowRight, Heart, CheckCircle2, ShieldCheck,
  Package, Star, Truck, Building2, Tag, ChevronRight, X
} from 'lucide-react'
import { ProductAPI, ShopAPI, WishlistAPI, OrderAPI, ChatAPI, NotificationAPI, AdAPI } from '@/lib/store'
import { CATEGORIES, CITIES_CAMEROON, CONDITION_LABELS, type Product, type Advertisement } from '@/types'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { ChevronLeft, ChevronRight as ChevronRightIcon, Megaphone, Sparkles } from 'lucide-react'
import { SmartSearchBar } from '@/components/shared/SmartSearchBar'
import { ProductCheckoutModal } from '@/components/product/ProductCheckoutModal'

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1600&auto=format&fit=crop&q=80',
    title: 'Étudiants & Campus Universitaires au Cameroun',
    badge: 'COMMUNAUTÉ ÉTUDIANTE 🎓',
  },
  {
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1600&auto=format&fit=crop&q=80',
    title: 'Logements, Studios & Résidences à Bastos et Douala',
    badge: 'LOGEMENTS VÉRIFIÉS 🏠',
  },
  {
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
    title: 'Boutiques & Vendeurs Locaux Certifiés',
    badge: 'SHOPPING & HIGH-TECH 🛍️',
  },
  {
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&auto=format&fit=crop&q=80',
    title: 'Studios Meublés & Chambres Prêtes à Habiter',
    badge: 'CONFORT & SÉCURITÉ 🛋️',
  },
  {
    image: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1600&auto=format&fit=crop&q=80',
    title: 'Paiements Instantanés MTN MoMo & Orange Money',
    badge: 'TRANSACTIONS SÉCURISÉES 💳',
  },
]

export default function MarketplacePage() {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes')
  const [selectedCity, setSelectedCity] = useState<string>('Toutes')
  const [viewMode, setViewMode] = useState<'products' | 'shops'>('products')
  const [sortOrder, setSortOrder] = useState<'newest' | 'price_asc' | 'price_desc'>('newest')
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000000 })
  const [visibleCount, setVisibleCount] = useState(12)
  const [currentSlide, setCurrentHeroSlide] = useState(0)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroSlide(prev => (prev + 1) % HERO_SLIDES.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setVisibleCount(12)
  }, [debouncedSearch, selectedCategory, selectedCity, sortOrder, priceRange, viewMode])

  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [customerName, setCustomerName] = useState(user?.name || '')
  const [customerEmail, setCustomerEmail] = useState(user?.email || '')
  const [customerPhone, setCustomerPhone] = useState('')
  const [orderNote, setOrderNote] = useState('')

  const products = ProductAPI.filter(p => p.status === 'active')
  const shops = ShopAPI.filter(s => s.status === 'active')
  const activeAds = AdAPI.filter(a => a.status === 'active')
  const middleAd = activeAds.find(a => a.position === 'marketplace_middle' || a.position === 'hero')

  // Wishlist set
  const wishlist = useMemo(() => {
    if (!user) return new Set<string>()
    return new Set(WishlistAPI.filter(w => w.user_id === user.id).map(w => w.product_id))
  }, [user])

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toastSuccess('Connexion requise', 'Connectez-vous pour ajouter des favoris.')
      return
    }
    const existing = WishlistAPI.filter(w => w.user_id === user.id && w.product_id === productId)[0]
    if (existing) {
      WishlistAPI.delete(existing.id)
      toastSuccess('Retiré des favoris')
    } else {
      WishlistAPI.create({ user_id: user.id, product_id: productId })
      toastSuccess('Ajouté aux favoris !')
    }
    forceUpdate(n => n + 1)
  }

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const query = debouncedSearch.toLowerCase().trim()
      const matchSearch = !query ||
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.brand || '').toLowerCase().includes(query)
      const matchCat = selectedCategory === 'Toutes' || p.category === selectedCategory
      const shop = shops.find(s => s.id === p.shop_id)
      const matchCity = selectedCity === 'Toutes' || (shop && shop.city === selectedCity)
      const matchPrice = p.price >= priceRange.min && p.price <= priceRange.max
      return matchSearch && matchCat && matchCity && matchPrice
    }).sort((a, b) => {
      if (sortOrder === 'price_asc') return a.price - b.price
      if (sortOrder === 'price_desc') return b.price - a.price
      return new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
    })
  }, [products, shops, debouncedSearch, selectedCategory, selectedCity, sortOrder, priceRange])

  const visibleProducts = useMemo(() => filteredProducts.slice(0, visibleCount), [filteredProducts, visibleCount])
  const hasMoreProducts = visibleCount < filteredProducts.length

  // Filtered Shops
  const filteredShops = useMemo(() => {
    return shops.filter(s => {
      const query = debouncedSearch.toLowerCase().trim()
      const matchSearch = !query ||
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      const matchCat = selectedCategory === 'Toutes' || s.category === selectedCategory
      const matchCity = selectedCity === 'Toutes' || s.city === selectedCity
      return matchSearch && matchCat && matchCity
    })
  }, [shops, debouncedSearch, selectedCategory, selectedCity])

  const openOrderModal = (product: Product) => {
    if (!user) {
      toastError('Connexion requise', 'Connectez-vous pour commander cet article.')
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
    if (!selectedProduct || !customerName || !customerEmail || !customerPhone) {
      toastError('Veuillez renseigner votre nom, email et téléphone.')
      return
    }
    const shop = ShopAPI.get(selectedProduct.shop_id)
    const pin = Math.floor(1000 + Math.random() * 9000).toString()
    const order = OrderAPI.create({
      shop_id: selectedProduct.shop_id,
      shop_name: selectedProduct.shop_name,
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
      payment_method: shop?.mtn_number ? 'mtn' : 'orange',
    })

    if (selectedProduct.stock > 0) {
      ProductAPI.update(selectedProduct.id, { stock: selectedProduct.stock - 1 })
    }

    ChatAPI.create({
      order_id: order.id,
      sender_role: 'customer',
      sender_name: customerName,
      message: `Bonjour ${selectedProduct.shop_name}, j'ai passé commande pour "${selectedProduct.name}" (${formatPrice(selectedProduct.price)}). Je procède au paiement Mobile Money.`,
    })
    NotificationAPI.create({
      shop_id: selectedProduct.shop_id,
      title: `Nouvelle Commande #${order.id.slice(0, 8)}`,
      message: `${customerName} a commandé "${selectedProduct.name}".`,
      type: 'order',
      read: false,
    })
    setOrderModalOpen(false)
    toastSuccess('Commande validée !', 'Effectuez votre paiement Mobile Money sécurisé.')
    navigate(`/orders?chat=${order.id}`)
  }

  return (
    <div className="min-h-screen space-y-8 pb-16">
      {/* Interactive 5-Image Background Carousel Hero */}
      <section className="relative overflow-hidden border-b border-border/70 min-h-[460px] flex items-center justify-center py-12 px-4 sm:px-6">
        {/* Background Images Carousel with smooth crossfade */}
        {HERO_SLIDES.map((slide, idx) => (
          <div
            key={idx}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              currentSlide === idx ? "opacity-100 scale-105" : "opacity-0 scale-100 pointer-events-none"
            )}
            style={{ transitionProperty: 'opacity, transform', transitionDuration: '1000ms' }}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
          </div>
        ))}

        {/* Deep Luxury Dark & Gold Overlays for Perfect Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-black/70 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-background/40 to-background" />

        {/* Carousel Navigation Arrows */}
        <button
          type="button"
          onClick={() => setCurrentHeroSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white/90 backdrop-blur-md transition-all z-20 hidden sm:flex items-center justify-center border border-white/10"
          title="Image précédente"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setCurrentHeroSlide(prev => (prev + 1) % HERO_SLIDES.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/70 text-white/90 backdrop-blur-md transition-all z-20 hidden sm:flex items-center justify-center border border-white/10"
          title="Image suivante"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>

        {/* Hero Content Box */}
        <div className="max-w-5xl mx-auto text-center space-y-5 relative z-10">
          {/* Current slide badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-card/90 border border-primary/40 text-xs font-bold text-primary shadow-lg backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            {HERO_SLIDES[currentSlide].badge} • {HERO_SLIDES[currentSlide].title}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground text-balance drop-shadow-sm">
            Trouvez des produits & des logements près de vous
          </h1>

          <p className="text-muted-foreground text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed text-balance">
            Achetez auprès de vendeurs locaux et découvrez des logements étudiants vérifiés à Yaoundé, Douala, Buea, Dschang et partout au Cameroun.
          </p>

          {/* Unified AI-Powered Smart Search & Discovery Bar */}
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-2">
            <div className="flex-1 w-full">
              <SmartSearchBar
                variant="hero"
                placeholder="Recherche intelligente (ex: iPhone, Studio Bastos, PC, ESTLC, etc.)..."
              />
            </div>

            <div className="flex items-center px-3 py-2 bg-card/95 backdrop-blur-md rounded-2xl border border-border/90 shadow-lg w-full sm:w-auto flex-shrink-0">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0 mr-1.5" />
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer w-full"
              >
                <option value="Toutes">Toutes les villes ({CITIES_CAMEROON.length})</option>
                {CITIES_CAMEROON.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Key Value Badges */}
          <div className="pt-2 flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5 bg-card/60 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-border/40">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> MTN Mobile Money
            </span>
            <span className="flex items-center gap-1.5 bg-card/60 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-border/40">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> Orange Money
            </span>
            <span className="flex items-center gap-1.5 bg-card/60 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-border/40">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Bailleurs & Vendeurs certifiés
            </span>
            <span className="flex items-center gap-1.5 bg-card/60 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-border/40">
              <Truck className="w-3.5 h-3.5 text-blue-500" /> Livraison locale
            </span>
          </div>

          {/* Carousel Slide Indicators */}
          <div className="pt-2 flex items-center justify-center gap-1.5 z-20">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentHeroSlide(idx)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  currentSlide === idx ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                )}
                title={`Aller à l'image ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 space-y-6">
        {/* Category Horizontal Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border',
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                )}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Real Admin Sponsored Advertisement Banner */}
        {middleAd && (
          <div className="rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-r from-card via-card to-primary/10 p-4 sm:p-5 relative group shadow-md">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
              <div className="space-y-1.5 max-w-xl text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black uppercase">
                  <Megaphone className="w-3 h-3" /> {middleAd.badge || 'Annonce Sponsorisée'}
                </div>
                <h3 className="text-base sm:text-xl font-black text-foreground">{middleAd.title}</h3>
                {middleAd.subtitle && <p className="text-xs text-muted-foreground">{middleAd.subtitle}</p>}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {middleAd.image_url && (
                  <img
                    src={middleAd.image_url}
                    alt={middleAd.title}
                    className="w-20 h-16 sm:w-28 sm:h-18 object-cover rounded-xl border border-border shadow-sm"
                  />
                )}
                {middleAd.link_url && (
                  <Link
                    to={middleAd.link_url}
                    onClick={() => {
                      AdAPI.update(middleAd.id, { clicks_count: (middleAd.clicks_count || 0) + 1 })
                    }}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-black font-extrabold text-xs shadow-md transition-transform hover:scale-105 whitespace-nowrap flex items-center gap-1"
                  >
                    {middleAd.cta_text || 'Découvrir'} <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toolbar Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2 border-b border-border/70 pb-4">
          <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border/40">
            <button
              onClick={() => setViewMode('products')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                viewMode === 'products'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Articles ({filteredProducts.length})
            </button>
            <button
              onClick={() => setViewMode('shops')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                viewMode === 'shops'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Boutiques ({filteredShops.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs">
            {viewMode === 'products' && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Budget :</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min || ''}
                  onChange={e => setPriceRange(r => ({ ...r, min: Number(e.target.value) }))}
                  className="w-20 px-2 py-1 rounded-lg bg-card border border-border text-xs focus:border-primary focus:outline-none"
                />
                <span className="text-muted-foreground">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max || ''}
                  onChange={e => setPriceRange(r => ({ ...r, max: Number(e.target.value) }))}
                  className="w-24 px-2 py-1 rounded-lg bg-card border border-border text-xs focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {viewMode === 'products' && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" /> Tri :
                </span>
                <select
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value as any)}
                  className="bg-card border border-border rounded-lg px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="newest">Plus récents</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* PRODUCTS VIEW */}
        {viewMode === 'products' && (
          filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border p-8 space-y-4">
              <Package className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">Aucun article ne correspond à votre recherche</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Modifiez vos mots-clés ou réinitialisez les filtres pour découvrir tout le catalogue.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setSelectedCategory('Toutes')
                  setSelectedCity('Toutes')
                  setPriceRange({ min: 0, max: 1000000 })
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
                {visibleProducts.map(product => {
                  const shop = shops.find(s => s.id === product.shop_id)
                  const isFav = wishlist.has(product.id)
                  const isNew = (Date.now() - new Date(product.created_date).getTime()) < 7 * 24 * 60 * 60 * 1000

                  return (
                    <div
                      key={product.id}
                      className="product-card group relative flex flex-col justify-between"
                    >
                      <div>
                        {/* Image Container */}
                        <div className="relative aspect-square overflow-hidden bg-muted/30">
                          <img
                            src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />

                          {/* Condition & New Badges */}
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                            <span className="px-2 py-0.5 rounded-md bg-background/90 backdrop-blur-md text-[10px] font-bold text-foreground border border-border/40 shadow-xs">
                              {CONDITION_LABELS[product.condition]}
                            </span>
                            {product.is_featured && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-black text-[10px] font-black shadow-xs flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-black" /> Vedette
                              </span>
                            )}
                          </div>

                          {/* Wishlist Button */}
                          <button
                            onClick={e => toggleWishlist(product.id, e)}
                            className={cn(
                              'absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition-all shadow-xs',
                              isFav
                                ? 'bg-red-500 text-white'
                                : 'bg-background/80 hover:bg-background text-muted-foreground hover:text-red-500'
                            )}
                            title="Ajouter aux favoris"
                          >
                            <Heart className={cn('w-3.5 h-3.5', isFav && 'fill-current')} />
                          </button>
                        </div>

                        {/* Card Info */}
                        <div className="p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="font-semibold text-primary truncate max-w-[120px]">{product.shop_name}</span>
                            {shop && (
                              <span className="flex items-center gap-0.5 truncate">
                                <MapPin className="w-2.5 h-2.5" /> {shop.city}
                              </span>
                            )}
                          </div>

                          <Link to={`/product/${product.id}`} className="block">
                            <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
                              {product.name}
                            </h3>
                          </Link>

                          {/* Price & Compare-at */}
                          <div className="pt-1 flex items-baseline justify-between gap-1">
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-sm sm:text-base font-extrabold text-foreground">
                                {formatPrice(product.price)}
                              </span>
                              {product.compare_at_price && product.compare_at_price > product.price && (
                                <span className="text-[11px] text-muted-foreground line-through font-medium">
                                  {formatPrice(product.compare_at_price)}
                                </span>
                              )}
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded",
                              product.stock > 0 ? "text-emerald-600 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
                            )}>
                              {product.stock > 0 ? `${product.stock} dispo` : 'Rupture'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="p-3.5 pt-0 flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs h-8 px-2"
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
                            toastSuccess('Ajouté au panier !', product.name)
                          }}
                        >
                          <ShoppingBag className="w-3 h-3" /> Panier
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => openOrderModal(product)}
                          className="flex-1 text-xs h-8 px-2 bg-primary hover:bg-primary/90 text-white font-bold"
                        >
                          Commander directement
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {hasMoreProducts && (
                <div className="flex justify-center pt-6">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount(c => c + 12)}
                    className="text-xs font-semibold gap-1.5"
                  >
                    Afficher plus d'articles <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </>
          )
        )}

        {/* SHOPS VIEW */}
        {viewMode === 'shops' && (
          filteredShops.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border p-8 space-y-4">
              <Store className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">Aucune boutique trouvée</h3>
              <p className="text-xs text-muted-foreground">Essayez d'ajuster votre ville ou catégorie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredShops.map(shop => {
                const shopProducts = products.filter(p => p.shop_id === shop.id)
                return (
                  <div
                    key={shop.id}
                    className="card-glass p-5 flex flex-col justify-between space-y-4 rounded-2xl hover:border-primary/40 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-sm flex-shrink-0">
                          {shop.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/shop/${shop.id}`} className="hover:text-primary transition-colors">
                            <h3 className="font-bold text-sm text-foreground truncate">{shop.name}</h3>
                          </Link>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-primary" /> {shop.city}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">{shop.description || 'Boutique certifiée sur MarchéPlus.'}</p>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/50">
                        <span className="font-semibold text-foreground">{shopProducts.length} articles</span>
                        <span>•</span>
                        <span className="text-emerald-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Certifié
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/shop/${shop.id}`}
                      className="w-full py-2 rounded-xl border border-border text-center text-xs font-bold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1"
                    >
                      Visiter la vitrine <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {/* Comprehensive Direct Checkout Modal */}
      {selectedProduct && (
        <ProductCheckoutModal
          open={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          product={selectedProduct}
          shop={ShopAPI.get(selectedProduct.shop_id)}
          quantity={1}
        />
      )}
    </div>
  )
}
