import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Trash2, ArrowRight, Home, MapPin, Calendar, Sparkles } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { useCart } from '@/hooks/useCart'
import { useWishlist } from '@/hooks/useWishlist'
import { toastSuccess } from '@/components/ui/Toast'

export default function WishlistPage() {
  const { addItem } = useCart()
  const { favoriteProducts, favoriteHousings, toggleProductFavorite, toggleHousingFavorite } = useWishlist()
  const [activeTab, setActiveTab] = useState<'products' | 'housing'>('products')

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* Header */}
      <div className="card-glass p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-red-500/10 via-card to-background border-red-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center font-bold shadow-lg">
            <Heart className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-extrabold text-foreground">Mes Favoris</h1>
            <p className="text-sm text-muted-foreground">Retrouvez tous vos coups de cœur enregistrés (produits & logements).</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('products')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === 'products' ? "bg-red-500 text-white shadow-md" : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <ShoppingBag className="w-4 h-4" /> Produits ({favoriteProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('housing')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              activeTab === 'housing' ? "bg-emerald-600 text-white shadow-md" : "bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            <Home className="w-4 h-4" /> Logements ({favoriteHousings.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Favorite Products */}
      {activeTab === 'products' && (
        <div>
          {favoriteProducts.length === 0 ? (
            <div className="text-center py-20 card-glass space-y-3">
              <Heart className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-bold text-foreground">Aucun produit favori</h3>
              <p className="text-xs text-muted-foreground">Explorez la marketplace et cliquez sur le cœur ❤️ pour sauvegarder vos articles.</p>
              <Link to="/" className="btn-primary inline-flex mt-4"><ArrowRight className="w-4 h-4" /> Parcourir les produits</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {favoriteProducts.map(product => (
                <div key={product.id} className="product-card group p-4 flex flex-col justify-between relative">
                  <div>
                    <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-3 relative">
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <button
                        onClick={() => toggleProductFavorite(product)}
                        className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-red-500 hover:scale-110 transition-transform shadow-md"
                        title="Retirer des favoris"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                    <span className="badge-primary text-[10px] mb-1">{product.category}</span>
                    <h3 className="font-bold text-foreground text-sm line-clamp-1">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.shop_name}</p>
                    <p className="text-lg font-bold gradient-text mt-1">{formatPrice(product.price)}</p>
                  </div>

                  <Button
                    size="sm"
                    className="w-full text-xs mt-4"
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
                    <ShoppingBag className="w-3.5 h-3.5" /> Ajouter au panier
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Favorite Housing */}
      {activeTab === 'housing' && (
        <div>
          {favoriteHousings.length === 0 ? (
            <div className="text-center py-20 card-glass space-y-3">
              <Home className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-bold text-foreground">Aucun logement favori</h3>
              <p className="text-xs text-muted-foreground">Consultez notre catalogue de logements et sauvegardez vos appartements préférés.</p>
              <Link to="/housing" className="btn-primary inline-flex mt-4"><ArrowRight className="w-4 h-4" /> Voir les logements</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favoriteHousings.map(housing => (
                <div key={housing.id} className="card-glass overflow-hidden group hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <img src={housing.image_url} alt={housing.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <button
                        onClick={() => toggleHousingFavorite(housing)}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/70 text-red-500 hover:scale-110 transition-transform shadow-md"
                        title="Retirer des favoris"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                      <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-white font-extrabold text-xs">
                        {formatPrice(housing.price)} <span className="text-[10px] text-amber-300">/ {housing.price_type === 'day' ? 'jour' : 'mois'}</span>
                      </div>
                    </div>

                    <div className="p-5 space-y-2">
                      <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {housing.city} • {housing.neighborhood}
                      </p>
                      <Link to={`/housing/${housing.id}`} className="font-bold text-foreground text-base line-clamp-2 hover:text-emerald-400">
                        {housing.title}
                      </Link>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <Link
                      to={`/housing/${housing.id}`}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center flex items-center justify-center gap-2"
                    >
                      Planifier une visite <Calendar className="w-3.5 h-3.5" />
                    </Link>
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
