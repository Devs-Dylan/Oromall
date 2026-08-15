import { useState, useMemo } from 'react'
import { Plus, Edit3, Trash2, Eye, Filter, AlertCircle, CheckCircle, Search, Package, Sparkles } from 'lucide-react'
import type { Product, Shop } from '@/types'
import { ProductAPI } from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface SellerProductsTabProps {
  shop?: Shop
  products: Product[]
  onRefresh: () => void
}

export function SellerProductsTab({ shop, products, onRefresh }: SellerProductsTabProps) {
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'in_stock'>('all')

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form Fields
  const [pName, setPName] = useState('')
  const [pPrice, setPPrice] = useState('')
  const [pStock, setPStock] = useState('5')
  const [pDesc, setPDesc] = useState('')
  const [pCat, setPCat] = useState('Électronique')
  const [pCondition, setPCondition] = useState<any>('neuf')
  const [pImage, setPImage] = useState('')
  const [pColors, setPColors] = useState('')

  // Quick Stock Adjustments
  const handleAdjustStock = (productId: string, delta: number) => {
    const prod = products.find(p => p.id === productId)
    if (!prod) return
    const newStock = Math.max(0, (prod.stock || 0) + delta)
    ProductAPI.update(productId, { stock: newStock })
    toastSuccess(`Stock ajusté (${delta > 0 ? `+${delta}` : delta}) pour "${prod.name}" -> ${newStock} unités.`)
    onRefresh()
  }

  const openNewProductModal = () => {
    setEditingProduct(null)
    setPName('')
    setPPrice('')
    setPStock('5')
    setPDesc('')
    setPCat('Électronique')
    setPCondition('neuf')
    setPImage('')
    setPColors('Noir Sidéral, Argent / Blanc, Bleu Intense, Or Luxe')
    setProductModalOpen(true)
  }

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod)
    setPName(prod.name)
    setPPrice(String(prod.price))
    setPStock(String(prod.stock || 5))
    setPDesc(prod.description)
    setPCat(prod.category)
    setPCondition(prod.condition)
    setPImage(prod.image_url)
    setPColors(prod.colors ? prod.colors.map(c => c.name).join(', ') : '')
    setProductModalOpen(true)
  }

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pName || !pPrice) {
      toastError('Veuillez renseigner le nom et le prix du produit.')
      return
    }

    const parsedColors = pColors ? pColors.split(',').map(c => ({ name: c.trim(), image_url: pImage })).filter(c => Boolean(c.name)) : undefined

    if (editingProduct) {
      ProductAPI.update(editingProduct.id, {
        name: pName,
        price: Number(pPrice),
        stock: Number(pStock),
        description: pDesc,
        category: pCat,
        condition: pCondition,
        image_url: pImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        colors: parsedColors,
      })
      toastSuccess('Produit mis à jour dans le catalogue Shopify !')
    } else {
      ProductAPI.create({
        shop_id: shop?.id || 'shop-default',
        shop_name: shop?.name || 'Ma Boutique',
        name: pName,
        price: Number(pPrice),
        description: pDesc,
        category: pCat,
        condition: pCondition,
        image_url: pImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        stock: Number(pStock),
        status: 'active',
        colors: parsedColors,
      })
      toastSuccess('Nouveau produit ajouté au catalogue !')
    }

    setProductModalOpen(false)
    onRefresh()
  }

  const handleDeleteProduct = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir retirer ce produit du catalogue ?')) {
      ProductAPI.delete(id)
      toastSuccess('Produit retiré du catalogue.')
      onRefresh()
    }
  }

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false

      if (stockFilter === 'out') return p.stock === 0
      if (stockFilter === 'low') return p.stock > 0 && p.stock <= 3
      if (stockFilter === 'in_stock') return p.stock > 0
      return true
    })
  }, [products, search, stockFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Catalogue Produits Shopify ({products.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gérez vos articles, ajustez rapidement les stocks et mettez en ligne de nouvelles références.
          </p>
        </div>

        <Button onClick={openNewProductModal} className="flex items-center gap-1.5 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Nouveau Produit
        </Button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="card-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou catégorie..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'all', label: `Tous (${products.length})` },
            { id: 'in_stock', label: `En stock (${products.filter(p => p.stock > 0).length})` },
            { id: 'low', label: `Stock Faible ⚠️ (${products.filter(p => p.stock > 0 && p.stock <= 3).length})` },
            { id: 'out', label: `Rupture ❌ (${products.filter(p => p.stock === 0).length})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStockFilter(f.id as any)}
              className={cn(
                'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                stockFilter === f.id ? 'bg-primary text-white shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full card-glass p-12 text-center space-y-3">
            <Package className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucun produit ne correspond à ces critères.</p>
            <Button onClick={openNewProductModal} variant="outline" size="sm">Créer un produit</Button>
          </div>
        ) : (
          filteredProducts.map(prod => (
            <div key={prod.id} className="card-glass p-4 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all group">
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border/50">
                  <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-background/80 backdrop-blur-md text-[10px] font-bold text-foreground">
                    {prod.category}
                  </span>
                  
                  {/* Stock level badge */}
                  <span className={cn(
                    'absolute top-2 right-2 px-2.5 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md',
                    prod.stock === 0 ? 'bg-red-500/90 text-white' : prod.stock <= 3 ? 'bg-amber-500/90 text-white' : 'bg-emerald-500/90 text-white'
                  )}>
                    {prod.stock === 0 ? 'Rupture' : prod.stock <= 3 ? `Faible (${prod.stock})` : `${prod.stock} en stock`}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-foreground line-clamp-1">{prod.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{prod.description}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-emerald-400">{formatPrice(prod.price)}</span>
                  <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded capitalize">{prod.condition}</span>
                </div>

                {/* Quick Stock Controls (+1, +5, -1) */}
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded-xl border border-border/30">
                  <span className="text-[11px] font-bold text-muted-foreground">Ajustement rapide :</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAdjustStock(prod.id, -1)}
                      className="px-2 py-0.5 rounded-md bg-card border border-border text-xs font-bold hover:bg-muted text-red-400 transition-colors"
                      title="Diminuer stock de 1"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleAdjustStock(prod.id, 1)}
                      className="px-2 py-0.5 rounded-md bg-card border border-border text-xs font-bold hover:bg-muted text-emerald-400 transition-colors"
                      title="Ajouter 1 au stock"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleAdjustStock(prod.id, 5)}
                      className="px-2 py-0.5 rounded-md bg-card border border-border text-xs font-bold hover:bg-muted text-primary transition-colors"
                      title="Ajouter 5 au stock"
                    >
                      +5
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <Button onClick={() => openEditProductModal(prod)} variant="outline" size="sm" className="h-8 text-xs gap-1">
                    <Edit3 className="w-3.5 h-3.5" /> Éditer
                  </Button>
                  <Button onClick={() => handleDeleteProduct(prod.id)} variant="ghost" size="sm" className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit Shopify'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <Input
            label="Nom du produit"
            value={pName}
            onChange={(e) => setPName(e.target.value)}
            placeholder="Ex: Écouteurs Sans Fil Bluetooth"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Prix (FCFA)"
              type="number"
              value={pPrice}
              onChange={(e) => setPPrice(e.target.value)}
              placeholder="15000"
              required
            />
            <Input
              label="Stock disponible"
              type="number"
              value={pStock}
              onChange={(e) => setPStock(e.target.value)}
              placeholder="10"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Catégorie" value={pCat} onChange={(e) => setPCat(e.target.value)}>
              <option value="Électronique">Électronique</option>
              <option value="Mode">Mode</option>
              <option value="Maison">Maison</option>
              <option value="Beauté">Beauté</option>
              <option value="Sport">Sport</option>
              <option value="Alimentation">Alimentation</option>
              <option value="Livres">Livres</option>
            </Select>

            <Select label="État du produit" value={pCondition} onChange={(e) => setPCondition(e.target.value)}>
              <option value="neuf">Neuf sous emballage</option>
              <option value="tres_bon">Très bon état</option>
              <option value="bon">Bon état</option>
              <option value="correct">État correct</option>
            </Select>
          </div>

          <Input
            label="URL de la photo principale"
            value={pImage}
            onChange={(e) => setPImage(e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />

          <Input
            label="Variantes de Couleurs (séparées par une virgule)"
            value={pColors}
            onChange={(e) => setPColors(e.target.value)}
            placeholder="Ex: Noir Sidéral, Argent, Bleu Intense, Or Luxe"
          />

          <Textarea
            label="Description détaillée"
            value={pDesc}
            onChange={(e) => setPDesc(e.target.value)}
            placeholder="Caractéristique du produit, garanties, livraison..."
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setProductModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit">
              {editingProduct ? 'Enregistrer les modifications' : 'Publier le produit'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
