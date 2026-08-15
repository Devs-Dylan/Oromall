import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, SlidersHorizontal, MapPin, Store, Sparkles,
  ShoppingBag, ArrowRight, Heart, CheckCircle, ShieldCheck
} from 'lucide-react'
import { ProductAPI, ShopAPI, WishlistAPI } from '@/lib/store'
import { CATEGORIES, CITIES_CAMEROON, CONDITION_LABELS } from '@/types'
import { formatPrice, cn, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { toastSuccess } from '@/components/ui/Toast'

export default function MarketplacePage() {
  const { addItem } = useCart()
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Toutes')
  const [selectedCity, setSelectedCity] = useState<string>('Toutes')
  const [viewMode, setViewMode] = useState<'products' | 'shops'>('products')
  const [sortOrder, setSortOrder] = useState<'newest' | 'price_asc' | 'price_desc'>('newest')
  const [, forceUpdate] = useState(0)

  const products = ProductAPI.filter(p => p.status === 'active')
  const shops = ShopAPI.filter(s => s.status === 'active')

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
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      const matchCat = selectedCategory === 'Toutes' || p.category === selectedCategory
      const shop = shops.find(s => s.id === p.shop_id)
      const matchCity = selectedCity === 'Toutes' || (shop && shop.city === selectedCity)
      return matchSearch && matchCat && matchCity
    }).sort((a, b) => {
      if (sortOrder === 'price_asc') return a.price - b.price
      if (sortOrder === 'price_desc') return b.price - a.price
      return new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
    })
  }, [products, shops, search, selectedCategory, selectedCity, sortOrder])

  // Filtered Shops
  const filteredShops = useMemo(() => {
    return shops.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase())
      const matchCat = selectedCategory === 'Toutes' || s.category === selectedCategory
      const matchCity = selectedCity === 'Toutes' || s.city === selectedCity
      return matchSearch && matchCat && matchCity
    })
  }, [shops, search, selectedCategory, selectedCity])

  return (
    <div className="min-h-screen space-y-12 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-primary/5 to-background border-b border-border py-16 px-4">
        <div className="max-w-7xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-xs uppercase tracking-wider animate-scale-in">
            <Sparkles className="w-4 h-4" /> La Marketplace Étudiante du Cameroun
          </div>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold text-foreground tracking-tight text-balance">
            Achetez, vendez & échangez près de <span className="gradient-text">votre campus</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto text-balance">
            Trouvez les meilleurs équipements, vêtements, livres et services vendus par des étudiants et des boutiques certifiées à Yaoundé, Douala et partout au Cameroun.
          </p>

          {/* Main Search Bar */}
          <div className="max-w-3xl mx-auto card-glass p-2 sm:p-3 shadow-xl flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center px-3 gap-2 border-b sm:border-b-0 sm:border-r border-border py-1">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Que recherchez-vous ? (ex: iPhone, Robe, Livre OHADA...)"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center px-3 gap-2 py-1">
              <MapPin className="w-4 h-4 text-primary" />
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer"
              >
                <option value="Toutes">Toutes les villes</option>
                {CITIES_CAMEROON.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <Button onClick={() => setViewMode('products')} className="px-6 py-3">
              Rechercher
            </Button>
          </div>

          {/* Quick stats pills */}
          <div className="pt-4 flex flex-wrap justify-center gap-6 text-xs sm:text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Paiements Mobile Money (MTN / Orange)</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Boutiques vérifiées</span>
            <span className="flex items-center gap-1.5"><Store className="w-4 h-4 text-accent" /> Remise en main propre possible</span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200',
                selectedCategory === cat
                  ? 'bg-primary text-white shadow-soft scale-105'
                  : 'bg-card text-muted-foreground border border-border hover:bg-muted hover:text-foreground'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filters Bar & View Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('products')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                viewMode === 'products' ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Produits ({filteredProducts.length})
            </button>
            <button
              onClick={() => setViewMode('shops')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                viewMode === 'shops' ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              Boutiques ({filteredShops.length})
            </button>
          </div>

          {viewMode === 'products' && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Trier par:
              </span>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as any)}
                className="bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-medium text-foreground focus:outline-none"
              >
                <option value="newest">Plus récents</option>
                <option value="price_asc">Prix: Croissant</option>
                <option value="price_desc">Prix: Décroissant</option>
              </select>
            </div>
          )}
        </div>

        {/* PRODUCTS VIEW */}
        {viewMode === 'products' && (
          filteredProducts.length === 0 ? (
            <div className="text-center py-16 card-glass">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">Aucun produit trouvé</h3>
              <p className="text-sm text-muted-foreground">Essayez de modifier vos critères de recherche ou filtres.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSearch(''); setSelectedCategory('Toutes'); setSelectedCity('Toutes') }}>
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => {
                const shop = shops.find(s => s.id === product.shop_id)
                const isFav = wishlist.has(product.id)

                return (
                  <div key={product.id} className="product-card group relative flex flex-col justify-between">
                    <div>
                      {/* Image container */}
                      <div className="relative aspect-square overflow-hidden bg-muted rounded-t-2xl">
                        <img
                          src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-3 left-3 flex flex-col gap-1">
                          <span className="badge-primary shadow-sm">{CONDITION_LABELS[product.condition]}</span>
                        </div>
                        <button
                          onClick={e => toggleWishlist(product.id, e)}
                          className={cn(
                            'absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-md',
                            isFav ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-black/60 text-muted-foreground hover:text-red-500'
                          )}
                        >
                          <Heart className={cn('w-4 h-4', isFav && 'fill-current')} />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium text-primary line-clamp-1">{product.shop_name}</span>
                          {shop && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-muted-foreground" />{shop.city}</span>}
                        </div>

                        <Link to={`/product/${product.id}`} className="block">
                          <h3 className="font-semibold text-foreground text-sm line-clamp-2 hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="flex items-baseline justify-between pt-1">
                          <span className="text-lg font-bold gradient-text">{formatPrice(product.price)}</span>
                          <span className="text-[11px] text-muted-foreground">{product.stock > 0 ? `${product.stock} en stock` : 'Rupture'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 pt-0 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs py-2"
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
                        <ShoppingBag className="w-3.5 h-3.5" /> Panier
                      </Button>

                      {shop?.whatsapp_number && (
                        <a
                          href={buildWhatsAppUrl(shop.whatsapp_number, `Bonjour ${shop.name}, je suis intéressé par votre article "${product.name}" (${formatPrice(product.price)}) sur MarchéPlus.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* SHOPS VIEW */}
        {viewMode === 'shops' && (
          filteredShops.length === 0 ? (
            <div className="text-center py-16 card-glass">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">Aucune boutique trouvée</h3>
              <p className="text-sm text-muted-foreground">Essayez d'ajuster votre ville ou catégorie.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredShops.map(shop => {
                const shopProducts = products.filter(p => p.shop_id === shop.id)
                return (
                  <div key={shop.id} className="card-glass p-6 space-y-4 hover:border-primary/40 transition-all group">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-md">
                        {shop.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-base truncate group-hover:text-primary transition-colors">
                            {shop.name}
                          </h3>
                          <span className="badge-success text-[10px]">Active</span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-primary" /> {shop.city} • <span className="font-medium text-foreground">{shop.category}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{shop.description}</p>
                      </div>
                    </div>

                    <div className="border-t border-border pt-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{shopProducts.length} produit{shopProducts.length > 1 ? 's' : ''} disponible{shopProducts.length > 1 ? 's' : ''}</span>
                      <Link to={`/shop/${shop.id}`} className="text-primary font-semibold hover:underline flex items-center gap-1">
                        Visiter la boutique <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
