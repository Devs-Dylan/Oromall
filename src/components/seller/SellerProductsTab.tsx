import { useState, useMemo } from 'react'
import {
  Plus, Edit3, Trash2, Eye, Filter, AlertCircle, CheckCircle,
  Search, Package, Sparkles, Copy, Tag, DollarSign, Layers,
  Check, ArrowUpDown, Star, ShieldCheck, Phone
} from 'lucide-react'
import type { Product, Shop } from '@/types'
import { ProductAPI } from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { MultiImageUploadField } from '@/components/ui/MultiImageUploadField'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface SellerProductsTabProps {
  shop?: Shop
  products: Product[]
  onRefresh: () => void
}

export function SellerProductsTab({ shop, products, onRefresh }: SellerProductsTabProps) {
  const [search, setSearch] = useState('')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'in_stock'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Modals state
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form Fields (Shopify-like)
  const [pName, setPName] = useState('')
  const [pPrice, setPPrice] = useState('')
  const [pComparePrice, setPComparePrice] = useState('')
  const [pStock, setPStock] = useState('10')
  const [pSku, setPSku] = useState('')
  const [pBrand, setPBrand] = useState('')
  const [pTags, setPTags] = useState('')
  const [pDesc, setPDesc] = useState('')
  const [pCat, setPCat] = useState('Électronique')
  const [pCondition, setPCondition] = useState<any>('neuf')
  const [pStatus, setPStatus] = useState<any>('active')
  const [pIsFeatured, setPIsFeatured] = useState(false)
  const [pWhatsappOverride, setPWhatsappOverride] = useState('')
  const [pImages, setPImages] = useState<string[]>([])
  const [pColors, setPColors] = useState('')

  // KPIs
  const totalStockCount = useMemo(() => products.reduce((s, p) => s + (p.stock || 0), 0), [products])
  const totalInventoryValue = useMemo(() => products.reduce((s, p) => s + ((p.price || 0) * (p.stock || 0)), 0), [products])
  const lowStockCount = useMemo(() => products.filter(p => p.stock > 0 && p.stock <= 3).length, [products])
  const outOfStockCount = useMemo(() => products.filter(p => p.stock === 0).length, [products])

  // Quick Stock Adjustments
  const handleAdjustStock = (productId: string, delta: number) => {
    const prod = products.find(p => p.id === productId)
    if (!prod) return
    const newStock = Math.max(0, (prod.stock || 0) + delta)
    ProductAPI.update(productId, { stock: newStock })
    toastSuccess(`Stock ajusté (${delta > 0 ? `+${delta}` : delta}) pour "${prod.name}" -> ${newStock} unités.`)
    onRefresh()
  }

  const handleToggleFeatured = (prod: Product) => {
    const nextFeatured = !prod.is_featured
    ProductAPI.update(prod.id, { is_featured: nextFeatured })
    toastSuccess(`Produit ${nextFeatured ? 'mis en avant ⭐' : 'retiré des vedettes'}`)
    onRefresh()
  }

  const openNewProductModal = () => {
    setEditingProduct(null)
    setPName('')
    setPPrice('')
    setPComparePrice('')
    setPStock('10')
    setPSku(`SKU-${Math.floor(1000 + Math.random() * 9000)}`)
    setPBrand(shop?.name || '')
    setPTags('Nouveauté, Populaire')
    setPDesc('')
    setPCat('Électronique')
    setPCondition('neuf')
    setPStatus('active')
    setPIsFeatured(false)
    setPWhatsappOverride(shop?.whatsapp || '')
    setPImages([])
    setPColors('Noir Sidéral, Argent / Blanc, Bleu Intense, Or Luxe')
    setProductModalOpen(true)
  }

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod)
    setPName(prod.name)
    setPPrice(String(prod.price))
    setPComparePrice(prod.compare_at_price ? String(prod.compare_at_price) : '')
    setPStock(String(prod.stock ?? 10))
    setPSku(prod.sku || `SKU-${prod.id.slice(0, 6).toUpperCase()}`)
    setPBrand(prod.brand || prod.shop_name || '')
    setPTags(prod.tags ? prod.tags.join(', ') : '')
    setPDesc(prod.description)
    setPCat(prod.category)
    setPCondition(prod.condition)
    setPStatus(prod.status || 'active')
    setPIsFeatured(!!prod.is_featured)
    setPWhatsappOverride(prod.whatsapp_number || '')
    setPImages(prod.images && prod.images.length > 0 ? [prod.image_url, ...prod.images] : (prod.image_url ? [prod.image_url] : []))
    setPColors(prod.colors ? prod.colors.map(c => c.name).join(', ') : '')
    setProductModalOpen(true)
  }

  // DUPLICATION DE PRODUIT (1-Clic Immédiat)
  const handleDuplicateProduct = (prod: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    const baseName = prod.name.replace(/\s*\(Copie\s*\d*\)/gi, '').trim()
    const existingCopies = products.filter(p => p.name.startsWith(baseName)).length
    const copyTitle = `${baseName} (Copie ${existingCopies + 1})`

    ProductAPI.create({
      shop_id: prod.shop_id || shop?.id || 'shop-default',
      shop_name: prod.shop_name || shop?.name || 'Ma Boutique',
      name: copyTitle,
      price: prod.price,
      compare_at_price: prod.compare_at_price,
      stock: prod.stock ?? 10,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      brand: prod.brand || prod.shop_name,
      tags: prod.tags || ['Nouveauté'],
      description: prod.description,
      category: prod.category,
      condition: prod.condition,
      status: 'active',
      is_featured: false,
      whatsapp_number: prod.whatsapp_number || shop?.whatsapp,
      image_url: prod.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      images: prod.images || [],
      colors: prod.colors,
    })

    toastSuccess(`Produit "${copyTitle}" dupliqué en 1 clic ! 🛍️✨`)
    onRefresh()
  }

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pName || !pPrice) {
      toastError('Veuillez renseigner le nom et le prix du produit.')
      return
    }

    const mainImage = pImages[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'
    const secondaryImages = pImages.slice(1)
    const parsedColors = pColors
      ? pColors.split(',').map(c => ({ name: c.trim(), image_url: mainImage })).filter(c => Boolean(c.name))
      : undefined
    const parsedTags = pTags
      ? pTags.split(',').map(t => t.trim()).filter(Boolean)
      : undefined

    const payload = {
      shop_id: shop?.id || 'shop-default',
      shop_name: shop?.name || 'Ma Boutique',
      name: pName,
      price: Number(pPrice),
      compare_at_price: pComparePrice ? Number(pComparePrice) : undefined,
      stock: Number(pStock) || 0,
      sku: pSku || undefined,
      brand: pBrand || undefined,
      tags: parsedTags,
      description: pDesc,
      category: pCat,
      condition: pCondition,
      status: pStatus,
      is_featured: pIsFeatured,
      whatsapp_number: pWhatsappOverride || undefined,
      image_url: mainImage,
      images: secondaryImages,
      colors: parsedColors,
    }

    if (editingProduct) {
      ProductAPI.update(editingProduct.id, payload)
      toastSuccess('Produit mis à jour dans votre catalogue ! 🛍️')
    } else {
      ProductAPI.create(payload)
      toastSuccess('Nouveau produit publié sur votre boutique ! 🚀')
    }

    setProductModalOpen(false)
    setPImages([])
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
      const query = search.toLowerCase()
      const matchesSearch = p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.sku || '').toLowerCase().includes(query) ||
        (p.brand || '').toLowerCase().includes(query)

      if (!matchesSearch) return false

      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false

      if (stockFilter === 'out') return p.stock === 0
      if (stockFilter === 'low') return p.stock > 0 && p.stock <= 3
      if (stockFilter === 'in_stock') return p.stock > 0
      return true
    })
  }, [products, search, stockFilter, categoryFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Gestion des Articles & Inventaire ({products.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Éditez vos fiches produits, dupliquez des variantes, gérez les stocks et créez des promotions Shopify.
          </p>
        </div>

        <Button onClick={openNewProductModal} className="flex items-center gap-1.5 shadow-lg shadow-primary/20 text-xs font-bold">
          <Plus className="w-4 h-4" /> Ajouter un Produit
        </Button>
      </div>

      {/* KPI Inventory Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-glass p-3.5 rounded-2xl border border-border/80">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Total Articles</span>
          <span className="text-2xl font-black text-foreground mt-1 block">{products.length}</span>
          <span className="text-[10px] text-muted-foreground">{totalStockCount} unités en stock</span>
        </div>

        <div className="card-glass p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Valeur Inventaire
          </span>
          <span className="text-lg font-black text-emerald-400 mt-1 block truncate" title={formatPrice(totalInventoryValue)}>
            {formatPrice(totalInventoryValue)}
          </span>
          <span className="text-[10px] text-muted-foreground">Valeur marchande</span>
        </div>

        <div className="card-glass p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Stock Faible
          </span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">{lowStockCount}</span>
          <span className="text-[10px] text-muted-foreground">1 à 3 unités restantes</span>
        </div>

        <div className="card-glass p-3.5 rounded-2xl border border-red-500/30 bg-red-500/5">
          <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider block flex items-center gap-1">
            <Package className="w-3 h-3" /> Ruptures
          </span>
          <span className="text-2xl font-black text-red-400 mt-1 block">{outOfStockCount}</span>
          <span className="text-[10px] text-muted-foreground">À réapprovisionner</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="card-glass p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, SKU, marque, catégorie..."
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
      </div>

      {/* Product List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full card-glass p-12 text-center space-y-3 rounded-2xl">
            <Package className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-bold text-foreground">Aucun produit trouvé</p>
            <p className="text-xs text-muted-foreground">Créez votre premier article ou ajustez vos critères de recherche.</p>
            <Button onClick={openNewProductModal} size="sm">Créer un produit</Button>
          </div>
        ) : (
          filteredProducts.map(prod => (
            <div key={prod.id} className="card-glass p-4 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all rounded-2xl group">
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border/50">
                  <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-background/85 backdrop-blur-md text-[10px] font-bold text-foreground">
                    {prod.category}
                  </span>

                  {prod.is_featured && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-amber-500 text-black text-[10px] font-black flex items-center gap-0.5 shadow">
                      <Star className="w-3 h-3 fill-black" /> En Vedette
                    </span>
                  )}
                  
                  {/* Stock level badge */}
                  <span className={cn(
                    'absolute top-2 right-2 px-2.5 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md',
                    prod.stock === 0 ? 'bg-red-500/90 text-white' : prod.stock <= 3 ? 'bg-amber-500/90 text-white' : 'bg-emerald-500/90 text-white'
                  )}>
                    {prod.stock === 0 ? 'Rupture' : prod.stock <= 3 ? `Faible (${prod.stock})` : `${prod.stock} en stock`}
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{prod.name}</h3>
                    {prod.sku && (
                      <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                        {prod.sku}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{prod.description}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-emerald-400">{formatPrice(prod.price)}</span>
                    {prod.compare_at_price && prod.compare_at_price > prod.price && (
                      <span className="text-xs text-muted-foreground line-through font-semibold">
                        {formatPrice(prod.compare_at_price)}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded capitalize font-medium">{prod.condition}</span>
                </div>

                {/* Quick Stock Controls (+1, +5, -1, -5) */}
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded-xl border border-border/30">
                  <span className="text-[11px] font-bold text-muted-foreground">Stock rapide :</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(prod.id, -5)}
                      className="px-1.5 py-0.5 rounded-md bg-card border border-border text-[11px] font-bold hover:bg-muted text-red-400 transition-colors"
                      title="Diminuer stock de 5"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(prod.id, -1)}
                      className="px-2 py-0.5 rounded-md bg-card border border-border text-xs font-bold hover:bg-muted text-red-400 transition-colors"
                      title="Diminuer stock de 1"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(prod.id, 1)}
                      className="px-2 py-0.5 rounded-md bg-card border border-border text-xs font-bold hover:bg-muted text-emerald-400 transition-colors"
                      title="Ajouter 1 au stock"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustStock(prod.id, 5)}
                      className="px-1.5 py-0.5 rounded-md bg-card border border-border text-[11px] font-bold hover:bg-muted text-primary transition-colors"
                      title="Ajouter 5 au stock"
                    >
                      +5
                    </button>
                  </div>
                </div>

                {/* Action Buttons: Edit, Duplicate, Featured, Delete */}
                <div className="flex flex-wrap items-center justify-between gap-1 pt-1">
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => openEditProductModal(prod)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10"
                      title="Modifier les détails complets de l'article"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Éditer
                    </Button>

                    <Button
                      onClick={() => handleDuplicateProduct(prod)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                      title="Dupliquer pour créer une variante ou produit similaire"
                    >
                      <Copy className="w-3.5 h-3.5" /> Dupliquer
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(prod)}
                      className={cn(
                        "p-1.5 rounded-lg border transition-colors",
                        prod.is_featured
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          : "bg-card border-border text-muted-foreground hover:text-foreground"
                      )}
                      title={prod.is_featured ? "Retirer des vedettes" : "Mettre en vedette"}
                    >
                      <Star className={cn("w-3.5 h-3.5", prod.is_featured && "fill-current")} />
                    </button>

                    <Button onClick={() => handleDeleteProduct(prod.id)} variant="ghost" size="sm" className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit / Duplicate Product Modal */}
      <Modal
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? `Modifier l'article : ${editingProduct.name}` : 'Publier ou dupliquer un produit (Shopify)'}
        size="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
          {/* Section 1: Title & Category */}
          <div className="space-y-3">
            <Input
              label="Titre / Nom du produit *"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="Ex: iPhone 14 Pro Max 256Go / Sneakers Air Max"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Catégorie" value={pCat} onChange={(e) => setPCat(e.target.value)} options={[
                { value: 'Électronique', label: 'Électronique & Smartphones' },
                { value: 'Mode', label: 'Mode & Vêtements' },
                { value: 'Chaussures', label: 'Chaussures & Baskets' },
                { value: 'Maison', label: 'Maison & Électroménager' },
                { value: 'Beauté', label: 'Beauté, Parfums & Cosmétiques' },
                { value: 'Sport', label: 'Sport & Fitness' },
                { value: 'Alimentation', label: 'Alimentation & Épicerie' },
                { value: 'Livres', label: 'Livres & Papeterie' }
              ]} />

              <Select label="État de l'article" value={pCondition} onChange={(e) => setPCondition(e.target.value)} options={[
                { value: 'neuf', label: 'Neuf sous emballage' },
                { value: 'tres_bon', label: 'Très bon état' },
                { value: 'bon', label: 'Bon état' },
                { value: 'correct', label: 'État correct' }
              ]} />
            </div>
          </div>

          {/* Section 2: Pricing & Compare Price (Shopify Promo) */}
          <div className="p-3.5 rounded-2xl bg-card border border-border space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-primary" /> Tarification & Promotions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Prix de vente (FCFA) *"
                type="number"
                value={pPrice}
                onChange={(e) => setPPrice(e.target.value)}
                placeholder="25000"
                required
              />
              <Input
                label="Prix d'origine barré (Promo) FCFA"
                type="number"
                value={pComparePrice}
                onChange={(e) => setPComparePrice(e.target.value)}
                placeholder="35000"
              />
            </div>
          </div>

          {/* Section 3: Inventory & SKU */}
          <div className="p-3.5 rounded-2xl bg-card border border-border space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-primary" /> Inventaire & Références
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Quantité en stock *"
                type="number"
                value={pStock}
                onChange={(e) => setPStock(e.target.value)}
                placeholder="10"
                required
              />
              <Input
                label="Code SKU / Réf"
                value={pSku}
                onChange={(e) => setPSku(e.target.value)}
                placeholder="SKU-10293"
              />
              <Input
                label="Marque / Fabricant"
                value={pBrand}
                onChange={(e) => setPBrand(e.target.value)}
                placeholder="Ex: Apple, Nike, Samsung"
              />
            </div>
          </div>

          {/* Section 4: Images Gallery */}
          <MultiImageUploadField
            label="Galerie Photos du produit (jusqu'à 6 photos)"
            images={pImages}
            onChange={setPImages}
            maxImages={6}
            placeholder="Importer depuis votre galerie ou appareil..."
          />

          {/* Section 5: Variants & Colors */}
          <div className="space-y-3">
            <Input
              label="Variantes & Couleurs (séparées par une virgule)"
              value={pColors}
              onChange={(e) => setPColors(e.target.value)}
              placeholder="Ex: Noir Sidéral, Argent / Blanc, Bleu Nuit, 128Go, 256Go"
            />
            <Input
              label="Tags & Mots-clés (séparés par une virgule)"
              value={pTags}
              onChange={(e) => setPTags(e.target.value)}
              placeholder="Ex: Tendance, Promo, Soldes, Étudiant"
            />
          </div>

          {/* Section 6: Description */}
          <Textarea
            label="Description complète du produit"
            value={pDesc}
            onChange={(e) => setPDesc(e.target.value)}
            placeholder="Détails techniques, garanties, mode d'emploi, livraison..."
            rows={4}
          />

          {/* Section 7: Options Avancées */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border text-xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={pIsFeatured}
                onChange={(e) => setPIsFeatured(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="isFeatured" className="font-bold text-foreground cursor-pointer flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Mettre en vedette sur ma boutique
              </label>
            </div>

            <Select
              value={pStatus}
              onChange={(e) => setPStatus(e.target.value)}
              options={[
                { value: 'active', label: 'Statut : Actif en vente 🟢' },
                { value: 'draft', label: 'Statut : Brouillon 📝' },
                { value: 'out_of_stock', label: 'Statut : Rupture de stock 🔴' },
              ]}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setProductModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-bold px-6">
              {editingProduct ? 'Enregistrer les modifications' : 'Publier l\'article'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
