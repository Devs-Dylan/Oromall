import { useState, useMemo } from 'react'
import { Store, Package, Home, Plus, Trash2, Eye, Search, Filter, Edit3, Copy, CheckCircle, ExternalLink, FileText } from 'lucide-react'
import type { Shop, Product, Housing } from '@/types'
import { ShopAPI, ProductAPI, HousingAPI, AuditLogAPI } from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface AdminCatalogTabProps {
  adminName?: string
  onRefresh: () => void
}

type CatalogView = 'shops' | 'products' | 'housing'

export function AdminCatalogTab({ adminName = 'SuperAdmin', onRefresh }: AdminCatalogTabProps) {
  const [view, setView] = useState<CatalogView>('shops')
  const [shopSearch, setShopSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [housingSearch, setHousingSearch] = useState('')

  // Edit / Inspect Modals
  const [editingHousing, setEditingHousing] = useState<Housing | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingShop, setEditingShop] = useState<Shop | null>(null)

  const shops = ShopAPI.list()
  const products = ProductAPI.list()
  const housings = HousingAPI.list()

  const filteredShops = useMemo(() => shops.filter(s =>
    s.name.toLowerCase().includes(shopSearch.toLowerCase()) ||
    s.city.toLowerCase().includes(shopSearch.toLowerCase())
  ), [shops, shopSearch])

  const filteredProducts = useMemo(() => products.filter(p =>
    (p.title || (p as any).name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
    ((p as any).shop_name || '').toLowerCase().includes(productSearch.toLowerCase())
  ), [products, productSearch])

  const filteredHousings = useMemo(() => housings.filter(h =>
    h.title.toLowerCase().includes(housingSearch.toLowerCase()) ||
    h.city.toLowerCase().includes(housingSearch.toLowerCase()) ||
    h.neighborhood.toLowerCase().includes(housingSearch.toLowerCase())
  ), [housings, housingSearch])

  // --- ACTIONS LOGEMENTS ---
  const handleDeleteHousing = (id: string, title: string) => {
    if (!confirm(`Supprimer définitivement le logement "${title}" ?`)) return
    HousingAPI.delete(id)
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Suppression Logement', details: `Logement : ${title}`, severity: 'danger' })
    toastSuccess('Logement supprimé avec succès')
    onRefresh()
  }

  const handleDuplicateHousing = (h: Housing) => {
    const copy: Omit<Housing, 'id' | 'created_date' | 'updated_date'> = {
      ...h,
      title: `${h.title} (Copie)`,
      status: 'available',
    }
    HousingAPI.create(copy)
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Duplication Logement', details: `Logement copié : ${h.title}`, severity: 'info' })
    toastSuccess('Logement dupliqué en 1 clic')
    onRefresh()
  }

  const handleSaveHousing = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingHousing) return
    HousingAPI.update(editingHousing.id, editingHousing)
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Modification Logement', details: `Édition logement : ${editingHousing.title}`, severity: 'warning' })
    toastSuccess('Logement mis à jour avec succès')
    setEditingHousing(null)
    onRefresh()
  }

  // --- ACTIONS PRODUITS ---
  const handleDeleteProduct = (id: string, title: string) => {
    if (!confirm(`Supprimer le produit "${title}" ?`)) return
    ProductAPI.delete(id)
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Suppression Produit', details: `Produit : ${title}`, severity: 'danger' })
    toastSuccess('Produit supprimé')
    onRefresh()
  }

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return
    ProductAPI.update(editingProduct.id, editingProduct)
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Modification Produit', details: `Édition produit : ${editingProduct.title}`, severity: 'warning' })
    toastSuccess('Produit mis à jour')
    setEditingProduct(null)
    onRefresh()
  }

  // --- ACTIONS BOUTIQUES ---
  const handleDeleteShop = (id: string, name: string) => {
    if (!confirm(`Supprimer la boutique "${name}" ?`)) return
    ShopAPI.delete(id)
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Suppression Boutique', details: `Boutique : ${name}`, severity: 'danger' })
    toastSuccess('Boutique supprimée')
    onRefresh()
  }

  const handleToggleVerifyShop = (shop: Shop) => {
    const nextVerified = !shop.is_verified
    ShopAPI.update(shop.id, { is_verified: nextVerified })
    AuditLogAPI.create({ 
      timestamp: new Date().toISOString(), 
      admin_name: adminName, 
      action: `${nextVerified ? 'Certification Boutique 🛡️' : 'Retrait Certification Boutique'}`, 
      details: `Boutique : ${shop.name}`, 
      severity: nextVerified ? 'warning' : 'info' 
    })
    toastSuccess(`Boutique "${shop.name}" ${nextVerified ? 'Certifiée & Vérifiée 🛡️' : 'Certification retirée'}`)
    onRefresh()
  }

  const handleSaveShop = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingShop) return
    ShopAPI.update(editingShop.id, editingShop)
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Modification Boutique', details: `Édition boutique : ${editingShop.name}`, severity: 'warning' })
    toastSuccess('Boutique mise à jour')
    setEditingShop(null)
    onRefresh()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            📦 Contrôle & Gestion Totale du Catalogue (Admin)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Éditez, modifiez, dupliquez ou supprimez n'importe quelle entité du site.</p>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2">
        {[
          { id: 'housing', label: `🏠 Logements & Chambres (${housings.length})`, icon: Home },
          { id: 'products', label: `🛒 Produits (${products.length})`, icon: Package },
          { id: 'shops', label: `🏪 Boutiques (${shops.length})`, icon: Store },
        ].map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setView(t.id as CatalogView)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5',
                view === t.id ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Housing View (Logements) */}
      {view === 'housing' && (
        <div className="space-y-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={housingSearch} onChange={e => setHousingSearch(e.target.value)} placeholder="Rechercher logement, quartier, ville..." className="pl-9 text-xs" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredHousings.map(h => (
              <div key={h.id} className="card-glass p-4 flex flex-col justify-between space-y-3 border-l-4 border-l-emerald-500">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-foreground text-sm line-clamp-1">{h.title}</h3>
                    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase", h.status === 'available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400')}>
                      {h.status === 'available' ? 'Disponible' : h.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Catégorie: <strong className="text-foreground capitalize">{h.category}</strong> • {h.neighborhood}, {h.city}</p>
                  <p className="text-xs text-muted-foreground">WhatsApp Proprio: <strong className="text-foreground">{h.whatsapp_number}</strong></p>
                  <p className="text-sm font-extrabold text-emerald-400">{formatPrice(h.price)} <span className="text-xs font-normal text-muted-foreground">/{h.price_type === 'month' ? 'mois' : 'jour'}</span></p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <Button size="sm" variant="outline" onClick={() => handleDuplicateHousing(h)} className="text-xs gap-1">
                    <Copy className="w-3.5 h-3.5" /> Dupliquer
                  </Button>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditingHousing({ ...h })} className="text-primary hover:bg-primary/10">
                      <Edit3 className="w-3.5 h-3.5" /> Éditer
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteHousing(h.id, h.title)} className="text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Products View */}
      {view === 'products' && (
        <div className="space-y-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Rechercher produit, boutique..." className="pl-9 text-xs" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(p => (
              <div key={p.id} className="card-glass p-4 flex flex-col justify-between space-y-3 border-l-4 border-l-primary">
                <div className="space-y-1">
                  <h3 className="font-bold text-foreground text-sm line-clamp-1">{p.title || (p as any).name}</h3>
                  <p className="text-xs text-muted-foreground">Catégorie: {p.category} • Stock: {p.stock ?? 1}</p>
                  <p className="text-sm font-extrabold text-primary">{formatPrice(p.price)}</p>
                </div>
                <div className="flex justify-end gap-1 pt-2 border-t border-border/50">
                  <Button size="sm" variant="ghost" onClick={() => setEditingProduct({ ...p })} className="text-primary hover:bg-primary/10">
                    <Edit3 className="w-3.5 h-3.5" /> Modifier
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteProduct(p.id, p.title || (p as any).name)} className="text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shops View */}
      {view === 'shops' && (
        <div className="space-y-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={shopSearch} onChange={e => setShopSearch(e.target.value)} placeholder="Rechercher boutique, ville..." className="pl-9 text-xs" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShops.map(shop => (
              <div key={shop.id} className="card-glass p-4 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      {shop.name}
                      {shop.is_verified && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          🛡️ Vérifiée
                        </span>
                      )}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{shop.category} • {shop.city}</p>
                  <p className="text-xs text-muted-foreground">Propriétaire: {shop.owner_name} ({shop.whatsapp_number})</p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleVerifyShop(shop)}
                    className={cn(
                      'text-xs font-bold',
                      shop.is_verified ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10' : 'text-slate-400 border-slate-700 hover:bg-slate-800'
                    )}
                  >
                    {shop.is_verified ? '🛡️ Certifiée' : 'Certifier Pro'}
                  </Button>

                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditingShop({ ...shop })} className="text-primary hover:bg-primary/10">
                      <Edit3 className="w-3.5 h-3.5" /> Modifier
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteShop(shop.id, shop.name)} className="text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL ÉDITION LOGEMENT */}
      {editingHousing && (
        <Modal open={!!editingHousing} onClose={() => setEditingHousing(null)} title={`Édition Immobilière : ${editingHousing.title}`} size="lg">
          <form onSubmit={handleSaveHousing} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Titre de l'annonce *</label>
              <Input value={editingHousing.title} onChange={e => setEditingHousing({ ...editingHousing, title: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Prix (FCFA) *</label>
                <Input type="number" value={editingHousing.price} onChange={e => setEditingHousing({ ...editingHousing, price: Number(e.target.value) })} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Fréquence de loyer</label>
                <select value={editingHousing.price_type} onChange={e => setEditingHousing({ ...editingHousing, price_type: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-card border border-border">
                  <option value="month">Par mois</option>
                  <option value="day">Par jour</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Ville *</label>
                <Input value={editingHousing.city} onChange={e => setEditingHousing({ ...editingHousing, city: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Quartier *</label>
                <Input value={editingHousing.neighborhood} onChange={e => setEditingHousing({ ...editingHousing, neighborhood: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Numéro WhatsApp *</label>
                <Input value={editingHousing.whatsapp_number} onChange={e => setEditingHousing({ ...editingHousing, whatsapp_number: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Statut du logement</label>
                <select value={editingHousing.status} onChange={e => setEditingHousing({ ...editingHousing, status: e.target.value as any })} className="w-full px-3 py-2 rounded-xl bg-card border border-border">
                  <option value="available">Disponible</option>
                  <option value="reserved">Réservé</option>
                  <option value="rented">Loué / Vendu</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Description</label>
              <textarea value={editingHousing.description} onChange={e => setEditingHousing({ ...editingHousing, description: e.target.value })} rows={3} className="w-full p-2 rounded-xl bg-card border border-border" />
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setEditingHousing(null)}>Annuler</Button>
              <Button type="submit" className="bg-primary text-white">Enregistrer les modifications</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL ÉDITION PRODUIT */}
      {editingProduct && (
        <Modal open={!!editingProduct} onClose={() => setEditingProduct(null)} title={`Édition Produit : ${editingProduct.title}`} size="md">
          <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Titre du produit *</label>
              <Input value={editingProduct.title} onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Prix (FCFA) *</label>
                <Input type="number" value={editingProduct.price} onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Stock</label>
                <Input type="number" value={editingProduct.stock ?? 1} onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Description</label>
              <textarea value={editingProduct.description} onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })} rows={3} className="w-full p-2 rounded-xl bg-card border border-border" />
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setEditingProduct(null)}>Annuler</Button>
              <Button type="submit" className="bg-primary text-white">Sauvegarder</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL ÉDITION BOUTIQUE */}
      {editingShop && (
        <Modal open={!!editingShop} onClose={() => setEditingShop(null)} title={`Édition Boutique : ${editingShop.name}`} size="md">
          <form onSubmit={handleSaveShop} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Nom de la boutique *</label>
              <Input value={editingShop.name} onChange={e => setEditingShop({ ...editingShop, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Ville *</label>
                <Input value={editingShop.city} onChange={e => setEditingShop({ ...editingShop, city: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">WhatsApp *</label>
                <Input value={editingShop.whatsapp_number} onChange={e => setEditingShop({ ...editingShop, whatsapp_number: e.target.value })} required />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="ghost" onClick={() => setEditingShop(null)}>Annuler</Button>
              <Button type="submit" className="bg-primary text-white">Sauvegarder</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
