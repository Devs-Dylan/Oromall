import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, X, Loader2, Sparkles, ShoppingBag, Home, Store, Globe,
  ArrowRight, MapPin, Tag, DollarSign, ChevronRight, CornerDownLeft
} from 'lucide-react'
import { executeSmartSearch, type SmartSearchResult } from '@/lib/smartSearchEngine'
import { formatPrice, cn } from '@/lib/utils'

interface SmartSearchBarProps {
  placeholder?: string
  className?: string
  variant?: 'hero' | 'header' | 'compact'
  onSelectResult?: () => void
}

export function SmartSearchBar({
  placeholder = 'Rechercher un produit, logement, boutique, lieu (ex: iPhone, Bastos, ESTLC)...',
  className = '',
  variant = 'header',
  onSelectResult
}: SmartSearchBarProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SmartSearchResult | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await executeSmartSearch(query)
        setResults(res)
      } catch {
        setResults(null)
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setIsOpen(false)
    if (onSelectResult) onSelectResult()

    // Route smartly based on detected intent
    if (results?.detectedType === 'housing') {
      navigate(`/housing?search=${encodeURIComponent(query)}`)
    } else if (results?.detectedType === 'place' && results.osmPlaces.length > 0) {
      navigate(`/map`)
    } else {
      navigate(`/?search=${encodeURIComponent(query)}`)
    }
  }

  const handleItemClick = (url: string) => {
    setIsOpen(false)
    if (onSelectResult) onSelectResult()
    navigate(url)
  }

  const hasAnyResults = results && (
    results.products.length > 0 ||
    results.housings.length > 0 ||
    results.shops.length > 0 ||
    results.osmPlaces.length > 0
  )

  const isHero = variant === 'hero'

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <div
          className={cn(
            'flex items-center gap-2 transition-all rounded-2xl border',
            isHero
              ? 'bg-card/95 backdrop-blur-md border-border/90 p-2 shadow-2xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30'
              : 'bg-muted/50 border-border/70 px-3 py-1.5 focus-within:bg-card focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
          )}
        >
          <Search className={cn('text-muted-foreground flex-shrink-0', isHero ? 'w-5 h-5 ml-2 text-primary' : 'w-4 h-4')} />

          <input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={e => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className={cn(
              'w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none font-medium',
              isHero ? 'text-sm py-1.5' : 'text-xs'
            )}
          />

          {isLoading ? (
            <Loader2 className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setResults(null)
                setIsOpen(false)
              }}
              className="p-1 text-muted-foreground hover:text-foreground rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {isHero && (
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-black font-extrabold text-xs shadow-md transition-transform hover:scale-105 flex-shrink-0"
            >
              Rechercher
            </button>
          )}
        </div>
      </form>

      {/* Smart Predictive Results Popover */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-primary/40 rounded-3xl shadow-2xl z-50 overflow-hidden max-h-[80vh] overflow-y-auto backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Smart Intent Extraction Banner */}
          {results && (results.detectedCity || results.detectedCategory || results.detectedMaxPrice) && (
            <div className="bg-primary/10 border-b border-primary/20 px-4 py-2.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-primary flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Analyse IA :
              </span>
              {results.detectedCity && (
                <span className="px-2 py-0.5 rounded-md bg-card border border-primary/30 text-foreground font-bold flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-primary" /> {results.detectedCity}
                </span>
              )}
              {results.detectedCategory && (
                <span className="px-2 py-0.5 rounded-md bg-card border border-primary/30 text-foreground font-bold flex items-center gap-1 text-[11px]">
                  <Tag className="w-3 h-3 text-primary" /> {results.detectedCategory}
                </span>
              )}
              {results.detectedMaxPrice && (
                <span className="px-2 py-0.5 rounded-md bg-card border border-primary/30 text-foreground font-bold flex items-center gap-1 text-[11px]">
                  <DollarSign className="w-3 h-3 text-emerald-400" /> Max {formatPrice(results.detectedMaxPrice)}
                </span>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && !results && (
            <div className="p-8 text-center space-y-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground font-medium">Recherche intelligente en cours...</p>
            </div>
          )}

          {/* No Results */}
          {!isLoading && !hasAnyResults && (
            <div className="p-8 text-center space-y-2">
              <p className="text-sm font-bold text-foreground">Aucun résultat trouvé pour "{query}".</p>
              <p className="text-xs text-muted-foreground">Essayez avec un autre nom, quartier (Bastos, Melen, Akwa) ou produit.</p>
            </div>
          )}

          {/* Multi-Category Results Feed */}
          {hasAnyResults && (
            <div className="divide-y divide-border/60">
              {/* 1. Produits */}
              {results.products.length > 0 && (
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-black text-muted-foreground uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5 text-primary">
                      <ShoppingBag className="w-3.5 h-3.5" /> Articles & Produits ({results.products.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleItemClick(`/?search=${encodeURIComponent(query)}`)}
                      className="text-primary hover:underline flex items-center gap-0.5 normal-case font-bold"
                    >
                      Tout voir <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {results.products.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleItemClick(`/product/${p.id}`)}
                        className="w-full text-left p-2 rounded-xl hover:bg-muted/70 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.name} className="w-11 h-11 object-cover rounded-lg border border-border flex-shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">📦</div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{p.name}</h4>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{p.category} • Vendu par {p.shop_name}</p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-black text-primary block">{formatPrice(p.price)}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold">{p.city || 'Cameroun'}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Logements */}
              {results.housings.length > 0 && (
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-black text-muted-foreground uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5 text-emerald-500">
                      <Home className="w-3.5 h-3.5" /> Logements & Studios ({results.housings.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleItemClick(`/housing?search=${encodeURIComponent(query)}`)}
                      className="text-emerald-500 hover:underline flex items-center gap-0.5 normal-case font-bold"
                    >
                      Voir logements <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {results.housings.map(h => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => handleItemClick(`/housing/${h.id}`)}
                        className="w-full text-left p-2 rounded-xl hover:bg-muted/70 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {h.image_url ? (
                            <img src={h.image_url} alt={h.title} className="w-11 h-11 object-cover rounded-lg border border-border flex-shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">🏠</div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-emerald-500 transition-colors">{h.title}</h4>
                            <p className="text-[10px] text-muted-foreground line-clamp-1">📍 {h.city} ({h.neighborhood || 'Centre'}) • {h.category}</p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-black text-emerald-500 block">{formatPrice(h.price)}/mois</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Boutiques */}
              {results.shops.length > 0 && (
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-black text-muted-foreground uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5 text-amber-500">
                      <Store className="w-3.5 h-3.5" /> Boutiques Partenaires ({results.shops.length})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {results.shops.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleItemClick(`/shop/${s.id}`)}
                        className="text-left p-2.5 rounded-xl bg-muted/40 hover:bg-muted border border-border/50 transition-colors flex items-center gap-2.5 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary font-black text-xs flex items-center justify-center flex-shrink-0">
                          {s.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{s.name}</h4>
                          <p className="text-[10px] text-muted-foreground">{s.city} • {s.category}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Lieux Réels OpenStreetMap / Campus */}
              {results.osmPlaces.length > 0 && (
                <div className="p-3.5 space-y-2 bg-blue-500/5">
                  <div className="flex items-center justify-between text-[11px] font-black text-blue-400 uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Lieux Réels & Campus (OpenStreetMap)
                    </span>
                  </div>

                  <div className="space-y-1">
                    {results.osmPlaces.map(place => (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => handleItemClick(`/map`)}
                        className="w-full text-left p-2 rounded-xl hover:bg-blue-500/10 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <span className="font-bold text-foreground line-clamp-1">{place.shortLabel}</span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md flex-shrink-0 flex items-center gap-1">
                          Voir sur la carte 📍
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Recommendation Banner */}
              {results.suggestedAction && (
                <div className="p-3 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 flex items-center justify-between">
                  <span className="text-xs font-black text-foreground">
                    {results.suggestedAction.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleItemClick(results.suggestedAction!.url)}
                    className="px-3.5 py-1.5 rounded-xl bg-primary text-black font-extrabold text-xs flex items-center gap-1 shadow-sm hover:scale-105 transition-transform"
                  >
                    Ouvrir <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
