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
  Globe, Loader2, Landmark, List, Map as MapIcon, BedDouble, Bath, Maximize2, ExternalLink
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
  const housings = HousingAPI.list()

  const [filterType, setFilterType] = useState<'all' | 'shops' | 'housing'>('housing')
  const [selectedCity, setSelectedCity] = useState<string>('Toutes')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(20)
  const [mobileView, setMobileView] = useState<'split' | 'map' | 'list'>('split')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  // Smart Reference Search State
  const [referenceSearchInput, setReferenceSearchInput] = useState<string>('')
  const [isSearchingRef, setIsSearchingRef] = useState<boolean>(false)
  const [osmLoading, setOsmLoading] = useState<boolean>(false)
  const [osmSuggestions, setOsmSuggestions] = useState<GeocodedLocation[]>([])

  const [searchParams] = useSearchParams()
  const listContainerRef = useRef<HTMLDivElement>(null)

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

  // Suggestions combinées
  const combinedSuggestions: SuggestionItem[] = useMemo(() => {
    if (!referenceSearchInput.trim()) return []
    const q = referenceSearchInput.toLowerCase()

    const list: SuggestionItem[] = []

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

    nearbyList.sort((a, b) => a.distanceKm - b.distanceKm)

    return { allMarkers: markersList, nearbyItems: nearbyList }
  }, [shops, housings, filterType, selectedCity, searchQuery, referencePoint, maxDistanceKm])

  const selectedItem = useMemo(() => {
    return nearbyItems.find(i => i.id === selectedItemId) || null
  }, [nearbyItems, selectedItemId])

  // Scroll to selected item in list
  const handleMarkerClick = (marker: MapMarkerItem) => {
    setSelectedItemId(marker.id)
    const element = document.getElementById(`map-item-${marker.id}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }

  return (
    <div className="min-h-screen pb-16 space-y-5 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 animate-in fade-in duration-200">
      
      {/* Top Filter & Geocoding Bar */}
      <div className="card-glass p-5 md:p-6 space-y-4 rounded-3xl border-primary/30 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-foreground flex items-center gap-2">
              <Compass className="w-6 h-6 text-primary" /> Carte Interactive & Recherche de Proximité
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trouvez des logements et boutiques proches de votre campus ou quartier (calcul instantané des distances).
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

        {/* Search & Location Input Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Live OpenStreetMap search */}
          <div className="relative md:col-span-6">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-primary absolute left-3" />
              <input
                type="text"
                placeholder="Fixer un point de repère (ex: ESTLC, Polytechnique, Bastos, Melen...)"
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

            {/* Dropdown Suggestions */}
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

          {/* Type Filter Buttons */}
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

          {/* City Selector */}
          <div className="md:col-span-3 flex items-center gap-2 bg-muted/50 border border-border/50 rounded-2xl px-3 py-2">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer w-full"
            >
              <option value="Toutes">Toutes les villes</option>
              {CITIES_CAMEROON.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Point Indicator & Distance Slider */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-bold text-foreground">🎯 Repère actif :</span>
            <span className="font-semibold text-primary">{referencePoint.label}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">Rayon max : <strong className="text-primary">{maxDistanceKm} km</strong></span>
            <input
              type="range"
              min="1"
              max="50"
              value={maxDistanceKm}
              onChange={e => setMaxDistanceKm(Number(e.target.value))}
              className="w-28 accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Mobile View Switcher (Carte vs Liste vs Split) */}
      <div className="flex lg:hidden items-center gap-1 bg-muted/50 p-1 rounded-2xl border border-border">
        <button
          onClick={() => setMobileView('split')}
          className={cn(
            'flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5',
            mobileView === 'split' ? 'bg-primary text-black shadow-sm' : 'text-muted-foreground'
          )}
        >
          <Compass className="w-3.5 h-3.5" /> Vue Mixte
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={cn(
            'flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5',
            mobileView === 'map' ? 'bg-primary text-black shadow-sm' : 'text-muted-foreground'
          )}
        >
          <MapIcon className="w-3.5 h-3.5" /> Carte Plein Écran
        </button>
        <button
          onClick={() => setMobileView('list')}
          className={cn(
            'flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5',
            mobileView === 'list' ? 'bg-primary text-black shadow-sm' : 'text-muted-foreground'
          )}
        >
          <List className="w-3.5 h-3.5" /> Liste ({nearbyItems.length})
        </button>
      </div>

      {/* Main Split-Screen Architecture: Side List (Left) + Sticky Interactive Map (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Housing & Shop Cards List */}
        <div
          ref={listContainerRef}
          className={cn(
            "lg:col-span-5 space-y-3.5 lg:max-h-[calc(100vh-210px)] lg:overflow-y-auto lg:pr-2",
            mobileView === 'map' ? 'hidden lg:block' : 'block'
          )}
        >
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-foreground flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-primary" /> {nearbyItems.length} résultat(s) trié(s) par proximité
            </h2>
            <span className="text-[11px] text-muted-foreground">Rayon de {maxDistanceKm} km</span>
          </div>

          {nearbyItems.length === 0 ? (
            <div className="card-glass p-8 text-center space-y-2 rounded-2xl border-border">
              <Home className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-xs font-bold text-foreground">Aucun logement ni boutique dans ce rayon.</p>
              <p className="text-[11px] text-muted-foreground">Augmentez le rayon ou changez de point de repère.</p>
            </div>
          ) : (
            nearbyItems.map(item => {
              const isSelected = selectedItemId === item.id

              return (
                <div
                  key={item.id}
                  id={`map-item-${item.id}`}
                  onClick={() => setSelectedItemId(item.id)}
                  className={cn(
                    "card-glass p-3 rounded-2xl transition-all cursor-pointer border flex flex-col sm:flex-row gap-3 group relative",
                    isSelected
                      ? "border-amber-400 bg-amber-500/10 ring-2 ring-amber-400/30 shadow-lg"
                      : "border-border hover:border-primary/50 hover:bg-muted/40"
                  )}
                >
                  {/* Image Thumbnail */}
                  {item.image_url && (
                    <div className="relative w-full sm:w-36 h-28 sm:h-24 rounded-xl overflow-hidden bg-card shrink-0 border border-border/60">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[9px] font-bold backdrop-blur-xs">
                        {item.type === 'shop' ? '🏬 Boutique' : '🏠 Logement'}
                      </span>
                    </div>
                  )}

                  {/* Info Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between space-y-1.5">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-bold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <span className="text-xs font-black text-emerald-400 shrink-0">
                          {item.price}
                        </span>
                      </div>

                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 line-clamp-1">
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        {item.city} {item.neighborhood ? `• ${item.neighborhood}` : ''}
                      </p>
                    </div>

                    {/* Proximity Pill & Specs */}
                    <div className="space-y-1 pt-1 border-t border-border/40">
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-500 dark:text-amber-400">
                        <span>📍 {item.distanceKm} km du repère</span>
                        <span className="text-muted-foreground font-normal">🚶 ~{item.walkTimeMinutes} min</span>
                      </div>

                      {item.type === 'housing' && item.surface_sqm && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{item.surface_sqm} m²</span>
                          {item.bedrooms ? <span>• {item.bedrooms} ch.</span> : null}
                          {item.furnished ? <span>• Meublé 🛋️</span> : null}
                        </div>
                      )}
                    </div>

                    {/* Action Link */}
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        to={item.link_url}
                        onClick={e => e.stopPropagation()}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-primary hover:bg-primary/90 text-black font-bold text-[11px] text-center flex items-center justify-center gap-1 shadow-sm transition-colors"
                      >
                        Consulter la fiche <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right Column: Sticky Interactive Leaflet Map */}
        <div
          className={cn(
            "lg:col-span-7 space-y-2 lg:sticky lg:top-20",
            mobileView === 'list' ? 'hidden lg:block' : 'block'
          )}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
            <span className="font-medium text-[11px]">
              💡 <strong>Cliquez sur la carte</strong> pour poser votre point de départ 🎯.
            </span>
            <span className="font-bold text-foreground text-[11px]">
              {allMarkers.length} repères sur la carte
            </span>
          </div>

          <LeafletMap
            markers={allMarkers}
            referencePoint={referencePoint}
            selectedMarkerId={selectedItemId}
            height={mobileView === 'split' ? '420px' : '620px'}
            onMarkerClick={handleMarkerClick}
            onMapClick={handleMapClick}
            className="border-primary/40 shadow-xl"
          />

          {/* Floating Selected Card on Mobile / Map View */}
          {selectedItem && (
            <div className="card-glass p-3 rounded-2xl border-primary/50 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-2.5 min-w-0">
                {selectedItem.image_url && (
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.title}
                    className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-foreground truncate">{selectedItem.title}</h4>
                  <p className="text-[10px] text-primary font-extrabold">{selectedItem.price} • 📍 {selectedItem.distanceKm} km</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Link
                  to={selectedItem.link_url}
                  className="py-2 px-3 rounded-xl bg-primary hover:bg-primary/90 text-black font-bold text-xs inline-flex items-center gap-1 shadow"
                >
                  Voir fiche <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setSelectedItemId(null)}
                  className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
