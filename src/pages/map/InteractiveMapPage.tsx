import { useState, useMemo } from 'react'
import { ShopAPI, HousingAPI } from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'
import LeafletMap, { MapMarkerItem } from '@/components/shared/LeafletMap'
import { Store, Home, MapPin, Search, Filter } from 'lucide-react'

export default function InteractiveMapPage() {
  const shops = ShopAPI.list()
  const housings = HousingAPI.list()

  const [filterType, setFilterType] = useState<'all' | 'shops' | 'housing'>('all')
  const [selectedCity, setSelectedCity] = useState<string>('Toutes')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const cities = ['Toutes', 'Yaoundé', 'Douala', 'Buea', 'Bafoussam']

  const allMarkers: MapMarkerItem[] = useMemo(() => {
    const list: MapMarkerItem[] = []

    if (filterType === 'all' || filterType === 'shops') {
      shops.forEach(s => {
        if (!s.latitude || !s.longitude) return
        if (selectedCity !== 'Toutes' && s.city !== selectedCity) return
        if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.category.toLowerCase().includes(searchQuery.toLowerCase())) return

        list.push({
          id: s.id,
          title: s.name,
          type: 'shop',
          latitude: s.latitude,
          longitude: s.longitude,
          price: s.category,
          subtitle: `Boutique • ${s.city}`,
          image_url: s.logo_url || s.banner_url,
          link_url: `/shop/${s.id}`
        })
      })
    }

    if (filterType === 'all' || filterType === 'housing') {
      housings.forEach(h => {
        if (!h.latitude || !h.longitude) return
        if (selectedCity !== 'Toutes' && h.city !== selectedCity) return
        if (searchQuery && !h.title.toLowerCase().includes(searchQuery.toLowerCase()) && !h.neighborhood.toLowerCase().includes(searchQuery.toLowerCase())) return

        list.push({
          id: h.id,
          title: h.title,
          type: 'housing',
          latitude: h.latitude,
          longitude: h.longitude,
          price: formatPrice(h.price),
          subtitle: `Logement ${h.category} • ${h.city}`,
          image_url: h.image_url,
          link_url: `/housing/${h.id}`
        })
      })
    }

    return list
  }, [shops, housings, filterType, selectedCity, searchQuery])

  return (
    <div className="min-h-screen pb-16 space-y-6 max-w-7xl mx-auto px-4 pt-6">
      <div className="card-glass p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-foreground flex items-center gap-2">
              <MapPin className="w-7 h-7 text-primary" /> Carte Interactive des Boutiques & Logements
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Explorez visuellement toutes les boutiques partenaires et les offres immobilières géolocalisées au Cameroun.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold flex items-center gap-1.5">
              <Store className="w-4 h-4" /> Boutiques ({shops.filter(s => s.latitude).length})
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
              <Home className="w-4 h-4" /> Logements ({housings.filter(h => h.latitude).length})
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filtrer par nom, quartier..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-card border border-border focus:border-primary focus:outline-none"
            />
          </div>

          {/* Type Selector */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            <button
              onClick={() => setFilterType('all')}
              className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all", filterType === 'all' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterType('shops')}
              className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all", filterType === 'shops' ? "bg-primary text-white shadow-sm" : "text-muted-foreground")}
            >
              Boutiques
            </button>
            <button
              onClick={() => setFilterType('housing')}
              className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all", filterType === 'housing' ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground")}
            >
              Logements
            </button>
          </div>

          {/* City selector */}
          <div>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs focus:border-primary focus:outline-none"
            >
              {cities.map(c => (
                <option key={c} value={c}>{c === 'Toutes' ? 'Toutes les villes' : c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Leaflet Map Display */}
      <LeafletMap markers={allMarkers} center={[3.868, 11.521]} zoom={11} height="600px" />
    </div>
  )
}
