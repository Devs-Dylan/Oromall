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
  Globe, Loader2, Landmark
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { toastSuccess, toastError } from '@/components/ui/Toast'

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
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(15)

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

  // URL Params Listener (e.g. ?q=estlc ou ?search=...)
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
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [referenceSearchInput])

  // Suggestions combinées (OpenStreetMap en direct + Boutiques existantes)
  const combinedSuggestions: SuggestionItem[] = useMemo(() => {
    if (!referenceSearchInput.trim()) return []
    const q = referenceSearchInput.toLowerCase()

    const list: SuggestionItem[] = []

    // 1. Résultats OpenStreetMap en direct (Nominatim, Photon, Open-Meteo)
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

    // 2. Boutiques enregistrées sur la plateforme
    shops
      .filter(s => s.latitude && s.longitude && (s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)))
      .forEach(s => {
        list.push({
          id: `shop-${s.id}`,
          label: `Boutique : ${s.name}`,
          detail: `MarchéPlus • ${s.city} (${s.category})`,
          lat: s.latitude!,
          lng: s.longitude!,
          source: 'shop'
        })
      })

    return list.slice(0, 10)
  }, [referenceSearchInput, osmSuggestions, shops])

  // Select a suggestion
  const handleSelectSuggestion = (sug: SuggestionItem) => {
    setReferencePoint({
      latitude: sug.lat,
      longitude: sug.lng,
      label: sug.label,
      source: sug.source,
    })
    setReferenceSearchInput('')
    setIsSearchingRef(false)
    toastSuccess(`Point de repère OpenStreetMap fixé sur "${sug.label}" 🎯`)
  }

  // Click on Map
  const handleMapClick = (lat: number, lng: number) => {
    setReferencePoint({
      latitude: lat,
      longitude: lng,
      label: `Repère personnalisé (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      source: 'custom_click'
    })
    toastSuccess('Point de repère placé sur la carte ! 🎯 Distances recalculées.')
  }

  // Device GPS
  const handleUseCurrentGPS = () => {
    if (!navigator.geolocation) {
      toastError('La géolocalisation n\'est pas supportée par votre navigateur.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(5))
        const lng = Number(pos.coords.longitude.toFixed(5))
        setReferencePoint({
          latitude: lat,
          longitude: lng,
          label: 'Ma position GPS actuelle 📍',
          source: 'gps'
        })
        toastSuccess('Position GPS détectée ! Distances mises à jour.')
      },
      () => {
        toastError('Impossible d\'obtenir votre position GPS.')
      }
    )
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
      distanceKm: number
      walkTimeMinutes: number
      driveTimeMinutes: number
      link_url: string
    }> = []

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
          distanceKm: dist,
          walkTimeMinutes: Math.round(dist * 12),
          driveTimeMinutes: Math.max(1, Math.round(dist * 2.5)),
          link_url: `/shop/${s.id}`
        })
      })
    }

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
          distanceKm: dist,
          walkTimeMinutes: Math.round(dist * 12),
          driveTimeMinutes: Math.max(1, Math.round(dist * 2.5)),
          link_url: `/housing/${h.id}`
        })
      })
    }

    // Sort by distance ascending
    nearbyList.sort((a, b) => a.distanceKm - b.distanceKm)

    return { allMarkers: markersList, nearbyItems: nearbyList }
  }, [shops, housings, filterType, selectedCity, searchQuery, referencePoint, maxDistanceKm])

  return (
    <div className="min-h-screen pb-16 space-y-6 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 pt-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="card-glass p-6 md:p-8 space-y-5 rounded-3xl border-primary/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-2">
              <Compass className="w-8 h-8 text-primary" /> Carte Interactive & Recherche OpenStreetMap
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Tapez n'importe quel lieu réel (ex : <strong>ESTLC</strong>, <strong>Polytechnique</strong>, <strong>Bastos</strong>, <strong>Carrefour Melen</strong> ou une boutique) pour calculer instantanément les distances en direct.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <Home className="w-4 h-4" /> Logements ({housings.filter(h => h.latitude).length})
            </span>
            <span className="px-3.5 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <Store className="w-4 h-4" /> Boutiques ({shops.filter(s => s.latitude).length})
            </span>
          </div>
        </div>

        {/* Dynamic Reference Point Controller with Live OpenStreetMap Search */}
        <div className="p-4 rounded-2xl bg-card border border-primary/40 shadow-lg space-y-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                🎯
              </div>
              <div>
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Point de Repère Actif (Calcul des distances depuis) :
                </span>
                <span className="text-sm font-black text-foreground flex items-center gap-1.5">
                  {referencePoint.label}
                  {referencePoint.source === 'osm' && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/30">
                      OpenStreetMap
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                type="button"
                onClick={handleUseCurrentGPS}
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10 rounded-xl"
              >
                <Navigation className="w-3.5 h-3.5" /> Ma Position GPS
              </Button>
            </div>
          </div>

          {/* Live Geocoding Search Input with Auto-Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border/60">
            {/* Live OpenStreetMap + Local Search */}
            <div className="relative">
              <label className="text-[11px] font-bold text-foreground block mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-primary" /> Rechercher un lieu réel OpenStreetMap ou une boutique :
              </label>
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3" />
                <input
                  type="text"
                  placeholder="Tapez un lieu : ESTLC, Melen, Bastos, Univ Douala, nom d'une boutique..."
                  value={referenceSearchInput}
                  onChange={e => {
                    setReferenceSearchInput(e.target.value)
                    setIsSearchingRef(true)
                  }}
                  onFocus={() => setIsSearchingRef(true)}
                  className="w-full bg-muted/50 border border-primary/30 rounded-xl pl-9 pr-8 py-2 text-xs text-foreground focus:outline-none focus:border-primary font-medium"
                />
                
                {osmLoading ? (
                  <Loader2 className="w-3.5 h-3.5 text-primary absolute right-3 animate-spin" />
                ) : referenceSearchInput ? (
                  <button
                    onClick={() => { setReferenceSearchInput(''); setIsSearchingRef(false); }}
                    className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Dynamic Suggestions Dropdown (Live OpenStreetMap + Platform) */}
              {isSearchingRef && combinedSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-primary/40 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                  <div className="p-2 text-[10px] font-black text-muted-foreground uppercase bg-muted/60 px-3 flex items-center justify-between">
                    <span>Emplacements trouvés (Cliquez pour calculer) :</span>
                    {osmLoading && <span className="text-primary flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" /> Recherche OSM...</span>}
                  </div>
                  {combinedSuggestions.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full text-left px-3.5 py-2.5 text-xs font-semibold text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between border-b border-border/40 last:border-0 group"
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="font-bold flex items-center gap-1.5">
                          {s.source === 'osm' && <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-black">OSM</span>}
                          {s.source === 'shop' && <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-black">Boutique</span>}
                          {s.source === 'landmark' && <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-black">Campus</span>}
                          <span className="line-clamp-1">{s.label}</span>
                        </div>
                        {s.detail && <p className="text-[10px] text-muted-foreground line-clamp-1">{s.detail}</p>}
                      </div>
                      <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map click & GPS guidance */}
            <div className="flex flex-col justify-center p-3 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-foreground font-bold">
                <Compass className="w-4 h-4 text-primary" /> Point de repère 100% interactif & direct
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Recherchez n'importe quel quartier, carrefour ou établissement en direct sur les serveurs <strong>OpenStreetMap</strong>, ou <strong>cliquez directement sur la carte</strong> pour poser votre point de départ.
              </p>
            </div>
          </div>
        </div>

        {/* Global Filters Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl border border-border/50">
            {[
              { id: 'housing', label: '🏠 Logements' },
              { id: 'shops', label: '🏬 Boutiques' },
              { id: 'all', label: 'Tout' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setFilterType(t.id as any)}
                className={cn(
                  'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
                  filterType === t.id ? 'bg-primary text-black shadow-sm' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* City Filter with Ambam, Ebolowa, Kribi, etc. */}
          <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-xl px-3 py-1.5">
            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
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

          {/* Search Filter */}
          <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              placeholder="Filtrer les logements..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-foreground focus:outline-none w-full placeholder:text-muted-foreground"
            />
          </div>

          {/* Max Distance Slider */}
          <div className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-xl px-3 py-1.5">
            <SlidersHorizontal className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 flex items-center justify-between text-xs font-bold">
              <span className="text-[10px] text-muted-foreground">Rayon max :</span>
              <span className="text-primary">{maxDistanceKm} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={maxDistanceKm}
              onChange={e => setMaxDistanceKm(Number(e.target.value))}
              className="w-20 accent-primary cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Interactive Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
          <span className="flex items-center gap-1 font-medium">
            💡 Astuce : <strong>Cliquez n'importe où sur la carte</strong> pour déplacer le point de repère 🎯.
          </span>
          <span className="font-bold text-foreground">
            {allMarkers.length} résultat(s) dans un rayon de {maxDistanceKm} km
          </span>
        </div>

        <LeafletMap
          markers={allMarkers}
          referencePoint={referencePoint}
          height="520px"
          onMapClick={handleMapClick}
        />
      </div>

      {/* Ranked Proximity List */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Logements & Boutiques par Ordre de Proximité
          </h2>
          <span className="text-xs text-muted-foreground font-semibold">
            Calculé depuis : <strong className="text-foreground">{referencePoint.label.split('(')[0]}</strong>
          </span>
        </div>

        {nearbyItems.length === 0 ? (
          <div className="card-glass p-8 text-center space-y-2 rounded-2xl">
            <p className="text-sm font-bold text-foreground">Aucun logement ou boutique trouvé dans un rayon de {maxDistanceKm} km.</p>
            <p className="text-xs text-muted-foreground">Augmentez le rayon maximum ou changez de lieu / point de repère.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {nearbyItems.map(item => (
              <div key={item.id} className="card-glass p-3.5 rounded-2xl flex flex-col justify-between space-y-3 hover:border-primary/50 transition-all group">
                <div className="space-y-2.5">
                  {item.image_url && (
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-card border border-border">
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-bold backdrop-blur-xs">
                        {item.type === 'shop' ? '🏬 Boutique' : '🏠 Logement'}
                      </span>
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-primary text-black text-[10px] font-black shadow-md">
                        {item.price}
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{item.title}</h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {item.city} {item.neighborhood ? `• ${item.neighborhood}` : ''}
                    </p>
                  </div>

                  {/* Distance & Travel Time Badges */}
                  <div className="p-2 rounded-xl bg-primary/5 border border-primary/20 space-y-1 text-[11px]">
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
                  className="w-full py-2 rounded-xl bg-primary hover:bg-primary/90 text-black font-extrabold text-xs text-center flex items-center justify-center gap-1 shadow-sm transition-transform hover:scale-[1.02]"
                >
                  Consulter la fiche <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
