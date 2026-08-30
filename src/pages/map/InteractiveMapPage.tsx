import { useState, useMemo, useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ShopAPI, HousingAPI } from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'
import { CITIES_CAMEROON } from '@/types'
import LeafletMap, { MapMarkerItem } from '@/components/shared/LeafletMap'
import { searchOpenStreetMap, type GeocodedLocation } from '@/lib/osmGeocoding'
import {
  Store, Home, MapPin, Search, Filter, Compass, Navigation,
  Crosshair, Clock, ArrowRight, CheckCircle2, SlidersHorizontal, Sparkles, X, ChevronRight,
  Globe, Loader2, Landmark, BedDouble, Bath, Maximize2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { getSmartGeolocation } from '@/lib/geolocation'

// Formule de Haversine pour calcul géodésique précis
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Rayon Terre km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 10) / 10
}

interface ReferencePoint {
  latitude: number
  longitude: number
  label: string
  source: 'osm' | 'shop' | 'custom_click' | 'gps' | 'landmark'
}

interface SuggestionItem {
  id: string
  label: string
  detail?: string
  lat: number
  lng: number
  source: 'osm' | 'shop' | 'landmark'
}

export default function InteractiveMapPage() {
  const shops = ShopAPI.list()
  const housings = (HousingAPI.list() || []).filter(h => h.status !== 'pending_review' && h.status !== 'rejected')

  const [filterType, setFilterType] = useState<'all' | 'shops' | 'housing'>('housing')
  const [selectedCity, setSelectedCity] = useState<string>('Toutes')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(20)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Smart Reference Search State
  const [referenceSearchInput, setReferenceSearchInput] = useState<string>('')
  const [isSearchingRef, setIsSearchingRef] = useState<boolean>(false)
  const [osmLoading, setOsmLoading] = useState<boolean>(false)
  const [osmSuggestions, setOsmSuggestions] = useState<GeocodedLocation[]>([])

  const [searchParams] = useSearchParams()

  // Reference Point (Position initiale par défaut ou définie par recherche OSM en direct)
  const [referencePoint, setReferencePoint] = useState<ReferencePoint>({
    latitude: 3.868,
    longitude: 11.521,
    label: 'Point de repère (Cameroun)',
    source: 'custom_click'
  })

  // URL Params Listener
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search') || searchParams.get('landmark')
    const queryToSearch = (qParam || '').trim()

    if (queryToSearch) {
      setOsmLoading(true)
      searchOpenStreetMap(queryToSearch).then(results => {
        if (results.length > 0) {
          setReferencePoint({
            latitude: results[0].lat,
            longitude: results[0].lng,
            label: results[0].label,
            source: 'osm'
          })
          if (results[0].city) setSelectedCity(results[0].city)
        }
      }).finally(() => setOsmLoading(false))
    }
  }, [searchParams])

  // Requête OpenStreetMap en direct dès que l'utilisateur tape un lieu
  useEffect(() => {
    if (!referenceSearchInput.trim() || referenceSearchInput.trim().length < 2) {
      setOsmSuggestions([])
      setOsmLoading(false)
      return
    }

    setOsmLoading(true)
    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchOpenStreetMap(referenceSearchInput)
        setOsmSuggestions(results)
      } catch {
        setOsmSuggestions([])
      } finally {
        setOsmLoading(false)
      }
    }, 450)

    return () => clearTimeout(timeoutId)
  }, [referenceSearchInput])

  // Suggestions combinées (OpenStreetMap en direct + Boutiques de la plateforme)
  const combinedSuggestions: SuggestionItem[] = useMemo(() => {
    if (!referenceSearchInput.trim()) return []
    const q = referenceSearchInput.toLowerCase()

    const list: SuggestionItem[] = []

    // 1. Résultats OpenStreetMap
    osmSuggestions.forEach(osm => {
      list.push({
        id: osm.id,
        label: osm.shortLabel,
        detail: `OpenStreetMap • ${osm.city || 'Cameroun'} (${osm.type})`,
        lat: osm.lat,
        lng: osm.lng,
        source: 'osm'
      })
    })

    // 2. Boutiques de la plateforme
    shops
      .filter(s => s.latitude && s.longitude && (s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)))
      .forEach(s => {
        list.push({
          id: `shop-${s.id}`,
          label: `Boutique : ${s.name}`,
          detail: `OroMall • ${s.city} (${s.category})`,
          lat: s.latitude!,
          lng: s.longitude!,
          source: 'shop'
        })
      })

    return list.slice(0, 8)
  }, [referenceSearchInput, osmSuggestions, shops])

  const handleSelectSuggestion = (sug: SuggestionItem) => {
    setReferencePoint({
      latitude: sug.lat,
      longitude: sug.lng,
      label: sug.label,
      source: sug.source,
    })
    setReferenceSearchInput('')
    setIsSearchingRef(false)
    toastSuccess(`Point de repère fixé sur "${sug.label}" 🎯`)
  }

  const handleMapClick = (lat: number, lng: number) => {
    setReferencePoint({
      latitude: lat,
      longitude: lng,
      label: `Repère (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      source: 'custom_click'
    })
    toastSuccess('Point de repère placé sur la carte ! 🎯 Distances recalculées.')
  }

  const handleUseCurrentGPS = async () => {
    try {
      const res = await getSmartGeolocation(selectedCity === 'Toutes' ? 'Yaoundé' : selectedCity)
      const lat = Number(res.latitude.toFixed(5))
      const lng = Number(res.longitude.toFixed(5))
      setReferencePoint({
        latitude: lat,
        longitude: lng,
        label: `Ma position (${res.method === 'gps_high' ? 'GPS Exact' : 'Réseau'}) 📍`,
        source: 'gps'
      })
      toastSuccess('Position détectée ! 📍', res.message)
    } catch {
      toastError('Impossible d\'obtenir votre position.')
    }
  }

  // Calculate distances and markers
  const { allMarkers, nearbyItems } = useMemo(() => {
    const markersList: MapMarkerItem[] = []
    const nearbyList: Array<{
      id: string
      title: string
      type: 'shop' | 'housing'
      category?: string
      price: string
      city: string
      neighborhood?: string
      image_url?: string
      surface_sqm?: number
      bedrooms?: number
      bathrooms?: number
      furnished?: boolean
      latitude: number
      longitude: number
      distanceKm: number
      walkTimeMinutes: number
      driveTimeMinutes: number
      link_url: string
    }> = []

    if (filterType === 'all' || filterType === 'housing') {
      housings.forEach(h => {
        if (!h.latitude || !h.longitude) return
        if (selectedCity !== 'Toutes' && h.city !== selectedCity) return
        if (searchQuery && !h.title.toLowerCase().includes(searchQuery.toLowerCase()) && !h.neighborhood.toLowerCase().includes(searchQuery.toLowerCase())) return

        const dist = calculateDistanceKm(referencePoint.latitude, referencePoint.longitude, h.latitude, h.longitude)
        if (dist > maxDistanceKm) return

        markersList.push({
          id: h.id,
          title: h.title,
          type: 'housing',
          latitude: h.latitude,
          longitude: h.longitude,
          price: formatPrice(h.price),
          subtitle: `Logement • ${h.city} (${h.neighborhood || ''})`,
          image_url: h.image_url,
          link_url: `/housing/${h.id}`,
          distanceKm: dist
        })

        nearbyList.push({
          id: h.id,
          title: h.title,
          type: 'housing',
          category: h.category,
          price: formatPrice(h.price),
          city: h.city,
          neighborhood: h.neighborhood,
          image_url: h.image_url,
          surface_sqm: h.surface_sqm,
          bedrooms: h.bedrooms,
          bathrooms: h.bathrooms,
          furnished: h.furnished,
          latitude: h.latitude,
          longitude: h.longitude,
          distanceKm: dist,
          walkTimeMinutes: Math.round(dist * 12),
          driveTimeMinutes: Math.max(1, Math.round(dist * 2.5)),
          link_url: `/housing/${h.id}`
        })
      })
    }

    if (filterType === 'all' || filterType === 'shops') {
      shops.forEach(s => {
        if (!s.latitude || !s.longitude) return
        if (selectedCity !== 'Toutes' && s.city !== selectedCity) return
        if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.category.toLowerCase().includes(searchQuery.toLowerCase())) return

        const dist = calculateDistanceKm(referencePoint.latitude, referencePoint.longitude, s.latitude, s.longitude)
        if (dist > maxDistanceKm) return

        markersList.push({
          id: s.id,
          title: s.name,
          type: 'shop',
          latitude: s.latitude,
          longitude: s.longitude,
          price: s.category,
          subtitle: `Boutique • ${s.city}`,
          image_url: s.logo_url || s.profile_image || s.cover_image,
          link_url: `/shop/${s.id}`,
          distanceKm: dist
        })

        nearbyList.push({
          id: s.id,
          title: s.name,
          type: 'shop',
          category: s.category,
          price: s.city,
          city: s.city,
          image_url: s.logo_url || s.profile_image || s.cover_image,
          latitude: s.latitude,
          longitude: s.longitude,
          distanceKm: dist,
          walkTimeMinutes: Math.round(dist * 12),
          driveTimeMinutes: Math.max(1, Math.round(dist * 2.5)),
          link_url: `/shop/${s.id}`
        })
      })
    }

    // Tri strict par distance croissante
    nearbyList.sort((a, b) => a.distanceKm - b.distanceKm)

    return { allMarkers: markersList, nearbyItems: nearbyList }
  }, [shops, housings, filterType, selectedCity, searchQuery, referencePoint, maxDistanceKm])

  const selectedItem = useMemo(() => {
    return nearbyItems.find(i => i.id === selectedItemId) || null
  }, [nearbyItems, selectedItemId])

  // Click sur un marqueur de la carte -> met en évidence et fait défiler vers la carte en bas
  const handleMarkerClick = (marker: MapMarkerItem) => {
    setSelectedItemId(marker.id)
    const cardEl = document.getElementById(`proximity-item-${marker.id}`)
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="min-h-screen pb-16 space-y-6 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 animate-in fade-in duration-200">
      
      {/* En-tête et filtres interactifs */}
      <div className="card-glass p-5 md:p-6 space-y-4 rounded-3xl border-primary/30 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2">
              <Compass className="w-6 h-6 text-primary" /> Carte Interactive & Recherche de Proximité
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Calculez instantanément les distances en temps réel depuis votre position ou n'importe quel point de repère au Cameroun.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleUseCurrentGPS}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10 rounded-xl font-bold"
            >
              <Navigation className="w-3.5 h-3.5" /> Ma Position GPS
            </Button>
          </div>
        </div>

        {/* Barre de recherche de repère OpenStreetMap */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Recherche OpenStreetMap */}
          <div className="relative md:col-span-6">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-primary absolute left-3" />
              <input
                type="text"
                placeholder="Fixer un point de repère (ex: ESTLC, Polytechnique, Bastos, Melen, nom de boutique...)"
                value={referenceSearchInput}
                onChange={e => {
                  setReferenceSearchInput(e.target.value)
                  setIsSearchingRef(true)
                }}
                onFocus={() => setIsSearchingRef(true)}
                className="w-full bg-muted/60 border border-primary/30 rounded-2xl pl-9 pr-8 py-2.5 text-xs text-foreground focus:outline-none focus:border-primary font-medium shadow-inner"
              />
              {osmLoading ? (
                <Loader2 className="w-4 h-4 text-primary absolute right-3 animate-spin" />
              ) : referenceSearchInput ? (
                <button
                  onClick={() => { setReferenceSearchInput(''); setIsSearchingRef(false); }}
                  className="absolute right-3 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>

            {/* Suggestions Déroulantes */}
            {isSearchingRef && combinedSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-primary/40 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
                <div className="p-2 text-[10px] font-black text-muted-foreground uppercase bg-muted/60 px-3 flex items-center justify-between">
                  <span>Lieux trouvés (cliquez pour recalculer) :</span>
                  {osmLoading && <span className="text-primary flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" /> Recherche...</span>}
                </div>
                {combinedSuggestions.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSuggestion(s)}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between border-b border-border/40 last:border-0 group"
                  >
                    <div className="space-y-0.5 pr-2">
                      <div className="font-bold flex items-center gap-1.5">
                        {s.source === 'osm' && <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-bold">OSM</span>}
                        {s.source === 'shop' && <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold">Boutique</span>}
                        <span className="line-clamp-1">{s.label}</span>
                      </div>
                      {s.detail && <p className="text-[10px] text-muted-foreground line-clamp-1">{s.detail}</p>}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filtre Type (Logements / Boutiques / Tout) */}
          <div className="md:col-span-3 flex items-center gap-1 bg-muted/50 p-1 rounded-2xl border border-border/50">
            {[
              { id: 'housing', label: '🏠 Logements' },
              { id: 'shops', label: '🏬 Boutiques' },
              { id: 'all', label: 'Tout' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id as any)}
                className={cn(
                  'flex-1 py-1.5 text-xs font-bold rounded-xl transition-all',
                  filterType === t.id ? 'bg-primary text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Sélecteur de ville */}
          <div className="md:col-span-3 flex items-center gap-2 bg-muted/50 border border-border/50 rounded-2xl px-3 py-2">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer w-full"
            >
              <option value="Toutes">Toutes les villes ({CITIES_CAMEROON.length})</option>
              {CITIES_CAMEROON.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Indicateur de repère et slider de rayon à partir de 100 m */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground min-w-0">
            <span className="font-bold text-foreground shrink-0">🎯 Repère actif :</span>
            <span className="font-semibold text-primary truncate">{referencePoint.label}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Radius Pills */}
            <div className="flex items-center gap-1 bg-muted/70 p-0.5 rounded-xl border border-border/60">
              {[
                { val: 0.1, label: '100 m' },
                { val: 0.5, label: '500 m' },
                { val: 1, label: '1 km' },
                { val: 2, label: '2 km' },
                { val: 5, label: '5 km' },
                { val: 10, label: '10 km' },
                { val: 20, label: '20 km' },
              ].map(pill => (
                <button
                  key={pill.val}
                  type="button"
                  onClick={() => setMaxDistanceKm(pill.val)}
                  className={cn(
                    "px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all",
                    maxDistanceKm === pill.val
                      ? "bg-primary text-black shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pl-1">
              <span className="text-muted-foreground text-[11px]">
                Rayon : <strong className="text-primary">{maxDistanceKm < 1 ? `${Math.round(maxDistanceKm * 1000)} m` : `${maxDistanceKm} km`}</strong>
              </span>
              <input
                type="range"
                min="0.1"
                max="50"
                step="0.1"
                value={maxDistanceKm}
                onChange={e => setMaxDistanceKm(Number(e.target.value))}
                className="w-24 accent-primary cursor-pointer"
                title={`Rayon : ${maxDistanceKm < 1 ? `${Math.round(maxDistanceKm * 1000)} m` : `${maxDistanceKm} km`}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= CARTE INTERACTIVE PLEINE LARGEUR (Position & Taille Standard) ================= */}
      <div className="space-y-2 relative">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <span className="flex items-center gap-1 font-medium">
            💡 Astuce : <strong>Cliquez sur la carte</strong> pour déplacer votre point de repère 🎯.
          </span>
          <span className="font-bold text-foreground">
            {allMarkers.length} résultat(s) dans un rayon de {maxDistanceKm} km
          </span>
        </div>

        <LeafletMap
          markers={allMarkers}
          referencePoint={referencePoint}
          selectedMarkerId={selectedItemId}
          height="540px"
          onMarkerClick={handleMarkerClick}
          onMapClick={handleMapClick}
          className="border-primary/40 shadow-xl"
        />

        {/* Floating Quick Card quand un marqueur est sélectionné */}
        {selectedItem && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-30 card-glass p-3.5 rounded-2xl border-primary/50 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center gap-3 min-w-0">
              {selectedItem.image_url && (
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.title}
                  className="w-14 h-14 rounded-xl object-cover border border-border shrink-0 shadow-sm"
                />
              )}
              <div className="min-w-0 space-y-0.5">
                <h4 className="font-bold text-xs text-foreground truncate">{selectedItem.title}</h4>
                <p className="text-[11px] text-primary font-extrabold">{selectedItem.price}</p>
                <p className="text-[10px] text-muted-foreground">📍 {selectedItem.distanceKm} km • ~{selectedItem.walkTimeMinutes} min à pied</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                to={selectedItem.link_url}
                className="py-2 px-3.5 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold text-xs inline-flex items-center gap-1 shadow-md transition-transform hover:scale-105"
              >
                Consulter <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setSelectedItemId(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= GRILLE DES LOGEMENTS & BOUTIQUES PAR ORDRE DE PROXIMITÉ ================= */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" /> Logements & Boutiques par Ordre de Proximité
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Calculé depuis : <strong className="text-foreground">{referencePoint.label.split('(')[0]}</strong>
            </p>
          </div>

          <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/30 px-3 py-1.5 rounded-xl">
            {nearbyItems.length} disponible(s)
          </span>
        </div>

        {nearbyItems.length === 0 ? (
          <div className="card-glass p-8 text-center space-y-2 rounded-2xl">
            <Home className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-sm font-bold text-foreground">Aucun logement ou boutique trouvé dans un rayon de {maxDistanceKm} km.</p>
            <p className="text-xs text-muted-foreground">Augmentez le rayon maximum ou changez de point de repère.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {nearbyItems.map(item => {
              const isSelected = selectedItemId === item.id

              return (
                <div
                  key={item.id}
                  id={`proximity-item-${item.id}`}
                  onClick={() => setSelectedItemId(item.id)}
                  className={cn(
                    "card-glass p-3.5 rounded-2xl flex flex-col justify-between space-y-3 transition-all cursor-pointer group relative",
                    isSelected
                      ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/40 shadow-xl scale-[1.02]"
                      : "hover:border-primary/50 hover:bg-muted/40"
                  )}
                >
                  <div className="space-y-2.5">
                    {item.image_url && (
                      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-card border border-border">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-bold backdrop-blur-xs">
                          {item.type === 'shop' ? '🏬 Boutique' : '🏠 Logement'}
                        </span>
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-primary text-black text-[10px] font-black shadow-md">
                          {item.price}
                        </span>
                      </div>
                    )}

                    <div>
                      <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        {item.city} {item.neighborhood ? `• ${item.neighborhood}` : ''}
                      </p>
                    </div>

                    {/* Distance & Temps de trajet */}
                    <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between font-bold text-primary">
                        <span>Distance réelle :</span>
                        <span>📍 {item.distanceKm} km</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>🚶 À pied : ~{item.walkTimeMinutes} min</span>
                        <span>🚗 Moto/Taxi : ~{item.driveTimeMinutes} min</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to={item.link_url}
                    onClick={e => e.stopPropagation()}
                    className="w-full py-2 rounded-xl bg-primary hover:bg-primary/90 text-black font-extrabold text-xs text-center flex items-center justify-center gap-1 shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    Consulter la fiche <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
