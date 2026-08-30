import { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Home, Plus, Clock, CheckCircle2, XCircle, MapPin, Eye,
  Building2, Phone, AlertCircle, LogOut, Sparkles, BedDouble, Bath, Maximize2,
  Calendar, Info, RefreshCw, UploadCloud, Check, DollarSign, Wallet,
  Search, Share2, MessageSquare, Edit3, Navigation, ArrowUpRight, ShieldCheck,
  UserCheck, CreditCard, Send, Map
} from 'lucide-react'
import { HousingAPI, VisitBookingAPI, VisitRequestAPI, AuditLogAPI } from '@/lib/store'
import type { Housing, HousingCategory, HousingPriceType, VisitBooking, VisitRequest } from '@/types'
import { formatPrice, generateId, cn, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toastSuccess, toastError, toastInfo } from '@/components/ui/Toast'
import { useAuth } from '@/hooks/useAuth'
import { LocationPicker } from '@/components/shared/LocationPicker'
import { MultiImageUploadField } from '@/components/ui/MultiImageUploadField'
import LeafletMap, { MapMarkerItem } from '@/components/shared/LeafletMap'

const HOUSING_CATEGORIES: { key: HousingCategory; label: string }[] = [
  { key: 'studio', label: 'Studio Moderne' },
  { key: 'chambre', label: 'Chambre Étudiant / Cité' },
  { key: 'appartement', label: 'Appartement' },
  { key: 'villa', label: 'Villa / Duplex' },
]

const CITIES = ['Yaoundé', 'Douala', 'Buea', 'Bafoussam', 'Dschang', 'Ambam', 'Ebolowa', 'Kribi', 'Garoua', 'Maroua', 'Ngaoundéré']

export default function AssociateDashboardPage() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [, forceUpdate] = useState(0)

  // Current Associate ID
  const associateId = user?.id || 'associe-1'
  const associateName = user?.name || 'Marc - Agent Bastos'

  // Main Active Tab
  const [activeMainTab, setActiveMainTab] = useState<'housings' | 'visits' | 'wallet' | 'map'>('housings')

  // Sub-filter for housings
  const [housingStatusFilter, setHousingStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [housingSearch, setHousingSearch] = useState('')

  // Data lists
  const allHousings = HousingAPI.list() || []
  const allVisitBookings = VisitBookingAPI.list() || []
  const allVisitRequests = VisitRequestAPI.list() || []

  // Filter associate's submitted housings
  const myHousings = useMemo(() => {
    return allHousings.filter(h =>
      h.submitted_by_associate_id === associateId ||
      (isAdmin() && h.submitted_by_associate_id) ||
      h.submitted_by_associate_id === 'associe-1'
    )
  }, [allHousings, associateId, isAdmin])

  const pendingHousings = useMemo(() => myHousings.filter(h => h.status === 'pending_review'), [myHousings])
  const approvedHousings = useMemo(() => myHousings.filter(h => h.status === 'active' || h.status === 'available'), [myHousings])
  const rejectedHousings = useMemo(() => myHousings.filter(h => h.status === 'rejected'), [myHousings])

  // Filter associate's visits
  const myHousingIds = useMemo(() => new Set(myHousings.map(h => h.id)), [myHousings])
  const myVisits = useMemo(() => {
    return allVisitBookings.filter(v => myHousingIds.has(v.housing_id))
  }, [allVisitBookings, myHousingIds])

  // Housing Creation & Edition Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingHousingId, setEditingHousingId] = useState<string | null>(null)

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

  // Commission Withdrawal Modal
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('15000')
  const [withdrawPhone, setWithdrawPhone] = useState(user?.phone || '699112233')
  const [withdrawNetwork, setWithdrawNetwork] = useState<'mtn' | 'orange'>('mtn')

  const toggleAmenity = (key: string) => {
    setAmenities(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  // Open creation modal
  const openCreateModal = () => {
    setEditingHousingId(null)
    setTitle('')
    setCategory('studio')
    setPrice(50000)
    setPriceType('month')
    setDepositAmount(100000)
    setCity('Yaoundé')
    setNeighborhood('')
    setAddress('')
    setLatitude(3.868)
    setLongitude(11.521)
    setSurfaceSqm(30)
    setBedrooms(1)
    setBathrooms(1)
    setFurnished(false)
    setDescription('')
    setOwnerName('')
    setOwnerPhone('')
    setWhatsappNumber('')
    setImages([
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000&auto=format&fit=crop&q=80'
    ])
    setAmenities(['eau_gratuite', 'gardien'])
    setCreateModalOpen(true)
  }

  // Open edit modal for correcting a rejected housing or updating
  const openEditModal = (h: Housing) => {
    setEditingHousingId(h.id)
    setTitle(h.title)
    setCategory(h.category)
    setPrice(h.price)
    setPriceType(h.price_type)
    setDepositAmount(h.deposit_amount || 0)
    setCity(h.city)
    setNeighborhood(h.neighborhood)
    setAddress(h.address || '')
    setLatitude(h.latitude || 3.868)
    setLongitude(h.longitude || 11.521)
    setSurfaceSqm(h.surface_sqm || 25)
    setBedrooms(h.bedrooms || 1)
    setBathrooms(h.bathrooms || 1)
    setFurnished(h.furnished || false)
    setDescription(h.description || '')
    setOwnerName(h.owner_name || '')
    setOwnerPhone(h.owner_phone || '')
    setWhatsappNumber(h.whatsapp_number || '')
    setImages(h.images && h.images.length > 0 ? h.images : [h.image_url])
    setAmenities(h.amenities || ['eau_gratuite', 'gardien'])
    setCreateModalOpen(true)
  }

  // Submit housing form (Create or Update & Resubmit)
  const handleSaveHousingSubmit = (e: React.FormEvent) => {
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

    const cleanWhatsapp = (whatsappNumber.trim() || '237690000000').replace(/\s+/g, '')

    if (editingHousingId) {
      // Update & Resubmit
      HousingAPI.update(editingHousingId, {
        title: title.trim(),
        description: description.trim() || `Logement recensé et mis à jour par ${associateName}.`,
        category,
        price: Number(price) || 25000,
        price_type: priceType,
        deposit_amount: Number(depositAmount) || 0,
        city,
        neighborhood: neighborhood.trim(),
        address: address.trim() || undefined,
        latitude: Number(latitude) || 3.868,
        longitude: Number(longitude) || 11.521,
        surface_sqm: Number(surfaceSqm) || 25,
        bedrooms: Number(bedrooms) || 1,
        bathrooms: Number(bathrooms) || 1,
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
        whatsapp_number: cleanWhatsapp,
        status: 'pending_review',
        rejection_reason: undefined,
        updated_date: new Date().toISOString()
      })

      AuditLogAPI.create({
        timestamp: new Date().toISOString(),
        admin_name: associateName,
        action: `Mise à jour & Re-soumission logement : ${title.trim()}`,
        details: `Logement re-soumis pour validation après corrections.`,
        severity: 'info'
      })

      toastSuccess('Logement mis à jour et re-soumis ! 🚀', 'Transmis à l\'administrateur pour validation.')
    } else {
      // Create New
      const newHousing: Housing = {
        id: `house-${generateId().slice(0, 8)}`,
        title: title.trim(),
        description: description.trim() || `Logement recensé et vérifié sur le terrain par l'agent associé ${associateName}.`,
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
        whatsapp_number: cleanWhatsapp,
        status: 'pending_review',
        submitted_by_associate_id: associateId,
        submitted_by_associate_name: associateName,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      }

      HousingAPI.create(newHousing)

      AuditLogAPI.create({
        timestamp: new Date().toISOString(),
        admin_name: associateName,
        action: `Soumission nouveau logement : ${newHousing.title}`,
        details: `En attente de validation administrative. Quartier : ${newHousing.neighborhood} (${newHousing.city})`,
        severity: 'info'
      })

      toastSuccess('Logement enregistré avec succès ! 🚀', 'Transmis à l\'administrateur dans l\'onglet Soumissions.')
    }

    setCreateModalOpen(false)
    setEditingHousingId(null)
    forceUpdate(n => n + 1)
  }

  // Handle visit confirmation
  const handleUpdateVisitStatus = (visitId: string, newStatus: 'confirmed' | 'cancelled') => {
    VisitBookingAPI.update(visitId, {
      status: newStatus,
      updated_date: new Date().toISOString()
    })
    toastSuccess(newStatus === 'confirmed' ? 'Visite confirmée avec le client ! 📅' : 'Visite annulée')
    forceUpdate(n => n + 1)
  }

  // Handle commission withdrawal
  const handleWithdrawCommission = (e: React.FormEvent) => {
    e.preventDefault()
    toastSuccess('Demande de retrait enregistrée ! 💸', `Versement de ${formatPrice(Number(withdrawAmount))} sur le numéro ${withdrawPhone} (${withdrawNetwork.toUpperCase()}) en cours de traitement.`)
    setWithdrawalModalOpen(false)
  }

  // Filtered housings list
  const filteredHousings = useMemo(() => {
    let list = myHousings
    if (housingStatusFilter === 'pending') list = pendingHousings
    if (housingStatusFilter === 'approved') list = approvedHousings
    if (housingStatusFilter === 'rejected') list = rejectedHousings

    if (housingSearch.trim()) {
      const q = housingSearch.toLowerCase()
      list = list.filter(h =>
        h.title.toLowerCase().includes(q) ||
        h.neighborhood.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q)
      )
    }
    return list
  }, [myHousings, pendingHousings, approvedHousings, rejectedHousings, housingStatusFilter, housingSearch])

  // Map markers for associate's housings
  const mapMarkers: MapMarkerItem[] = useMemo(() => {
    return myHousings.map(h => ({
      id: h.id,
      title: h.title,
      type: 'housing',
      latitude: h.latitude || 3.868,
      longitude: h.longitude || 11.521,
      price: formatPrice(h.price),
      subtitle: `${h.city} • ${h.neighborhood} (${h.status})`,
      image_url: h.image_url,
      link_url: `/housing/${h.id}`
    }))
  }, [myHousings])

  // Commission Stats
  const totalCommissionEarned = (approvedHousings.length * 5000) + (myVisits.filter(v => v.status === 'confirmed').length * 2000)
  const pendingCommission = pendingHousings.length * 5000

  return (
    <div className="min-h-screen pb-20 space-y-6 w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 animate-in fade-in duration-200">
      
      {/* Associate Welcome Banner */}
      <div className="card-glass p-6 md:p-8 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-amber-950/60 border-emerald-500/30 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center border border-emerald-500/30 text-lg shadow-sm">
              🤝
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2 flex-wrap">
                Espace Associé & Agent Terrain
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  OroMall Immobilier
                </span>
              </h1>
              <p className="text-xs text-muted-foreground">
                Agent connecté : <strong className="text-emerald-400">{associateName}</strong> ({user?.email || 'associe@oromall.cm'})
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl pt-1">
            Recensez les chambres, studios et appartements sur le terrain, gérez vos visites clients et suivez vos commissions de parrainage.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 px-5 rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 shrink-0"
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

      {/* Main KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card-glass p-4 rounded-2xl border-border space-y-1">
          <p className="text-[11px] text-muted-foreground font-bold uppercase">Logements Recensés</p>
          <p className="text-2xl font-black text-foreground">{myHousings.length}</p>
          <span className="text-[10px] text-muted-foreground">Dans votre zone</span>
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

        <div className="card-glass p-4 rounded-2xl border-primary/30 bg-primary/5 space-y-1">
          <p className="text-[11px] text-primary font-bold uppercase">Portefeuille Primes</p>
          <p className="text-2xl font-black text-primary">{formatPrice(totalCommissionEarned)}</p>
          <span className="text-[10px] text-emerald-400">+{formatPrice(pendingCommission)} en attente</span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'housings', label: `🏠 Mes Logements (${myHousings.length})`, icon: Home },
          { id: 'visits', label: `📅 Visites Clients (${myVisits.length})`, icon: Calendar },
          { id: 'wallet', label: `💰 Mon Portefeuille & Primes`, icon: Wallet },
          { id: 'map', label: `📍 Carte de ma Zone`, icon: Map },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveMainTab(t.id as any)}
            className={cn(
              "px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2",
              activeMainTab === t.id
                ? "bg-primary text-black shadow-md font-black"
                : "bg-muted/70 text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ================= ONGLET 1 : MES LOGEMENTS ================= */}
      {activeMainTab === 'housings' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: `Tous (${myHousings.length})` },
                { id: 'pending', label: `🟡 En attente (${pendingHousings.length})` },
                { id: 'approved', label: `🟢 Validés (${approvedHousings.length})` },
                { id: 'rejected', label: `🔴 Rejetés (${rejectedHousings.length})` },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setHousingStatusFilter(t.id as any)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    housingStatusFilter === t.id
                      ? "bg-emerald-600 text-white shadow-xs font-black"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher par quartier, titre..."
                value={housingSearch}
                onChange={e => setHousingSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-card border border-border text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Listings Grid */}
          {filteredHousings.length === 0 ? (
            <div className="card-glass p-12 text-center space-y-3 rounded-3xl border-border">
              <Home className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">Aucun logement trouvé</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Commencez à recenser des studios, chambres ou résidences pour alimenter la plateforme.
              </p>
              <Button onClick={openCreateModal} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                <Plus className="w-4 h-4" /> Enregistrer mon premier bien
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredHousings.map(h => (
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
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-lg bg-black/80 text-white text-[10px] font-bold capitalize backdrop-blur-xs">
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
                        {h.status === 'rejected' && "🔴 Rejeté (À corriger)"}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-emerald-400 transition-colors">
                          {h.title}
                        </h3>
                        <span className="text-xs font-black text-emerald-400 shrink-0">
                          {formatPrice(h.price)}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        {h.city} • {h.neighborhood} {h.address ? `(${h.address})` : ''}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/40">
                        <span>📐 {h.surface_sqm} m²</span>
                        <span>• 🛏️ {h.bedrooms} ch.</span>
                        <span>• 🚿 {h.bathrooms} sdb</span>
                      </div>

                      {/* Bailleur contact */}
                      <div className="p-2.5 rounded-xl bg-muted/60 text-[11px] flex items-center justify-between">
                        <span className="text-muted-foreground">Bailleur : <strong>{h.owner_name}</strong></span>
                        <a
                          href={buildWhatsAppUrl(h.whatsapp_number, `Bonjour ${h.owner_name}, je suis ${associateName} agent OroMall pour votre bien "${h.title}".`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 font-bold hover:underline flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </a>
                      </div>

                      {/* Rejection motif */}
                      {h.status === 'rejected' && h.rejection_reason && (
                        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400 space-y-1">
                          <p className="font-bold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Motif du refus par l'Admin :</p>
                          <p className="text-xs text-muted-foreground">{h.rejection_reason}</p>
                          <Button
                            size="sm"
                            onClick={() => openEditModal(h)}
                            className="w-full mt-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold h-7"
                          >
                            <Edit3 className="w-3 h-3 mr-1" /> Corriger et Re-soumettre à l'Admin
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 pt-0 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewItem(h)}
                      className="flex-1 text-xs justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Aperçu
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(h)}
                      className="text-xs justify-center gap-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Modifier
                    </Button>

                    {h.status === 'active' && (
                      <Link
                        to={`/housing/${h.id}`}
                        target="_blank"
                        className="py-1.5 px-2.5 rounded-xl bg-primary text-black font-bold text-xs flex items-center justify-center shrink-0"
                        title="Voir la page publique"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= ONGLET 2 : VISITES CLIENTS ================= */}
      {activeMainTab === 'visits' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div>
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Rendez-vous & Visites Programmées par les Clients
            </h2>
            <p className="text-xs text-muted-foreground">
              Les clients intéressés par vos logements recensés demandent des visites. Contactez-les directement pour convenir du rendez-vous avec le bailleur.
            </p>
          </div>

          {myVisits.length === 0 ? (
            <div className="card-glass p-12 text-center space-y-3 rounded-3xl border-border">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">Aucune demande de visite pour le moment</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Dès qu'un client réserve un créneau pour visiter l'un de vos logements, son contact apparaîtra ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myVisits.map(visit => (
                <div key={visit.id} className="card-glass p-5 rounded-3xl border border-border space-y-3 shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-foreground text-sm">{visit.housing_title}</h4>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-primary" /> Date : {visit.visit_date} à {visit.visit_time}
                      </p>
                    </div>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold",
                      visit.status === 'confirmed' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                    )}>
                      {visit.status === 'confirmed' ? '🟢 Confirmée' : '🟡 En attente'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-muted/60 space-y-1 text-xs">
                    <p className="font-bold text-foreground">Client : {visit.user_name}</p>
                    <p className="text-muted-foreground">Téléphone : <strong>{visit.user_phone}</strong></p>
                    {visit.message && <p className="text-muted-foreground italic">"{visit.message}"</p>}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={buildWhatsAppUrl(visit.user_phone, `Bonjour ${visit.user_name}, je suis ${associateName} agent OroMall pour votre demande de visite du logement "${visit.housing_title}". Êtes-vous disponible pour le créneau ?`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Écrire sur WhatsApp
                    </a>

                    {visit.status !== 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateVisitStatus(visit.id, 'confirmed')}
                        className="bg-primary text-black font-bold text-xs py-2 px-3 rounded-xl"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirmer RDV
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= ONGLET 3 : PORTEFEUILLE & PRIMES ================= */}
      {activeMainTab === 'wallet' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="card-glass p-6 md:p-8 rounded-3xl border-primary/30 bg-gradient-to-r from-slate-900 via-card to-emerald-950/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <span className="badge-primary bg-primary/20 text-primary border border-primary/30 text-xs">
                Portefeuille Rémunération Agent OroMall 💸
              </span>
              <h2 className="text-3xl font-black text-foreground">
                {formatPrice(totalCommissionEarned)}
              </h2>
              <p className="text-xs text-muted-foreground">
                Gains accumulés : <strong>5 000 FCFA</strong> par logement validé et mis en ligne + primes de visites.
              </p>
            </div>

            <Button
              onClick={() => setWithdrawalModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-black font-black text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-primary/20 flex items-center gap-2 shrink-0"
            >
              <Send className="w-4 h-4" /> Demander un Retrait MoMo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="card-glass p-4 rounded-2xl border-border space-y-1">
              <p className="text-muted-foreground font-bold uppercase text-[10px]">Logements rémunérés</p>
              <p className="text-xl font-black text-emerald-400">{approvedHousings.length} validés</p>
              <p className="text-[11px] text-muted-foreground">{formatPrice(approvedHousings.length * 5000)} perçus</p>
            </div>
            <div className="card-glass p-4 rounded-2xl border-border space-y-1">
              <p className="text-muted-foreground font-bold uppercase text-[10px]">Visites confirmées</p>
              <p className="text-xl font-black text-primary">{myVisits.filter(v => v.status === 'confirmed').length} effectuées</p>
              <p className="text-[11px] text-muted-foreground">{formatPrice(myVisits.filter(v => v.status === 'confirmed').length * 2000)} primes</p>
            </div>
            <div className="card-glass p-4 rounded-2xl border-border space-y-1">
              <p className="text-muted-foreground font-bold uppercase text-[10px]">En cours de traitement</p>
              <p className="text-xl font-black text-amber-400">{pendingHousings.length} annonces</p>
              <p className="text-[11px] text-muted-foreground">+{formatPrice(pendingHousings.length * 5000)} dès validation</p>
            </div>
          </div>
        </div>
      )}

      {/* ================= ONGLET 4 : CARTE DE MA ZONE ================= */}
      {activeMainTab === 'map' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Map className="w-5 h-5 text-primary" /> Visualisation Géographique de vos {myHousings.length} Biens Recensés
            </h3>
            <span className="text-xs text-muted-foreground">
              {myHousings.length} repères sur OpenStreetMap
            </span>
          </div>

          <LeafletMap
            markers={mapMarkers}
            center={[3.868, 11.521]}
            zoom={13}
            height="500px"
            className="border-emerald-500/40 shadow-xl"
          />
        </div>
      )}

      {/* ================= MODAL ENREGISTRER / MODIFIER UN LOGEMENT ================= */}
      <Modal
        open={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setEditingHousingId(null); }}
        title={editingHousingId ? "Modifier & Re-soumettre le logement" : "Enregistrer un nouveau logement / studio"}
        size="lg"
      >
        <form onSubmit={handleSaveHousingSubmit} className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
          
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
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-emerald-500 cursor-pointer"
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
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-emerald-500 cursor-pointer"
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
                className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-emerald-500 cursor-pointer"
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
            <label className="font-bold text-foreground block">Position GPS sur la carte (Calcul des distances) :</label>
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
              <label className="font-bold text-foreground block">Photos réelles du bien :</label>
              <button
                type="button"
                onClick={() => setImages([
                  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&auto=format&fit=crop&q=80'
                ])}
                className="text-[10px] text-emerald-400 hover:underline font-bold"
              >
                + Utiliser photos modèles HD
              </button>
            </div>
            <MultiImageUploadField
              label="Sélectionnez ou collez des photos"
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
            <Button type="button" variant="ghost" onClick={() => { setCreateModalOpen(false); setEditingHousingId(null); }}>
              Annuler
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              <UploadCloud className="w-4 h-4 mr-1" /> {editingHousingId ? "Mettre à jour & Re-soumettre" : "Soumettre à l'Administrateur"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL RETRAIT COMMISSION ================= */}
      {withdrawalModalOpen && (
        <Modal
          open={withdrawalModalOpen}
          onClose={() => setWithdrawalModalOpen(false)}
          title="Demande de retrait Mobile Money (Primes)"
        >
          <form onSubmit={handleWithdrawCommission} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <p className="font-bold text-emerald-400">Solde disponible : {formatPrice(totalCommissionEarned)}</p>
              <p className="text-muted-foreground text-[11px]">Paiement instantané sur votre compte MTN Mobile Money ou Orange Money.</p>
            </div>

            <Input
              label="Montant à retirer (FCFA) *"
              type="number"
              min="5000"
              max={totalCommissionEarned || 100000}
              required
              value={withdrawAmount}
              onChange={e => setWithdrawAmount(e.target.value)}
            />

            <div>
              <label className="form-label block mb-1 font-semibold">Opérateur Mobile Money *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setWithdrawNetwork('mtn')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors",
                    withdrawNetwork === 'mtn' ? "bg-amber-500 text-black border-amber-500 font-black" : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  MTN Mobile Money
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawNetwork('orange')}
                  className={cn(
                    "p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors",
                    withdrawNetwork === 'orange' ? "bg-orange-500 text-white border-orange-500 font-black" : "bg-muted text-muted-foreground border-border"
                  )}
                >
                  Orange Money
                </button>
              </div>
            </div>

            <Input
              label="Numéro de réception *"
              type="tel"
              placeholder="6XX XXX XXX"
              required
              value={withdrawPhone}
              onChange={e => setWithdrawPhone(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setWithdrawalModalOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-primary text-black font-bold">
                Confirmer le retrait
              </Button>
            </div>
          </form>
        </Modal>
      )}

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
