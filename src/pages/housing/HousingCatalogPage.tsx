import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Home, MapPin, Search, Filter, Grid, Map as MapIcon,
  BedDouble, Bath, Maximize2, Shield, CheckCircle2, Sparkles, Star, Calendar, Heart
} from 'lucide-react'
import { HousingAPI } from '@/lib/store'
import { Housing, HousingCategory } from '@/types'
import { formatPrice, cn, buildWhatsAppUrl } from '@/lib/utils'
import { useWishlist } from '@/hooks/useWishlist'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal'
import LeafletMap, { MapMarkerItem } from '@/components/shared/LeafletMap'
import { VisitPackagesModal } from '@/components/housing/VisitPackagesModal'

const HOUSING_CATEGORIES: { key: HousingCategory | 'all'; label: string }[] = [
  { key: 'all', label: 'Tous les biens' },
  { key: 'studio', label: 'Studios' },
  { key: 'appartement', label: 'Appartements' },
  { key: 'chambre', label: 'Chambres d\'étudiants' },
  { key: 'villa', label: 'Villas & Duplex' },
]

const CITIES = ['Toutes', 'Yaoundé', 'Douala', 'Buea', 'Bafoussam', 'Dschang', 'Ambam']

export default function HousingCatalogPage() {
  const housings = HousingAPI.list()
  const { isHousingFavorite, toggleHousingFavorite } = useWishlist()
  const { requireAuth, authModalOpen, closeAuthModal, modalMeta } = useRequireAuth()
  const navigate = useNavigate()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<HousingCategory | 'all'>('all')
  const [selectedCity, setSelectedCity] = useState('Toutes')
  const [maxPrice, setMaxPrice] = useState<number>(500000)
  const [furnishedOnly, setFurnishedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')
  const [selectedHousingId, setSelectedHousingId] = useState<string | null>(null)
  const [selectedHousingForVisit, setSelectedHousingForVisit] = useState<{ id: string; title: string; city: string; image_url: string } | null>(null)
  const [visibleCount, setVisibleCount] = useState(6)

  const filteredHousings = useMemo(() => {
    return housings.filter(h => {
      const matchesSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            h.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            h.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || h.category === selectedCategory
      const matchesCity = selectedCity === 'Toutes' || h.city === selectedCity
      const matchesPrice = h.price <= maxPrice
      const matchesFurnished = !furnishedOnly || h.furnished

      return matchesSearch && matchesCategory && matchesCity && matchesPrice && matchesFurnished
    })
  }, [housings, searchQuery, selectedCategory, selectedCity, maxPrice, furnishedOnly])

  // Prepare map markers
  const mapMarkers: MapMarkerItem[] = useMemo(() => {
    return filteredHousings.map(h => ({
      id: h.id,
      title: h.title,
      type: 'housing',
      latitude: h.latitude,
      longitude: h.longitude,
      price: `${formatPrice(h.price)} / ${h.price_type === 'day' ? 'jour' : 'mois'}`,
      subtitle: `${h.city} • ${h.neighborhood}`,
      image_url: h.image_url,
      link_url: `/housing/${h.id}`
    }))
  }, [filteredHousings])

  return (
    <div className="min-h-screen pb-16 space-y-8 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 pt-6">

      {/* Hero Header */}
      <div className="rounded-2xl p-6 sm:p-10 border border-border bg-card shadow-sm relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Home className="w-3.5 h-3.5" /> Immobilier & Logements Étudiants au Cameroun
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Studios, chambres & appartements vérifiés
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Consultez les annonces de bailleurs certifiés, réservez une visite en ligne et contactez le propriétaire en toute sérénité.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="card-glass p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par quartier, ville (ex: Ngoa-Ekellé, Bonamoussadi)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* City Selector */}
          <div>
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:border-emerald-500 focus:outline-none"
            >
              {CITIES.map(city => (
                <option key={city} value={city}>{city === 'Toutes' ? 'Toutes les villes' : city}</option>
              ))}
            </select>
          </div>

          {/* View Switcher (Grid vs Map) */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                viewMode === 'grid' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              <Grid className="w-3.5 h-3.5" /> Grille
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all",
                viewMode === 'map' ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground"
              )}
            >
              <MapIcon className="w-3.5 h-3.5" /> Carte ({filteredHousings.length})
            </button>
          </div>
        </div>

        {/* Category Pills & Price Slider */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-t border-border pt-4">

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
            {HOUSING_CATEGORIES.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border",
                  selectedCategory === cat.key
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Additional Filter Controls */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
              <input
                type="checkbox"
                checked={furnishedOnly}
                onChange={e => setFurnishedOnly(e.target.checked)}
                className="rounded border-border text-emerald-600 focus:ring-emerald-500"
              />
              Meublé uniquement 🛋️
            </label>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Max: <strong className="text-foreground">{formatPrice(maxPrice)}</strong></span>
              <input
                type="range"
                min={20000}
                max={500000}
                step={10000}
                value={maxPrice}
                onChange={e => setMaxPrice(Number(e.target.value))}
                className="w-24 accent-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Grid or Interactive Map */}
      {viewMode === 'map' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-lg">Carte des logements disponibles</h3>
            <span className="text-xs text-muted-foreground">{mapMarkers.length} logements géolocalisés</span>
          </div>
          <LeafletMap
            markers={mapMarkers}
            center={[3.868, 11.521]}
            zoom={12}
            height="560px"
            className="border-emerald-500/40 shadow-xl"
          />
        </div>
      ) : (
        <div>
          {filteredHousings.length === 0 ? (
            <div className="text-center py-20 card-glass space-y-3">
              <Home className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-bold text-foreground">Aucun logement ne correspond à vos critères</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Essayez d'augmenter le prix maximum ou de réinitialiser la recherche par quartier.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                  setSelectedCity('Toutes')
                  setMaxPrice(500000)
                  setFurnishedOnly(false)
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHousings.slice(0, visibleCount).map(housing => (
                  <div key={housing.id} className="card-glass overflow-hidden rounded-3xl group hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                    <div>
                      {/* Image header */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-card">
                        <img
                          src={housing.image_url}
                          alt={housing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="px-3 py-1 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-bold capitalize shadow">
                            {housing.category}
                          </span>
                          {housing.furnished && (
                            <span className="px-3 py-1 rounded-xl bg-emerald-500/90 text-white text-xs font-extrabold shadow">
                              Meublé
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            requireAuth(() => toggleHousingFavorite(housing), {
                              title: 'Favoris logements réservés',
                              description: 'Connectez-vous pour enregistrer vos logements préférés.',
                            })
                          }}
                          className={cn(
                            "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-transform shadow-md",
                            isHousingFavorite(housing.id) ? "bg-red-500 text-white" : "bg-black/60 text-white hover:text-red-400"
                          )}
                        >
                          <Heart className={cn("w-4 h-4", isHousingFavorite(housing.id) && "fill-current")} />
                        </button>
                        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-white font-extrabold text-sm shadow">
                          {formatPrice(housing.price)} <span className="text-[10px] font-normal text-amber-300">/ {housing.price_type === 'day' ? 'jour' : 'mois'}</span>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center text-xs text-emerald-400 font-semibold gap-1">
                          <MapPin className="w-3.5 h-3.5" /> {housing.city} • {housing.neighborhood}
                        </div>

                        <Link to={`/housing/${housing.id}`} className="font-bold text-foreground text-base line-clamp-2 hover:text-emerald-400 transition-colors">
                          {housing.title}
                        </Link>

                        {/* Specs pills */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/60">
                          <span className="flex items-center gap-1"><Maximize2 className="w-3.5 h-3.5 text-emerald-400" /> {housing.surface_sqm} m²</span>
                          <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5 text-emerald-400" /> {housing.bedrooms} ch.</span>
                          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5 text-emerald-400" /> {housing.bathrooms} sdb</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-5 pt-0 flex gap-2">
                      <Link
                        to={`/housing/${housing.id}`}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs text-center transition-colors flex items-center justify-center gap-2"
                      >
                        Détails & Visite <Calendar className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          requireAuth(() => {
                            setSelectedHousingForVisit({
                              id: housing.id,
                              title: housing.title,
                              city: housing.city,
                              image_url: housing.image_url
                            })
                          }, {
                            title: 'Demande de visite',
                            description: 'Connectez-vous pour choisir un forfait de visite et rencontrer le bailleur.',
                          })
                        }}
                        className="w-full py-2.5 rounded-xl border-2 border-emerald-500/40 hover:border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 font-semibold text-xs text-center transition-colors flex items-center justify-center gap-2"
                      >
                        <Calendar className="w-3.5 h-3.5" /> Demander visite
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination / Chargeur la suite */}
              {filteredHousings.length > visibleCount && (
                <div className="text-center pt-8">
                  <Button
                    onClick={() => setVisibleCount(v => v + 6)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-8 py-3 rounded-2xl shadow-lg"
                  >
                    Charger plus de logements ({filteredHousings.length - visibleCount} restants)
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Visit Packages Modal */}
      {selectedHousingForVisit && (
        <VisitPackagesModal
          open={!!selectedHousingForVisit}
          onClose={() => setSelectedHousingForVisit(null)}
          onSelect={(pkg) => {
            setSelectedHousingForVisit(null)
            // Navigate to detail page with visit package selection
            navigate(`/housing/${selectedHousingForVisit.id}?package=${pkg}`)
          }}
        />
      )}

      {/* Global Auth Barrier Modal for Unconnected Visitors */}
      <AuthRequiredModal
        open={authModalOpen}
        onClose={closeAuthModal}
        title={modalMeta.title}
        description={modalMeta.description}
        actionName={modalMeta.actionName}
      />
    </div>
  )
}
