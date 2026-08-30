import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Home, Plus, Clock, CheckCircle2, XCircle, MapPin, Eye,
  Building2, Phone, AlertCircle, LogOut, Sparkles, BedDouble, Bath, Maximize2,
  Calendar, Info, RefreshCw, UploadCloud, Check
} from 'lucide-react'
import { HousingAPI, NotificationAPI, AuditLogAPI } from '@/lib/store'
import type { Housing, HousingCategory, HousingPriceType } from '@/types'
import { formatPrice, generateId, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { LocationPicker } from '@/components/shared/LocationPicker'
import { MultiImageUploadField } from '@/components/ui/MultiImageUploadField'

const HOUSING_CATEGORIES: { key: HousingCategory; label: string }[] = [
  { key: 'studio', label: 'Studio Moderne' },
  { key: 'chambre', label: 'Chambre Étudiant / Cité' },
  { key: 'appartement', label: 'Appartement' },
  { key: 'villa', label: 'Villa / Duplex' },
]

const CITIES = ['Yaoundé', 'Douala', 'Buea', 'Bafoussam', 'Dschang', 'Ambam', 'Ebolowa', 'Kribi', 'Garoua', 'Maroua', 'Ngaoundéré']

export default function AssociateDashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [, forceUpdate] = useState(0)

  const allHousings = HousingAPI.list()

  // Filter associate's submitted housings
  const myHousings = useMemo(() => {
    if (!user) return []
    return allHousings.filter(h => h.submitted_by_associate_id === user.id)
  }, [allHousings, user])

  const pendingHousings = myHousings.filter(h => h.status === 'pending_review')
  const approvedHousings = myHousings.filter(h => h.status === 'active' || h.status === 'available')
  const rejectedHousings = myHousings.filter(h => h.status === 'rejected')

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  // Housing Creation Modal
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<HousingCategory>('studio')
  const [price, setPrice] = useState<number>(50000)
  const [priceType, setPriceType] = useState<HousingPriceType>('month')
  const [depositAmount, setDepositAmount] = useState<number>(100000)
  const [city, setCity] = useState('Yaoundé')
  const [neighborhood, setNeighborhood] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState(3.868)
  const [longitude, setLongitude] = useState(11.521)
  const [surfaceSqm, setSurfaceSqm] = useState(30)
  const [bedrooms, setBedrooms] = useState(1)
  const [bathrooms, setBathrooms] = useState(1)
  const [furnished, setFurnished] = useState(false)
  const [description, setDescription] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [amenities, setAmenities] = useState<string[]>(['eau_gratuite', 'gardien'])

  // Preview Modal
  const [previewItem, setPreviewItem] = useState<Housing | null>(null)

  const toggleAmenity = (key: string) => {
    setAmenities(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const handleCreateHousingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !neighborhood.trim()) {
      toastError('Veuillez renseigner au moins le titre et le quartier du logement.')
      return
    }

    const finalImages = images.length > 0 ? images : [
      category === 'chambre'
        ? 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&auto=format&fit=crop&q=75'
        : category === 'studio'
          ? 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=75'
          : 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=75'
    ]

    const newHousing: Housing = {
      id: `house-${generateId().slice(0, 8)}`,
      title: title.trim(),
      description: description.trim() || `Logement recensé et vérifié par l'agent associé ${user?.name || ''}.`,
      category,
      property_type: 'residential',
      price: Number(price) || 25000,
      price_type: priceType,
      price_negotiable: false,
      deposit_amount: Number(depositAmount) || 0,
      payment_frequency: 'monthly',
      city,
      neighborhood: neighborhood.trim(),
      address: address.trim() || undefined,
      latitude: Number(latitude) || 3.868,
      longitude: Number(longitude) || 11.521,
      surface_sqm: Number(surfaceSqm) || 25,
      bedrooms: Number(bedrooms) || 1,
      bathrooms: Number(bathrooms) || 1,
      living_rooms: 1,
      kitchens: 1,
      furnished,
      air_conditioning: amenities.includes('climatisation'),
      water_source: amenities.includes('eau_gratuite') ? 'borehole' : 'city',
      electricity_source: amenities.includes('groupe_electrogene') ? 'generator' : 'grid',
      security_24h: amenities.includes('gardien'),
      internet_available: amenities.includes('wifi'),
      amenities,
      images: finalImages,
      image_url: finalImages[0],
      owner_name: ownerName.trim() || `Bailleur ${neighborhood.trim()}`,
      owner_phone: ownerPhone.trim() || undefined,
      whatsapp_number: (whatsappNumber.trim() || '237690000000').replace(/\s+/g, ''),
      status: 'pending_review',
      submitted_by_associate_id: user?.id,
      submitted_by_associate_name: user?.name,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    }

    HousingAPI.create(newHousing)

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: user?.name || 'Associé',
      action: `Soumission logement : ${newHousing.title}`,
      details: `En attente de validation administrative. Quartier : ${newHousing.neighborhood} (${newHousing.city})`,
      severity: 'info'
    })

    toastSuccess('Logement soumis avec succès ! 🚀', 'Transmis à l\'administrateur pour validation dans l\'onglet Soumissions.')
    setCreateModalOpen(false)
    
    // Reset form
    setTitle('')
    setNeighborhood('')
    setAddress('')
    setDescription('')
    setOwnerName('')
    setOwnerPhone('')
    setWhatsappNumber('')
    setImages([])
    forceUpdate(n => n + 1)
  }

  const filteredList = activeTab === 'pending'
    ? pendingHousings
    : activeTab === 'approved'
      ? approvedHousings
      : activeTab === 'rejected'
        ? rejectedHousings
        : myHousings

  return (
    <div className="min-h-screen pb-16 space-y-6 w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 animate-in fade-in duration-200">
      
      {/* Associate Welcome Banner */}
      <div className="card-glass p-6 md:p-8 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-amber-950/60 border-emerald-500/30 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center border border-emerald-500/30 text-base shadow-sm">
              🤝
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                Espace Associé OroMall
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Agent Terrain
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Connecté en tant que : <strong className="text-foreground">{user?.name}</strong> ({user?.email})
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl pt-1">
            Recensez les studios, chambres et logements sur le terrain. Chaque bien soumis est vérifié par l'administrateur avant sa mise en ligne.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 px-5 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" /> Enregistrer un Logement
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => { logout(); navigate('/login'); }}
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-glass p-4 rounded-2xl border-border space-y-1">
          <p className="text-[11px] text-muted-foreground font-bold uppercase">Total Soumis</p>
          <p className="text-2xl font-black text-foreground">{myHousings.length}</p>
          <span className="text-[10px] text-muted-foreground">Logements recensés</span>
        </div>

        <div className="card-glass p-4 rounded-2xl border-amber-500/30 bg-amber-500/5 space-y-1">
          <p className="text-[11px] text-amber-500 font-bold uppercase">En Attente Admin</p>
          <p className="text-2xl font-black text-amber-400">{pendingHousings.length}</p>
          <span className="text-[10px] text-muted-foreground">En cours d'examen</span>
        </div>

        <div className="card-glass p-4 rounded-2xl border-emerald-500/30 bg-emerald-500/5 space-y-1">
          <p className="text-[11px] text-emerald-500 font-bold uppercase">Validés & En Ligne</p>
          <p className="text-2xl font-black text-emerald-400">{approvedHousings.length}</p>
          <span className="text-[10px] text-muted-foreground">Visibles par les clients</span>
        </div>

        <div className="card-glass p-4 rounded-2xl border-red-500/30 bg-red-500/5 space-y-1">
          <p className="text-[11px] text-red-500 font-bold uppercase">À Corriger / Rejetés</p>
          <p className="text-2xl font-black text-red-400">{rejectedHousings.length}</p>
          <span className="text-[10px] text-muted-foreground">Voir motifs</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: `Tous mes biens (${myHousings.length})` },
            { id: 'pending', label: `🟡 En attente (${pendingHousings.length})` },
            { id: 'approved', label: `🟢 Validés (${approvedHousings.length})` },
            { id: 'rejected', label: `🔴 Rejetés (${rejectedHousings.length})` },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                activeTab === t.id
                  ? "bg-primary text-black shadow-md font-black"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Nouveau Logement
        </Button>
      </div>

      {/* Main Listings Grid */}
      {filteredList.length === 0 ? (
        <div className="card-glass p-12 text-center space-y-3 rounded-3xl border-border">
          <Home className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">Aucun logement trouvé dans cette catégorie</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Cliquez sur "Enregistrer un Logement" pour commencer à recenser des biens.
          </p>
          <Button onClick={() => setCreateModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
            <Plus className="w-4 h-4" /> Enregistrer mon premier bien
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map(h => (
            <div
              key={h.id}
              className="card-glass rounded-3xl overflow-hidden border border-border flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-md group"
            >
              <div>
                {/* Photo & Badge */}
                <div className="relative aspect-[16/10] overflow-hidden bg-card border-b border-border">
                  <img
                    src={h.image_url}
                    alt={h.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-black/80 text-white text-[10px] font-bold capitalize">
                    {h.category}
                  </span>

                  <span className={cn(
                    "absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl text-[10px] font-black shadow-md flex items-center gap-1",
                    h.status === 'pending_review' && "bg-amber-500 text-black",
                    (h.status === 'active' || h.status === 'available') && "bg-emerald-500 text-white",
                    h.status === 'rejected' && "bg-red-600 text-white"
                  )}>
                    {h.status === 'pending_review' && "🟡 En attente Admin"}
                    {(h.status === 'active' || h.status === 'available') && "🟢 Validé & En ligne"}
                    {h.status === 'rejected' && "🔴 Rejeté"}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-emerald-400 transition-colors">
                      {h.title}
                    </h3>
                    <span className="text-xs font-black text-emerald-400 shrink-0">
                      {formatPrice(h.price)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    {h.city} • {h.neighborhood}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/40">
                    <span>📐 {h.surface_sqm} m²</span>
                    <span>• 🛏️ {h.bedrooms} ch.</span>
                    <span>• 🚿 {h.bathrooms} sdb</span>
                  </div>

                  {h.status === 'rejected' && h.rejection_reason && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">
                      <p className="font-bold">Motif du refus :</p>
                      <p className="text-xs mt-0.5">{h.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 pt-0 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPreviewItem(h)}
                  className="w-full text-xs justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Voir les détails
                </Button>
                {h.status === 'active' && (
                  <Link
                    to={`/housing/${h.id}`}
                    target="_blank"
                    className="py-2 px-3 rounded-xl bg-primary text-black font-bold text-xs flex items-center justify-center shrink-0 shadow-sm"
                    title="Voir en ligne sur le site"
                  >
                    Voir sur le site →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL ENREGISTRER UN LOGEMENT ================= */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Enregistrer un nouveau logement / studio"
        size="lg"
      >
        <form onSubmit={handleCreateHousingSubmit} className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
          
          <Input
            label="Titre de l'annonce *"
            type="text"
            placeholder="Ex: Studio moderne meublé avec forage et groupe - Bastos"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="form-label block mb-1 font-semibold">Catégorie *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-emerald-500"
              >
                {HOUSING_CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Loyer (FCFA) *"
              type="number"
              min="5000"
              required
              value={price}
              onChange={e => setPrice(Number(e.target.value))}
            />

            <div>
              <label className="form-label block mb-1 font-semibold">Fréquence du loyer</label>
              <select
                value={priceType}
                onChange={e => setPriceType(e.target.value as any)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-emerald-500"
              >
                <option value="month">Par mois</option>
                <option value="day">Par jour</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Caution exigée (FCFA)"
              type="number"
              value={depositAmount}
              onChange={e => setDepositAmount(Number(e.target.value))}
            />

            <div>
              <label className="form-label block mb-1 font-semibold">Ville *</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-emerald-500"
              >
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <Input
              label="Quartier *"
              type="text"
              placeholder="Ex: Bastos, Melen, Omnisports..."
              required
              value={neighborhood}
              onChange={e => setNeighborhood(e.target.value)}
            />
          </div>

          <Input
            label="Repère ou adresse précise (visible par l'admin)"
            type="text"
            placeholder="Ex: Face École Américaine, à 50m du goudron"
            value={address}
            onChange={e => setAddress(e.target.value)}
          />

          {/* Location Picker */}
          <div className="space-y-1 pt-1">
            <label className="font-bold text-foreground block">Position GPS sur la carte (Calcul des distances exactes) :</label>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              city={city}
              neighborhood={neighborhood}
              onChange={(coords) => {
                setLatitude(Number(coords.latitude))
                setLongitude(Number(coords.longitude))
              }}
            />
          </div>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <Input
              label="Surface (m²)"
              type="number"
              value={surfaceSqm}
              onChange={e => setSurfaceSqm(Number(e.target.value))}
            />
            <Input
              label="Chambres"
              type="number"
              value={bedrooms}
              onChange={e => setBedrooms(Number(e.target.value))}
            />
            <Input
              label="Salles de bain"
              type="number"
              value={bathrooms}
              onChange={e => setBathrooms(Number(e.target.value))}
            />
          </div>

          {/* Amenities toggles */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="font-bold text-foreground block">Commodités & Équipements inclus :</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { key: 'eau_gratuite', label: '💧 Forage / Eau 24h' },
                { key: 'groupe_electrogene', label: '⚡ Groupe Électrogène' },
                { key: 'gardien', label: '🛡️ Gardien 24h' },
                { key: 'climatisation', label: '❄️ Climatisation' },
                { key: 'wifi', label: '📶 Wifi Inclus' },
                { key: 'salon_meuble', label: '🛋️ Salon Meublé' },
              ].map(amenity => (
                <button
                  key={amenity.key}
                  type="button"
                  onClick={() => toggleAmenity(amenity.key)}
                  className={cn(
                    "p-2 rounded-xl text-xs font-semibold border text-left flex items-center justify-between transition-colors",
                    amenities.includes(amenity.key)
                      ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                      : "bg-muted border-border text-muted-foreground"
                  )}
                >
                  <span>{amenity.label}</span>
                  {amenities.includes(amenity.key) && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Bailleur / Owner Contact */}
          <div className="p-3.5 rounded-2xl bg-muted/60 border border-border space-y-3 pt-2">
            <p className="font-bold text-foreground">Coordonnées du Bailleur / Propriétaire :</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nom du Bailleur *"
                type="text"
                placeholder="Ex: M. Ondoa"
                required
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
              />
              <Input
                label="Numéro WhatsApp Bailleur *"
                type="tel"
                placeholder="237 6XX XXX XXX"
                required
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Photos Upload */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-foreground block">Photos du logement :</label>
              <button
                type="button"
                onClick={() => setImages([
                  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&auto=format&fit=crop&q=80'
                ])}
                className="text-[10px] text-emerald-400 hover:underline font-bold"
              >
                + Utiliser 3 photos modèles HD
              </button>
            </div>
            <MultiImageUploadField
              label="Sélectionnez ou collez des URLs de photos"
              images={images}
              onChange={setImages}
            />
          </div>

          {/* Description */}
          <Textarea
            label="Description détaillée"
            placeholder="Précisez les avantages, la propreté, les conditions d'accès..."
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          <div className="pt-3 flex justify-end gap-2 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              <UploadCloud className="w-4 h-4 mr-1" /> Soumettre à l'Administrateur
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL APERÇU ================= */}
      {previewItem && (
        <Modal
          open={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={`Détails : ${previewItem.title}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2">
              {(previewItem.images && previewItem.images.length > 0 ? previewItem.images : [previewItem.image_url]).map((img, idx) => (
                <div key={idx} className="aspect-[16/10] rounded-xl overflow-hidden bg-card border border-border">
                  <img src={img} alt="Photo" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-muted/60 border border-border">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Loyer</p>
                <p className="font-extrabold text-sm text-emerald-400">{formatPrice(previewItem.price)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Quartier</p>
                <p className="font-bold text-foreground">{previewItem.city} - {previewItem.neighborhood}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Statut</p>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold",
                  previewItem.status === 'pending_review' && "bg-amber-500/20 text-amber-400",
                  previewItem.status === 'active' && "bg-emerald-500/20 text-emerald-400",
                  previewItem.status === 'rejected' && "bg-red-500/20 text-red-400"
                )}>
                  {previewItem.status}
                </span>
              </div>
            </div>

            <p className="p-3 rounded-xl bg-card border border-border text-muted-foreground">
              {previewItem.description}
            </p>

            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setPreviewItem(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  )
}
