import { useState, useMemo } from 'react'
import {
  Home, Plus, Edit3, Trash2, Eye, MapPin, CheckCircle, Clock,
  AlertCircle, Sparkles, Navigation, Copy, Phone, MessageSquare,
  ShieldCheck, Check, Layers, Image as ImageIcon, Video, FileText
} from 'lucide-react'
import type { Housing, HousingCategory, HousingStatus } from '@/types'
import { HousingAPI } from '@/lib/store'
import { formatPrice, cn, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { MultiImageUploadField } from '@/components/ui/MultiImageUploadField'
import { FileUploadField } from '@/components/ui/FileUploadField'
import { LocationPicker } from '@/components/shared/LocationPicker'
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
  const [editingHousing, setEditingHousing] = useState<Housing | null>(null)

  // Basic Info
  const [hTitle, setHTitle] = useState('')
  const [hDesc, setHDesc] = useState('')
  const [hCategory, setHCategory] = useState<HousingCategory>('studio')
  const [hPropertyType, setHPropertyType] = useState<'residential' | 'commercial' | 'land' | 'office'>('residential')
  const [hCity, setHCity] = useState('Yaoundé')
  const [hNeighborhood, setHNeighborhood] = useState('')
  const [hAddress, setHAddress] = useState('')

  // Contact Bailleur (OBLIGATOIRE)
  const [hOwnerName, setHOwnerName] = useState('')
  const [hOwnerPhone, setHOwnerPhone] = useState('')
  const [hWhatsappNumber, setHWhatsappNumber] = useState('')
  const [hSecondaryPhone, setHSecondaryPhone] = useState('')

  // Pricing
  const [hPrice, setHPrice] = useState('')
  const [hPriceType, setHPriceType] = useState<'month' | 'day'>('month')
  const [hPriceNegotiable, setHPriceNegotiable] = useState(false)
  const [hDeposit, setHDeposit] = useState('')
  const [hPaymentFreq, setHPaymentFreq] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')

  // Property Details
  const [hSurface, setHSurface] = useState('')
  const [hLotSize, setHLotSize] = useState('')
  const [hBedrooms, setHBedrooms] = useState('1')
  const [hBathrooms, setHBathrooms] = useState('1')
  const [hLivingRooms, setHLivingRooms] = useState('0')
  const [hKitchens, setHKitchens] = useState('1')
  const [hBalconies, setHBalconies] = useState('0')
  const [hParking, setHParking] = useState('0')
  const [hStorage, setHStorage] = useState('0')
  const [hFloor, setHFloor] = useState('')
  const [hYearBuilt, setHYearBuilt] = useState('')
  const [hFurnished, setHFurnished] = useState(false)
  const [hFurnishedKitchen, setHFurnishedKitchen] = useState(false)
  const [hAirCon, setHAirCon] = useState(false)
  const [hHeating, setHHeating] = useState(false)
  const [hPool, setHPool] = useState(false)
  const [hGarden, setHGarden] = useState(false)
  const [hTerrace, setHTerrace] = useState(false)

  // Utilities & Services
  const [hWaterSource, setHWaterSource] = useState<'city' | 'well' | 'borehole' | 'none'>('borehole')
  const [hElecSource, setHElecSource] = useState<'grid' | 'solar' | 'generator' | 'none'>('grid')
  const [hInternet, setHInternet] = useState(false)
  const [hSecurity, setHSecurity] = useState(true)
  const [hPets, setHPets] = useState(false)
  const [hSmoking, setHSmoking] = useState(false)

  // Legal & Availability
  const [hLegalStatus, setHLegalStatus] = useState<'title_deed' | 'permit' | 'none'>('permit')
  const [hOccupancy, setHOccupancy] = useState<'vacant' | 'occupied' | 'reserved'>('vacant')
  const [hAvailableFrom, setHAvailableFrom] = useState('')
  const [hMinStay, setHMinStay] = useState('12')

  // Nearby & Viewing
  const [hNearbySchools, setHNearbySchools] = useState(false)
  const [hNearbyHospitals, setHNearbyHospitals] = useState(false)
  const [hNearbyMarkets, setHNearbyMarkets] = useState(false)
  const [hPublicTransport, setHPublicTransport] = useState(false)
  const [hViewingTimes, setHViewingTimes] = useState('Lun-Sam 8h-18h')
  const [hVideoUrl, setHVideoUrl] = useState('')
  const [hDocumentsUrl, setHDocumentsUrl] = useState('')
  const [hVideoFile, setHVideoFile] = useState<string | undefined>(undefined)
  const [hDocumentFile, setHDocumentFile] = useState<string | undefined>(undefined)

  // Images
  const [hImages, setHImages] = useState<string[]>([])

  // Location
  const [hLatitude, setHLatitude] = useState('3.868')
  const [hLongitude, setHLongitude] = useState('11.521')

  const resetForm = () => {
    setEditingHousing(null)
    setHTitle('')
    setHDesc('')
    setHCategory('studio')
    setHPropertyType('residential')
    setHCity('Yaoundé')
    setHNeighborhood('')
    setHAddress('')
    setHOwnerName('')
    setHOwnerPhone(shopWhatsapp || '')
    setHWhatsappNumber(shopWhatsapp || '237677000000')
    setHSecondaryPhone('')
    setHPrice('')
    setHPriceType('month')
    setHPriceNegotiable(false)
    setHDeposit('')
    setHPaymentFreq('monthly')
    setHSurface('')
    setHLotSize('')
    setHBedrooms('1')
    setHBathrooms('1')
    setHLivingRooms('0')
    setHKitchens('1')
    setHBalconies('0')
    setHParking('0')
    setHStorage('0')
    setHFloor('')
    setHYearBuilt('')
    setHFurnished(false)
    setHFurnishedKitchen(false)
    setHAirCon(false)
    setHHeating(false)
    setHPool(false)
    setHGarden(false)
    setHTerrace(false)
    setHWaterSource('borehole')
    setHElecSource('grid')
    setHInternet(false)
    setHSecurity(true)
    setHPets(false)
    setHSmoking(false)
    setHLegalStatus('permit')
    setHOccupancy('vacant')
    setHAvailableFrom('')
    setHMinStay('12')
    setHNearbySchools(false)
    setHNearbyHospitals(false)
    setHNearbyMarkets(false)
    setHPublicTransport(false)
    setHViewingTimes('Lun-Sam 8h-18h')
    setHVideoUrl('')
    setHDocumentsUrl('')
    setHVideoFile(undefined)
    setHDocumentFile(undefined)
    setHImages([])
    setHLatitude('3.868')
    setHLongitude('11.521')
  }

  const openNewHousingModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEditHousingModal = (h: Housing) => {
    setEditingHousing(h)
    setHTitle(h.title)
    setHDesc(h.description || '')
    setHCategory(h.category)
    setHPropertyType(h.property_type || 'residential')
    setHCity(h.city || 'Yaoundé')
    setHNeighborhood(h.neighborhood || '')
    setHAddress(h.address || '')
    setHOwnerName(h.owner_name || '')
    setHOwnerPhone(h.owner_phone || h.whatsapp_number || '')
    setHWhatsappNumber(h.whatsapp_number || '')
    setHSecondaryPhone(h.secondary_phone || '')
    setHPrice(String(h.price))
    setHPriceType(h.price_type || 'month')
    setHPriceNegotiable(!!h.price_negotiable)
    setHDeposit(h.deposit_amount ? String(h.deposit_amount) : '')
    setHPaymentFreq(h.payment_frequency || 'monthly')
    setHSurface(h.surface_sqm ? String(h.surface_sqm) : '')
    setHLotSize(h.lot_size_sqm ? String(h.lot_size_sqm) : '')
    setHBedrooms(String(h.bedrooms || 1))
    setHBathrooms(String(h.bathrooms || 1))
    setHLivingRooms(String(h.living_rooms || 0))
    setHKitchens(String(h.kitchens || 1))
    setHBalconies(String(h.balconies || 0))
    setHParking(String(h.parking_spaces || 0))
    setHStorage(String(h.storage_rooms || 0))
    setHFloor(h.floor_number ? String(h.floor_number) : '')
    setHYearBuilt(h.year_built ? String(h.year_built) : '')
    setHFurnished(!!h.furnished)
    setHFurnishedKitchen(!!h.furnished_kitchen)
    setHAirCon(!!h.air_conditioning)
    setHHeating(!!h.heating)
    setHPool(!!h.swimming_pool)
    setHGarden(!!h.garden)
    setHTerrace(!!h.terrace)
    setHWaterSource(h.water_source || 'borehole')
    setHElecSource(h.electricity_source || 'grid')
    setHInternet(!!h.internet_available)
    setHSecurity(!!h.security_24h)
    setHPets(!!h.pets_allowed)
    setHSmoking(!!h.smoking_allowed)
    setHLegalStatus(h.legal_status || 'permit')
    setHOccupancy(h.occupancy_status || 'vacant')
    setHAvailableFrom(h.available_from ? h.available_from.slice(0, 10) : '')
    setHMinStay(String(h.minimum_stay_months || 12))
    setHNearbySchools(!!h.nearby_schools)
    setHNearbyHospitals(!!h.nearby_hospitals)
    setHNearbyMarkets(!!h.nearby_markets)
    setHPublicTransport(!!h.public_transport_access)
    setHViewingTimes(h.viewing_times || '')
    setHVideoUrl(h.video_url || '')
    setHDocumentsUrl(h.property_documents_url || '')
    setHImages(h.images && h.images.length > 0 ? [h.image_url, ...h.images] : (h.image_url ? [h.image_url] : []))
    setHLatitude(String(h.latitude || 3.868))
    setHLongitude(String(h.longitude || 11.521))
    setModalOpen(true)
  }

  // DUPLICATION EN 1 CLIC IMMÉDIATE (Idéal pour immeubles à chambres identiques)
  const handleDuplicateHousing = (h: Housing, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    // Calculer le prochain numéro de copie
    const baseTitle = h.title.replace(/\s*\(Chambre\s*\d+\)/gi, '').replace(/\s*\(Copie\s*\d*\)/gi, '').trim()
    const existingCopies = housings.filter(item => item.title.startsWith(baseTitle)).length
    const nextNum = existingCopies + 1
    const copyTitle = `${baseTitle} (Chambre ${nextNum})`

    const secondaryImages = h.images && h.images.length > 0 ? h.images : []

    HousingAPI.create({
      title: copyTitle,
      description: h.description || h.title,
      category: h.category,
      property_type: h.property_type || 'residential',
      price: h.price,
      price_type: h.price_type || 'month',
      price_negotiable: !!h.price_negotiable,
      deposit_amount: h.deposit_amount || 0,
      payment_frequency: h.payment_frequency || 'monthly',
      city: h.city || 'Yaoundé',
      neighborhood: h.neighborhood || 'Bastos',
      address: h.address || `${h.neighborhood || 'Bastos'}, ${h.city || 'Yaoundé'}`,
      latitude: h.latitude || 3.868,
      longitude: h.longitude || 11.521,
      surface_sqm: h.surface_sqm || 25,
      lot_size_sqm: h.lot_size_sqm,
      bedrooms: h.bedrooms || 1,
      bathrooms: h.bathrooms || 1,
      living_rooms: h.living_rooms || 0,
      kitchens: h.kitchens || 1,
      balconies: h.balconies || 0,
      parking_spaces: h.parking_spaces || 0,
      storage_rooms: h.storage_rooms || 0,
      floor_number: h.floor_number,
      year_built: h.year_built,
      furnished: !!h.furnished,
      furnished_kitchen: !!h.furnished_kitchen,
      air_conditioning: !!h.air_conditioning,
      heating: !!h.heating,
      swimming_pool: !!h.swimming_pool,
      garden: !!h.garden,
      terrace: !!h.terrace,
      water_source: h.water_source || 'borehole',
      electricity_source: h.electricity_source || 'grid',
      internet_available: !!h.internet_available,
      security_24h: h.security_24h !== undefined ? h.security_24h : true,
      pets_allowed: !!h.pets_allowed,
      smoking_allowed: !!h.smoking_allowed,
      legal_status: h.legal_status || 'permit',
      occupancy_status: 'vacant',
      available_from: new Date().toISOString(),
      minimum_stay_months: h.minimum_stay_months || 12,
      amenities: h.amenities && h.amenities.length > 0 ? h.amenities : ['eau_gratuite', 'gardien'],
      images: secondaryImages,
      image_url: h.image_url || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      video_url: h.video_url,
      property_documents_url: h.property_documents_url,
      owner_name: h.owner_name || 'Bailleur Propriétaire',
      owner_email: h.owner_email || userEmail,
      owner_phone: h.owner_phone || h.whatsapp_number || '237677000000',
      whatsapp_number: h.whatsapp_number || h.owner_phone || '237677000000',
      secondary_phone: h.secondary_phone,
      viewing_times: h.viewing_times || 'Lun-Sam 8h-18h',
      nearby_schools: !!h.nearby_schools,
      nearby_hospitals: !!h.nearby_hospitals,
      nearby_markets: !!h.nearby_markets,
      public_transport_access: !!h.public_transport_access,
      status: 'available',
      rating: 5.0,
      reviews_count: 1
    })

    toastSuccess(`Logement "${copyTitle}" dupliqué en 1 clic ! 🏠✨`)
    onRefresh()
  }

  const buildAmenities = (): string[] => {
    const amenities: string[] = []
    if (hInternet) amenities.push('wifi')
    if (hWaterSource === 'borehole') amenities.push('eau_gratuite')
    if (hSecurity) amenities.push('gardien')
    if (Number(hParking) > 0) amenities.push('parking')
    if (hAirCon) amenities.push('climatisation')
    if (hPool) amenities.push('piscine')
    if (hGarden) amenities.push('jardin')
    if (hTerrace) amenities.push('terrasse')
    if (hFurnishedKitchen) amenities.push('cuisine_equipee')
    if (hHeating) amenities.push('chauffage')
    if (hElecSource === 'generator') amenities.push('groupe_electrogene')
    if (hElecSource === 'solar') amenities.push('electricite_solaire')
    if (hPets) amenities.push('animaux_autorises')
    if (hSmoking) amenities.push('fumer_autorise')
    if (hNearbySchools) amenities.push('ecoles_proximite')
    if (hNearbyHospitals) amenities.push('hopitaux_proximite')
    if (hNearbyMarkets) amenities.push('marches_proximite')
    if (hPublicTransport) amenities.push('transport_public')
    return amenities
  }

  const handleToggleStatus = (housingId: string, currentStatus: HousingStatus) => {
    const nextStatus: HousingStatus = currentStatus === 'available' ? 'rented' : 'available'
    HousingAPI.update(housingId, { status: nextStatus })
    toastSuccess(`Statut du logement mis à jour : ${nextStatus === 'available' ? 'Disponible 🟢' : 'Loué / Occupé 🔴'}`)
    onRefresh()
  }

  const handleSaveHousing = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hTitle || !hPrice || !hNeighborhood) {
      toastError('Veuillez remplir le titre, le loyer et le quartier.')
      return
    }

    if (!hOwnerPhone && !hWhatsappNumber) {
      toastError('Veuillez renseigner le numéro de téléphone ou WhatsApp du bailleur.')
      return
    }

    const mainImage = hImages[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
    const secondaryImages = hImages.slice(1)

    const payload = {
      title: hTitle,
      description: hDesc || hTitle,
      category: hCategory,
      property_type: hPropertyType,
      price: Number(hPrice),
      price_type: hPriceType,
      price_negotiable: hPriceNegotiable,
      deposit_amount: Number(hDeposit) || 0,
      payment_frequency: hPaymentFreq,
      city: hCity,
      neighborhood: hNeighborhood,
      address: hAddress || `${hNeighborhood}, ${hCity}`,
      latitude: Number(hLatitude) || 3.868,
      longitude: Number(hLongitude) || 11.521,
      surface_sqm: Number(hSurface) || 25,
      lot_size_sqm: hLotSize ? Number(hLotSize) : undefined,
      bedrooms: Number(hBedrooms) || 1,
      bathrooms: Number(hBathrooms) || 1,
      living_rooms: Number(hLivingRooms) || 0,
      kitchens: Number(hKitchens) || 1,
      balconies: Number(hBalconies) || 0,
      parking_spaces: Number(hParking) || 0,
      storage_rooms: Number(hStorage) || 0,
      floor_number: hFloor ? Number(hFloor) : undefined,
      year_built: hYearBuilt ? Number(hYearBuilt) : undefined,
      furnished: hFurnished,
      furnished_kitchen: hFurnishedKitchen,
      air_conditioning: hAirCon,
      heating: hHeating,
      swimming_pool: hPool,
      garden: hGarden,
      terrace: hTerrace,
      water_source: hWaterSource,
      electricity_source: hElecSource,
      internet_available: hInternet,
      security_24h: hSecurity,
      pets_allowed: hPets,
      smoking_allowed: hSmoking,
      legal_status: hLegalStatus,
      occupancy_status: hOccupancy,
      available_from: hAvailableFrom || new Date().toISOString(),
      minimum_stay_months: Number(hMinStay) || 12,
      amenities: buildAmenities(),
      images: secondaryImages,
      image_url: mainImage,
      video_url: hVideoFile || hVideoUrl || undefined,
      property_documents_url: hDocumentFile || hDocumentsUrl || undefined,
      owner_name: hOwnerName || 'Bailleur Propriétaire',
      owner_email: userEmail,
      owner_phone: hOwnerPhone || hWhatsappNumber,
      whatsapp_number: hWhatsappNumber || hOwnerPhone || '237677000000',
      secondary_phone: hSecondaryPhone || undefined,
      viewing_times: hViewingTimes || undefined,
      nearby_schools: hNearbySchools,
      nearby_hospitals: hNearbyHospitals,
      nearby_markets: hNearbyMarkets,
      public_transport_access: hPublicTransport,
      status: editingHousing ? editingHousing.status : 'available' as HousingStatus,
      rating: 5.0,
      reviews_count: 1
    }

    if (editingHousing) {
      HousingAPI.update(editingHousing.id, payload)
      toastSuccess('Logement modifié avec succès ! 🏠')
    } else {
      HousingAPI.create(payload)
      toastSuccess('Nouveau logement ajouté au portefeuille ! 🚀')
    }

    setModalOpen(false)
    resetForm()
    onRefresh()
  }

  const handleDeleteHousing = (id: string) => {
    if (confirm('Retirer définitivement cette annonce du portefeuille immobilier ?')) {
      HousingAPI.delete(id)
      toastSuccess('Annonce retirée.')
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
            <Home className="w-5 h-5 text-emerald-400" /> Gestion Immobilière & Chambres ({housings.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Publiez, modifiez et dupliquez vos logements et chambres identiques en 1 clic.
          </p>
        </div>

        <Button onClick={openNewHousingModal} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 text-xs font-bold">
          <Plus className="w-4 h-4" /> Nouveau Logement
        </Button>
      </div>

      {/* Category Filters */}
      <div className="card-glass p-3 flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'all', label: `Tous (${housings.length})` },
          { id: 'studio', label: `Studios (${housings.filter(h => h.category === 'studio').length})` },
          { id: 'chambre', label: `Chambres Étudiantes (${housings.filter(h => h.category === 'chambre').length})` },
          { id: 'appartement', label: `Appartements (${housings.filter(h => h.category === 'appartement').length})` },
          { id: 'villa', label: `Villas & Duplex (${housings.filter(h => h.category === 'villa' || (h.category as any) === 'duplex').length})` },
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
            <Button onClick={openNewHousingModal} variant="outline" size="sm">Publier un logement</Button>
          </div>
        ) : (
          filteredHousings.map(h => (
            <div key={h.id} className="card-glass p-4 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all group">
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border/50">
                  <img src={h.image_url} alt={h.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  
                  {(h.images && h.images.length > 0) && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                      +{h.images.length} photo{h.images.length > 1 ? 's' : ''}
                    </span>
                  )}
                  
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

                {/* Bailleur details badge */}
                <div className="p-2 rounded-xl bg-muted/40 border border-border/40 text-[11px] space-y-1">
                  <p className="font-semibold text-foreground flex items-center justify-between">
                    <span>Bailleur : {h.owner_name || 'Non spécifié'}</span>
                    {h.whatsapp_number && (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <Phone className="w-2.5 h-2.5" /> {h.whatsapp_number}
                      </span>
                    )}
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

                {/* Action Buttons: Modifier, Dupliquer, Status, Delete */}
                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => openEditHousingModal(h)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
                      title="Modifier les détails du logement"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Modifier
                    </Button>

                    <Button
                      onClick={() => handleDuplicateHousing(h)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs gap-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                      title="Dupliquer pour une chambre/appartement similaire"
                    >
                      <Copy className="w-3.5 h-3.5" /> Dupliquer
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button onClick={() => handleToggleStatus(h.id, h.status)} variant="outline" size="sm" className="h-8 text-xs">
                      {h.status === 'available' ? 'Loué' : 'Dispo'}
                    </Button>
                    <Button onClick={() => handleDeleteHousing(h.id)} variant="ghost" size="sm" className="h-8 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit / Duplicate Housing Modal */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title={editingHousing ? `Modifier le logement : ${editingHousing.title}` : "Publier ou dupliquer un logement"}
        size="xl"
      >
        <form onSubmit={handleSaveHousing} className="space-y-6 max-h-[78vh] overflow-y-auto pr-1">
          {/* SECTION 1 : CONTACT DU BAILLEUR (OBLIGATOIRE) */}
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-4 h-4" /> Coordonnées du Bailleur / Propriétaire (Requis)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Nom complet du Bailleur ou Agence *"
                placeholder="Ex: M. Jean Tagne / SCI Bastos Immo"
                required
                value={hOwnerName}
                onChange={e => setHOwnerName(e.target.value)}
              />
              <Input
                label="Numéro de Téléphone Appel direct *"
                placeholder="Ex: 690123456"
                required
                value={hOwnerPhone}
                onChange={e => setHOwnerPhone(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Numéro WhatsApp du Bailleur *"
                placeholder="Ex: 237690123456"
                required
                value={hWhatsappNumber}
                onChange={e => setHWhatsappNumber(e.target.value)}
              />
              <Input
                label="Téléphone Secondaire / Gardien (Optionnel)"
                placeholder="Ex: 677889900"
                value={hSecondaryPhone}
                onChange={e => setHSecondaryPhone(e.target.value)}
              />
            </div>
          </div>

          {/* SECTION 2 : INFORMATIONS GÉNÉRALES DU LOGEMENT */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-1.5">
              <Home className="w-4 h-4 text-primary" /> Informations du Logement
            </h3>
            <Input
              label="Titre de l'annonce (ou N° Chambre) *"
              placeholder="Ex: Studio Meublé Moderne Bastos (Chambre 102)"
              required
              value={hTitle}
              onChange={e => setHTitle(e.target.value)}
            />
            <Textarea
              label="Description détaillée"
              value={hDesc}
              onChange={e => setHDesc(e.target.value)}
              placeholder="Décrivez les atouts du logement, l'accès, les conditions particulières..."
              rows={3}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Type de bien" value={hCategory} onChange={e => setHCategory(e.target.value as any)} options={[
                { value: 'studio', label: 'Studio' },
                { value: 'chambre', label: 'Chambre d\'étudiant' },
                { value: 'appartement', label: 'Appartement' },
                { value: 'villa', label: 'Villa' },
                { value: 'duplex', label: 'Duplex' }
              ]} />
              <Select label="Catégorie" value={hPropertyType} onChange={e => setHPropertyType(e.target.value as any)} options={[
                { value: 'residential', label: 'Résidentiel' },
                { value: 'commercial', label: 'Commercial' },
                { value: 'office', label: 'Bureau' },
                { value: 'land', label: 'Terrain' }
              ]} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Ville *" value={hCity} onChange={e => setHCity(e.target.value)} placeholder="Yaoundé, Douala, Buea..." required />
              <Input label="Quartier *" value={hNeighborhood} onChange={e => setHNeighborhood(e.target.value)} placeholder="Bastos, Ngoa-Ekellé, Bonamoussadi..." required />
            </div>
            <Input label="Adresse / Repère précis" value={hAddress} onChange={e => setHAddress(e.target.value)} placeholder="Ex: Entrée principale, 2ème carrefour" />
          </div>

          {/* SECTION 3 : LOCALISATION GÉOGRAPHIQUE & GPS (CORRIGÉE) */}
          <LocationPicker
            latitude={hLatitude}
            longitude={hLongitude}
            city={hCity}
            neighborhood={hNeighborhood}
            onChange={({ latitude, longitude, city, neighborhood }) => {
              setHLatitude(latitude)
              setHLongitude(longitude)
              if (city) setHCity(city)
              if (neighborhood) setHNeighborhood(neighborhood)
            }}
            label="Position GPS du logement (Carte & Détection)"
          />

          {/* SECTION 4 : TARIFICATION & CONDITIONS */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Tarification & Modalités</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Loyer (FCFA) *" type="number" placeholder="75000" required value={hPrice} onChange={e => setHPrice(e.target.value)} />
              <Select label="Périodicité" value={hPriceType} onChange={e => setHPriceType(e.target.value as any)} options={[
                { value: 'month', label: 'Par mois' },
                { value: 'day', label: 'Par jour (Passage)' }
              ]} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Caution / Dépôt de garantie (FCFA)" type="number" placeholder="150000" value={hDeposit} onChange={e => setHDeposit(e.target.value)} />
              <Select label="Fréquence de paiement" value={hPaymentFreq} onChange={e => setHPaymentFreq(e.target.value as any)} options={[
                { value: 'monthly', label: 'Mensuel' },
                { value: 'quarterly', label: 'Trimestriel (3 mois)' },
                { value: 'yearly', label: 'Annuel (10/12 mois)' }
              ]} />
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="priceNegotiable" checked={hPriceNegotiable} onChange={e => setHPriceNegotiable(e.target.checked)} className="rounded border-border text-emerald-600 focus:ring-emerald-500" />
                <label htmlFor="priceNegotiable" className="text-xs font-medium text-foreground">Prix négociable</label>
              </div>
            </div>
          </div>

          {/* SECTION 5 : CARACTÉRISTIQUES & PIÈCES */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Pièces & Caractéristiques</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input label="Surface (m²)" type="number" placeholder="30" value={hSurface} onChange={e => setHSurface(e.target.value)} />
              <Input label="Chambres" type="number" placeholder="1" value={hBedrooms} onChange={e => setHBedrooms(e.target.value)} />
              <Input label="Salles de bain" type="number" placeholder="1" value={hBathrooms} onChange={e => setHBathrooms(e.target.value)} />
              <Input label="Étage" type="number" placeholder="Ex: 2" value={hFloor} onChange={e => setHFloor(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input label="Salons" type="number" placeholder="0" value={hLivingRooms} onChange={e => setHLivingRooms(e.target.value)} />
              <Input label="Cuisines" type="number" placeholder="1" value={hKitchens} onChange={e => setHKitchens(e.target.value)} />
              <Input label="Balcons" type="number" placeholder="0" value={hBalconies} onChange={e => setHBalconies(e.target.value)} />
              <Input label="Places parking" type="number" placeholder="0" value={hParking} onChange={e => setHParking(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="furnished" checked={hFurnished} onChange={e => setHFurnished(e.target.checked)} className="rounded border-border text-emerald-600 focus:ring-emerald-500" />
                <label htmlFor="furnished" className="text-xs font-semibold text-foreground">Meublé 🛋️</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="furnishedKitchen" checked={hFurnishedKitchen} onChange={e => setHFurnishedKitchen(e.target.checked)} className="rounded border-border text-emerald-600 focus:ring-emerald-500" />
                <label htmlFor="furnishedKitchen" className="text-xs font-semibold text-foreground">Cuisine équipée 🍳</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="airCon" checked={hAirCon} onChange={e => setHAirCon(e.target.checked)} className="rounded border-border text-emerald-600 focus:ring-emerald-500" />
                <label htmlFor="airCon" className="text-xs font-semibold text-foreground">Climatisation ❄️</label>
              </div>
            </div>
          </div>

          {/* SECTION 6 : EAU, ÉLECTRICITÉ & SÉCURITÉ */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Eau, Énergie & Services</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Source d'eau" value={hWaterSource} onChange={e => setHWaterSource(e.target.value as any)} options={[
                { value: 'borehole', label: 'Forage / Eau de forage (Gratuit)' },
                { value: 'city', label: 'Eau de ville (CAMWATER)' },
                { value: 'well', label: 'Puits' },
                { value: 'none', label: 'Aucune' }
              ]} />
              <Select label="Source d'électricité" value={hElecSource} onChange={e => setHElecSource(e.target.value as any)} options={[
                { value: 'grid', label: 'Réseau ENEO' },
                { value: 'generator', label: 'Groupe Électrogène de secours' },
                { value: 'solar', label: 'Énergie Solaire' },
                { value: 'none', label: 'Aucune' }
              ]} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="security" checked={hSecurity} onChange={e => setHSecurity(e.target.checked)} className="rounded border-border text-emerald-600 focus:ring-emerald-500" />
                <label htmlFor="security" className="text-xs font-medium text-foreground">Gardien 24h/24 🛡️</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="internet" checked={hInternet} onChange={e => setHInternet(e.target.checked)} className="rounded border-border text-emerald-600 focus:ring-emerald-500" />
                <label htmlFor="internet" className="text-xs font-medium text-foreground">Wifi Inclus 📶</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pool" checked={hPool} onChange={e => setHPool(e.target.checked)} className="rounded border-border text-emerald-600 focus:ring-emerald-500" />
                <label htmlFor="pool" className="text-xs font-medium text-foreground">Piscine 🏊</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pets" checked={hPets} onChange={e => setHPets(e.target.checked)} className="rounded border-border text-emerald-600 focus:ring-emerald-500" />
                <label htmlFor="pets" className="text-xs font-medium text-foreground">Animaux autorisés 🐾</label>
              </div>
            </div>
          </div>

          {/* SECTION 7 : PHOTOS & MÉDIAS */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Photos & Médias</h3>
            <MultiImageUploadField
              label="Galerie Photos du logement (jusqu'à 6 photos)"
              images={hImages}
              onChange={setHImages}
              maxImages={6}
              placeholder="Importer depuis votre téléphone ou galerie..."
            />
            <FileUploadField
              label="Vidéo de visite (Optionnel - MP4, MOV)"
              value={hVideoFile}
              onChange={(val) => { setHVideoFile(val); if (val) setHVideoUrl('') }}
              accept="video/*"
              maxSizeMB={200}
            />
          </div>

          {/* SECTION 8 : HORAIRES DE VISITE */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-foreground border-b border-border pb-2">Disponibilités & Visites</h3>
            <Input label="Créneaux de visite recommandés" placeholder="Ex: Lun-Sam 8h-18h" value={hViewingTimes} onChange={e => setHViewingTimes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>
              Annuler
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6">
              {editingHousing ? 'Enregistrer les modifications' : 'Publier le logement'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
