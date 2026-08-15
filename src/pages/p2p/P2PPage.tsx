import { useState } from 'react'
import { Handshake, Plus, MapPin, Search, MessageSquare, ShieldCheck, Tag } from 'lucide-react'
import { P2PAPI, ProductAPI } from '@/lib/store'
import { CITIES_CAMEROON } from '@/types'
import { formatPrice, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { toastSuccess, toastError } from '@/components/ui/Toast'

export default function P2PPage() {
  const { user } = useAuth()
  const [, forceUpdate] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedCity, setSelectedCity] = useState('Toutes')
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Listing creation state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Livres')
  const [whatsapp, setWhatsapp] = useState('')

  // Filter listings
  const listings = ProductAPI.filter(p => p.status === 'active')

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) { toastError('Veuillez vous connecter.'); return }
    if (!title || !price || !whatsapp) { toastError('Veuillez remplir les champs obligatoires.'); return }

    ProductAPI.create({
      shop_id: 'p2p-' + user.id,
      shop_name: `P2P Étudiant (${user.name})`,
      name: title,
      description: description || title,
      price: Number(price),
      image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
      category,
      stock: 1,
      condition: 'tres_bon',
      status: 'active',
    })

    setCreateModalOpen(false)
    setTitle('')
    setDescription('')
    setPrice('')
    toastSuccess('Annonce P2P publiée !')
    forceUpdate(n => n + 1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
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
        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0" onClick={() => setCreateModalOpen(true)}>
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
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {listings.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).map(item => (
          <div key={item.id} className="product-card group p-4 flex flex-col justify-between">
            <div>
              <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-3">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <span className="badge-primary mb-1 inline-block">{item.category}</span>
              <h3 className="font-bold text-foreground text-sm line-clamp-2">{item.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
              <p className="text-lg font-bold gradient-text mt-2">{formatPrice(item.price)}</p>
            </div>

            <a
              href={buildWhatsAppUrl('677000000', `Bonjour, je suis intéressé par votre annonce P2P "${item.name}" sur MarchéPlus.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Contacter l'étudiant
            </a>
          </div>
        ))}
      </div>

      {/* Create Listing Modal */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Publier une annonce P2P">
        <form onSubmit={handleCreateListing} className="space-y-4">
          <Input label="Titre de l'annonce" placeholder="Ex: Livre Math C terminale" required value={title} onChange={e => setTitle(e.target.value)} />
          <Select
            label="Catégorie"
            value={category}
            onChange={e => setCategory(e.target.value)}
            options={[
              { value: 'Livres', label: 'Manuels & Livres' },
              { value: 'Électronique', label: 'Électronique & Accessoires' },
              { value: 'Maison', label: 'Mobilier & Chambre' },
              { value: 'Mode', label: 'Vêtements & Chaussures' },
              { value: 'Services', label: 'Soutien & Services' },
            ]}
          />
          <Input label="Prix (FCFA)" type="number" placeholder="Ex: 5000" required value={price} onChange={e => setPrice(e.target.value)} />
          <Input label="Numéro WhatsApp de contact" placeholder="Ex: 677XXXXXX" required value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
          <Textarea label="Description de l'article" rows={3} placeholder="Précisez l'état, le lieu de remise (ex: Campus Ngoa Ekelle), etc." value={description} onChange={e => setDescription(e.target.value)} />

          <div className="pt-3 flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>Annuler</Button>
            <Button type="submit">Publier l'annonce</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
