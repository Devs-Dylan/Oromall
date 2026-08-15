import { useState, useMemo } from 'react'
import { Package, Star, Trash2, Search, Filter, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react'
import type { Product } from '@/types'
import { ProductAPI, AuditLogAPI } from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

interface AdminProductsTabProps {
  products: Product[]
  adminName?: string
  onRefresh: () => void
}

export function AdminProductsTab({ products, adminName = 'SuperAdmin', onRefresh }: AdminProductsTabProps) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const handleToggleFeatured = (prod: Product) => {
    const nextFeatured = !prod.is_featured
    ProductAPI.update(prod.id, { is_featured: nextFeatured })

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: `${nextFeatured ? 'Mise en Vedette 🌟' : 'Retrait Vedette'} Produit`,
      details: `Produit : ${prod.name} (Boutique: ${prod.shop_name})`,
      severity: 'info'
    })

    toastSuccess(`Produit ${prod.name} ${nextFeatured ? 'mis en vedette 🌟 sur l\'accueil' : 'retiré des vedettes'}`)
    onRefresh()
  }

  const handleDeleteProduct = (prod: Product) => {
    if (confirm(`Modérer et supprimer définitivement le produit "${prod.name}" ?`)) {
      ProductAPI.delete(prod.id)

      AuditLogAPI.create({
        timestamp: new Date().toISOString(),
        admin_name: adminName,
        action: 'Modération & Suppression Produit',
        details: `Produit : ${prod.name} (Boutique: ${prod.shop_name})`,
        severity: 'warning'
      })

      toastSuccess(`Produit "${prod.name}" supprimé et archivé par l'administrateur.`)
      onRefresh()
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.shop_name.toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false

      if (categoryFilter === 'featured') return p.is_featured
      if (categoryFilter !== 'all') return p.category.toLowerCase() === categoryFilter.toLowerCase()
      return true
    })
  }, [products, search, categoryFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" /> Modération Produits & Mise en Vedette 🌟 ({products.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sélectionnez les articles à afficher en vedette sur la page d'accueil et modérez les annonces non conformes.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par produit ou nom de boutique..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'all', label: `Tous (${products.length})` },
            { id: 'featured', label: `En Vedette 🌟 (${products.filter(p => p.is_featured).length})` },
            { id: 'électronique', label: 'Électronique' },
            { id: 'mode', label: 'Mode' },
            { id: 'alimentation', label: 'Alimentation' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setCategoryFilter(f.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                categoryFilter === f.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full card-glass p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucun produit trouvé.</p>
          </div>
        ) : (
          filteredProducts.map(prod => (
            <div key={prod.id} className="card-glass p-4 flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all group">
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border/50">
                  <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  
                  {prod.is_featured && (
                    <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md bg-amber-500 text-black font-extrabold text-[10px] shadow">
                      🌟 EN VEDETTE
                    </span>
                  )}

                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-md text-[10px] font-bold text-foreground">
                    Stock: {prod.stock}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-foreground line-clamp-1">{prod.name}</h3>
                  <p className="text-xs text-primary font-semibold truncate mt-0.5">Boutique: {prod.shop_name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{prod.description}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-emerald-400">{formatPrice(prod.price)}</span>
                  <span className="text-[10px] bg-muted px-2 py-0.5 rounded capitalize text-muted-foreground">{prod.condition}</span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button
                    onClick={() => handleToggleFeatured(prod)}
                    variant="outline"
                    size="sm"
                    className={cn(
                      'text-xs flex-1 gap-1',
                      prod.is_featured ? 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10' : 'border-blue-500/40 text-blue-400 hover:bg-blue-500/10'
                    )}
                  >
                    <Star className="w-3.5 h-3.5" />
                    {prod.is_featured ? 'Retirer Vedette' : 'Mettre en Vedette 🌟'}
                  </Button>

                  <Button
                    onClick={() => handleDeleteProduct(prod)}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-400 hover:bg-red-500/10"
                    title="Supprimer / Modérer ce produit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
