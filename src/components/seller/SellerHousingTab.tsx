import { useState, useMemo } from 'react'
import { Home, Plus, Edit3, Trash2, Eye, MapPin, CheckCircle, Clock, AlertCircle, Sparkles } from 'lucide-react'
import type { Housing, HousingCategory, HousingStatus } from '@/types'
import { HousingAPI } from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface SellerHousingTabProps {
  housings: Housing[]
  userEmail?: string
  shopWhatsapp?: string
  onRefresh: () => void
}

export function SellerHousingTab({ housings, userEmail, shopWhatsapp, onRefresh }: SellerHousingTabProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)

  // Form Fields
  const [hTitle, setHTitle] = useState('')
  const [hPrice, setHPrice] = useState('')
  const [hPriceType, setHPriceType] = useState<'month' | 'day'>('month')
  const [hCategory, setHCategory] = useState<HousingCategory>('studio')
  const [hCity, setHCity] = useState('Yaoundé')
  const [hNeighborhood, setHNeighborhood] = useState('Ngoa-Ekellé')
  const [hSurface, setHSurface] = useState('30')
  const [hBedrooms, setHBedrooms] = useState('1')
  const [hBathrooms, setHBathrooms] = useState('1')
  const [hFurnished, setHFurnished] = useState(true)
  const [hDesc, setHDesc] = useState('')
  const [hImage, setHImage] = useState('')

  const handleToggleStatus = (housingId: string, currentStatus: HousingStatus) => {
    const nextStatus: HousingStatus = currentStatus === 'available' ? 'rented' : 'available'
    HousingAPI.update(housingId, { status: nextStatus })
    toastSuccess(`Statut du logement mis à jour : ${nextStatus === 'available' ? 'Disponible 🟢' : 'Loué 🔴'}`)
    onRefresh()
  }

  const handleSaveHousing = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hTitle || !hPrice) {
      toastError('Veuillez spécifier le titre et le loyer.')
      return
    }

    HousingAPI.create({
      title: hTitle,
      description: hDesc,
      category: hCategory,
      price: Number(hPrice),
      price_type: hPriceType,
      city: hCity,
      neighborhood: hNeighborhood,
      address: `${hNeighborhood}, ${hCity}`,
      latitude: hCity === 'Yaoundé' ? 3.868 : hCity === 'Douala' ? 4.051 : 4.156,
      longitude: hCity === 'Yaoundé' ? 11.521 : hCity === 'Douala' ? 9.704 : 9.241,
      surface_sqm: Number(hSurface),
      bedrooms: Number(hBedrooms),
      bathrooms: Number(hBathrooms),
      furnished: hFurnished,
      amenities: ['wifi', 'eau_gratuite', 'gardien', 'parking'],
      images: [hImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'],
      image_url: hImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
      owner_name: 'Bailleur Vérifié',
      owner_email: userEmail,
      whatsapp_number: shopWhatsapp || '237677000000',
      status: 'available',
      rating: 4.9,
      reviews_count: 1
    })

    toastSuccess('Nouveau logement ajouté au portefeuille !')
    setModalOpen(false)
    onRefresh()
  }

  const handleDeleteHousing = (id: string) => {
    if (confirm('Retirer cette annonce du portefeuille immobilier ?')) {
      HousingAPI.delete(id)
      toastSuccess('Annonce supprimée.')
      onRefresh()
    }
  }

  const filteredHousings = useMemo(() => {
    return housings.filter(h => categoryFilter === 'all' || h.category === categoryFilter)
  }, [housings, categoryFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-400" /> Portefeuille Immobilier ({housings.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gérez la disponibilité de vos studios, chambres, appartements et villas en location.
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20">
          <Plus className="w-4 h-4" /> Nouveau Logement
        </Button>
      </div>

      {/* Category Filters */}
      <div className="card-glass p-3 flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'all', label: `Tous (${housings.length})` },
          { id: 'studio', label: `Studios (${housings.filter(h => h.category === 'studio').length})` },
          { id: 'appartement', label: `Appartements (${housings.filter(h => h.category === 'appartement').length})` },
          { id: 'villa', label: `Villas (${housings.filter(h => h.category === 'villa').length})` },
          { id: 'chambre', label: `Chambres (${housings.filter(h => h.category === 'chambre').length})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setCategoryFilter(f.id)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
              categoryFilter === f.id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Housing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHousings.length === 0 ? (
          <div className="col-span-full card-glass p-12 text-center space-y-3">
            <Home className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucun logement répertorié dans cette catégorie.</p>
            <Button onClick={() => setModalOpen(true)} variant="outline" size="sm">Publier un logement</Button>
          </div>
        ) : (
          filteredHousings.map(h => (
            <div key={h.id} className="card-glass p-4 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all group">
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border/50">
                  <img src={h.image_url} alt={h.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-md bg-background/80 backdrop-blur-md text-[10px] font-bold text-foreground capitalize">
                    {h.category}
                  </span>

                  {/* Status Toggle Badge */}
                  <button
                    onClick={() => handleToggleStatus(h.id, h.status)}
                    className={cn(
                      'absolute top-2 right-2 px-2.5 py-1 rounded-lg text-[10px] font-bold backdrop-blur-md transition-transform hover:scale-105',
                      h.status === 'available' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
                    )}
                  >
                    {h.status === 'available' ? 'Disponible 🟢' : 'Loué / Occupé 🔴'}
                  </button>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-foreground line-clamp-1">{h.title}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-emerald-400" /> {h.neighborhood}, {h.city}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{h.surface_sqm} m²</span>
                  <span>•</span>
                  <span>{h.bedrooms} Ch.</span>
                  <span>•</span>
                  <span>{h.bathrooms} SDB</span>
                  <span>•</span>
                  <span>{h.furnished ? 'Meublé' : 'Non meublé'}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-emerald-400">
                    {formatPrice(h.price)} <span className="text-[10px] text-muted-foreground">/{h.price_type === 'month' ? 'mois' : 'jour'}</span>
                  </span>
                </div>

                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <Button onClick={() => handleToggleStatus(h.id, h.status)} variant="outline" size="sm" className="h-8 text-xs gap-1">
                    {h.status === 'available' ? 'Marquer Loué' : 'Marquer Disponible'}
                  </Button>
                  <Button onClick={() => handleDeleteHousing(h.id)} variant="ghost" size="sm" className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Housing Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Publier un nouveau logement sur MarchéPlus Immobilier"
      >
        <form onSubmit={handleSaveHousing} className="space-y-4">
          <Input
            label="Titre de l'annonce"
            value={hTitle}
            onChange={(e) => setHTitle(e.target.value)}
            placeholder="Ex: Studio Meublé Moderne Bastos"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Loyer (FCFA)"
              type="number"
              value={hPrice}
              onChange={(e) => setHPrice(e.target.value)}
              placeholder="75000"
              required
            />

            <Select label="Périodicité" value={hPriceType} onChange={(e) => setHPriceType(e.target.value as any)}>
              <option value="month">Par mois</option>
              <option value="day">Par jour (Passage)</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select label="Type de bien" value={hCategory} onChange={(e) => setHCategory(e.target.value as any)}>
              <option value="studio">Studio</option>
              <option value="appartement">Appartement</option>
              <option value="villa">Villa</option>
              <option value="chambre">Chambre</option>
              <option value="duplex">Duplex</option>
            </Select>

            <Input
              label="Ville"
              value={hCity}
              onChange={(e) => setHCity(e.target.value)}
              placeholder="Yaoundé, Douala..."
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input label="Quartier" value={hNeighborhood} onChange={(e) => setHNeighborhood(e.target.value)} placeholder="Ngoa-Ekellé" required />
            <Input label="Surface (m²)" type="number" value={hSurface} onChange={(e) => setHSurface(e.target.value)} required />
            <Input label="Chambres" type="number" value={hBedrooms} onChange={(e) => setHBedrooms(e.target.value)} required />
          </div>

          <Input label="URL de la photo" value={hImage} onChange={(e) => setHImage(e.target.value)} placeholder="https://images.unsplash.com/..." />
          <Textarea label="Description détaillée" value={hDesc} onChange={(e) => setHDesc(e.target.value)} placeholder="Eau 24/7, gardien, frais de visite..." rows={3} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">Publier le logement</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
