import { useState, useMemo } from 'react'
import { Handshake, Plus, MapPin, Search, MessageSquare, ShieldCheck, Tag, Trash2, Edit, X } from 'lucide-react'
import { P2PAPI, ProductAPI } from '@/lib/store'
import { CITIES_CAMEROON, CATEGORIES, CONDITION_LABELS } from '@/types'
import type { Product } from '@/types'
import { formatPrice, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { MultiImageUploadField } from '@/components/ui/MultiImageUploadField'
import { useAuth } from '@/hooks/useAuth'
import { toastSuccess, toastError } from '@/components/ui/Toast'

export default function P2PPage() {
  const { user } = useAuth()
  const [, forceUpdate] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Toutes')
  const [selectedCity, setSelectedCity] = useState('Toutes')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingListing, setEditingListing] = useState<Product | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Livres')
  const [condition, setCondition] = useState('tres_bon')
  const [stock, setStock] = useState('1')
  const [whatsapp, setWhatsapp] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [city, setCity] = useState('Yaoundé')
  const [colors, setColors] = useState('')

  // Filter P2P listings only
  const listings = useMemo(() => {
    return ProductAPI.filter(p => p.is_p2p === true && p.status === 'active')
  }, [])

  const filteredListings = useMemo(() => {
    return listings.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      const matchCat = selectedCategory === 'Toutes' || p.category === selectedCategory
      const matchCity = selectedCity === 'Toutes' || p.shop_name.includes(selectedCity)
      return matchSearch && matchCat && matchCity
    })
  }, [listings, search, selectedCategory, selectedCity])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setPrice('')
    setCategory('Livres')
    setCondition('tres_bon')
    setStock('1')
    setWhatsapp('')
    setImages([])
    setCity('Yaoundé')
    setColors('')
    setEditingListing(null)
  }

  const handleOpenCreate = () => {
    resetForm()
    setCreateModalOpen(true)
  }

  const handleOpenEdit = (listing: any) => {
    setEditingListing(listing)
    setTitle(listing.name)
    setDescription(listing.description || '')
    setPrice(String(listing.price))
    setCategory(listing.category)
    setCondition(listing.condition)
    setStock(String(listing.stock))
    setWhatsapp(listing.whatsapp_number || '')
    setImages(listing.images || [listing.image_url].filter(Boolean))
    setCity('Yaoundé')
    setColors(listing.colors?.map((c: any) => c.name).join(', ') || '')
    setCreateModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { toastError('Veuillez vous connecter.'); return }
    if (!title || !price || !whatsapp) { toastError('Veuillez remplir les champs obligatoires.'); return }

    const p2pShopId = 'p2p-' + user.id
    const p2pShopName = `P2P Étudiant (${user.name})`

    const mainImage = images[0] || ''
    const secondaryImages = images.slice(1)

    const productData = {
      shop_id: p2pShopId,
      shop_name: p2pShopName,
      name: title,
      description: description || title,
      price: Number(price),
      image_url: mainImage,
      images: secondaryImages,
      category,
      stock: Number(stock),
      condition: condition as any,
      status: 'active' as const,
      is_p2p: true,
      whatsapp_number: whatsapp,
      colors: colors ? colors.split(',').map(c => c.trim()).filter(Boolean).map(name => ({ name })) : undefined,
    }

    if (editingListing) {
      ProductAPI.update(editingListing.id, productData)
      toastSuccess('Annonce P2P modifiée !')
    } else {
      ProductAPI.create(productData)
      toastSuccess('Annonce P2P publiée !')
    }

    setCreateModalOpen(false)
    resetForm()
    forceUpdate(n => n + 1)
  }

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer cette annonce P2P ?')) return
    ProductAPI.delete(id)
    toastSuccess('Annonce supprimée')
    forceUpdate(n => n + 1)
  }

  const userListings = useMemo(() => {
    if (!user) return []
    return listings.filter(l => l.shop_id === 'p2p-' + user.id)
  }, [listings, user])

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      {/* Header Banner */}
      <div className="card-glass p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-primary/5 to-card border border-border flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold text-xs">
            <Handshake className="w-4 h-4" /> Marché Étudiant à Étudiant (P2P)
          </div>
          <h1 className="text-3xl font-display font-extrabold text-foreground">Échanges & Ventes directes entre étudiants</h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Vendez ou échangez vos manuels universitaires, votre électroménager de chambre d'étudiant, vos polycopiés et vos appareils d'occasion en toute sécurité.
          </p>
        </div>
        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0" onClick={handleOpenCreate}>
          <Plus className="w-5 h-5" /> Déposer une annonce gratuit
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-80 card-glass px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une annonce P2P..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="Toutes">Toutes les villes</option>
            {CITIES_CAMEROON.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
          >
            <option value="Toutes">Toutes catégories</option>
            {CATEGORIES.filter(c => c !== 'Toutes').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* My Listings */}
      {user && userListings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Mes Annonces P2P
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userListings.map(item => (
              <div key={item.id} className="card-glass p-3 flex flex-col justify-between border border-primary/20">
                <div>
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2">
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-muted-foreground">{formatPrice(item.price)}</p>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => handleOpenEdit(item)} className="flex-1 text-xs">
                    <Edit className="w-3 h-3" /> Modifier
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Listings Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold font-display text-foreground">Annonces récentes</h2>
        {filteredListings.length === 0 ? (
          <div className="text-center py-16 card-glass">
            <Handshake className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground">Aucune annonce trouvée</h3>
            <p className="text-sm text-muted-foreground">Soyez le premier à déposer une annonce P2P !</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredListings.map(item => {
              const listingImages = item.images && item.images.length > 0 ? item.images : [item.image_url]
              return (
                <div key={item.id} className="product-card group p-4 flex flex-col justify-between">
                  <div>
                    <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-3 relative">
                      <img src={listingImages[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      {listingImages.length > 1 && (
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                          +{listingImages.length - 1} photo{listingImages.length > 2 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <span className="badge-primary mb-1 inline-block">{item.category}</span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-1">
                      {CONDITION_LABELS[item.condition]}
                    </span>
                    <h3 className="font-bold text-foreground text-sm line-clamp-2">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    <p className="text-lg font-bold gradient-text mt-2">{formatPrice(item.price)}</p>
                    {item.stock > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">{item.stock} disponible(s)</p>
                    )}
                  </div>

                  <a
                    href={buildWhatsAppUrl(item.whatsapp_number || '677000000', `Bonjour, je suis intéressé par votre annonce P2P "${item.name}" sur MarchéPlus.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Contacter l'étudiant
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Listing Modal */}
      <Modal open={createModalOpen} onClose={() => { setCreateModalOpen(false); resetForm(); }} title={editingListing ? 'Modifier l\'annonce P2P' : 'Publier une annonce P2P'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Titre de l'annonce" placeholder="Ex: iPhone 13 Pro Reconditionné" required value={title} onChange={e => setTitle(e.target.value)} />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Prix (FCFA)" type="number" placeholder="Ex: 150000" required value={price} onChange={e => setPrice(e.target.value)} />
            <Input label="Stock disponible" type="number" placeholder="Ex: 3" required value={stock} onChange={e => setStock(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Catégorie" value={category} onChange={e => setCategory(e.target.value)} options={[
              ...CATEGORIES.filter(c => c !== 'Toutes').map(c => ({ value: c, label: c })),
              { value: 'Services', label: 'Soutien & Services' }
            ]} />

            <Select label="État du produit" value={condition} onChange={e => setCondition(e.target.value)} options={[
              { value: 'neuf', label: 'Neuf sous emballage' },
              { value: 'tres_bon', label: 'Très bon état' },
              { value: 'bon', label: 'Bon état' },
              { value: 'correct', label: 'État correct' }
            ]}/>
          </div>

          <MultiImageUploadField
            label="Photos de l'article"
            images={images}
            onChange={setImages}
            maxImages={4}
            placeholder="Importer depuis votre galerie..."
          />

          <Input
            label="Variantes de Couleurs (séparées par une virgule)"
            value={colors}
            onChange={e => setColors(e.target.value)}
            placeholder="Ex: Noir, Argent, Bleu"
          />

          <Select label="Ville de remise" value={city} onChange={e => setCity(e.target.value)} options={CITIES_CAMEROON.map(c => ({ value: c, label: c }))} />

          <Textarea label="Description détaillée" rows={3} placeholder="Caractéristiques, état, lieu de remise (ex: Campus Ngoa Ekelle), etc." value={description} onChange={e => setDescription(e.target.value)} />

          <Input label="Numéro WhatsApp de contact" placeholder="Ex: 677XXXXXX" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setCreateModalOpen(false); resetForm(); }}>
              Annuler
            </Button>
            <Button type="submit">
              {editingListing ? 'Enregistrer les modifications' : 'Publier l\'annonce'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
