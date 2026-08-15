import { useState, useMemo } from 'react'
import { Home, Trash2, MapPin, Phone, Mail, User, ShieldCheck, CheckCircle, Search } from 'lucide-react'
import type { Housing } from '@/types'
import { HousingAPI, AuditLogAPI } from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

interface AdminHousingTabProps {
  housings: Housing[]
  adminName?: string
  onRefresh: () => void
}

export function AdminHousingTab({ housings, adminName = 'SuperAdmin', onRefresh }: AdminHousingTabProps) {
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')

  const handleDeleteHousing = (h: Housing) => {
    if (confirm(`Modérer et supprimer définitivement l'annonce "${h.title}" ?`)) {
      HousingAPI.delete(h.id)

      AuditLogAPI.create({
        timestamp: new Date().toISOString(),
        admin_name: adminName,
        action: 'Modération & Suppression Annonce Logement',
        details: `Logement : ${h.title} (Bailleur: ${h.owner_name})`,
        severity: 'warning'
      })

      toastSuccess(`Annonce de logement "${h.title}" modérée et retirée de la plateforme.`)
      onRefresh()
    }
  }

  const filteredHousings = useMemo(() => {
    return housings.filter(h => {
      const matchesSearch = h.title.toLowerCase().includes(search.toLowerCase()) || h.owner_name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false

      if (cityFilter !== 'all') return h.city.toLowerCase() === cityFilter.toLowerCase()
      return true
    })
  }, [housings, search, cityFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Home className="w-5 h-5 text-emerald-400" /> Supervision Immobilier & Bailleurs ({housings.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Contrôlez les annonces de logements déposées par les bailleurs et vérifiez l'authenticité des offres.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher annonce, bailleur, quartier..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'all', label: `Toutes Villes (${housings.length})` },
            { id: 'yaoundé', label: 'Yaoundé' },
            { id: 'douala', label: 'Douala' },
            { id: 'bafoussam', label: 'Bafoussam' },
            { id: 'buea', label: 'Buea' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setCityFilter(f.id)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                cityFilter === f.id ? 'bg-emerald-600 text-white shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Housing List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHousings.length === 0 ? (
          <div className="col-span-full card-glass p-12 text-center space-y-3">
            <Home className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucun logement ne correspond aux critères.</p>
          </div>
        ) : (
          filteredHousings.map(h => (
            <div key={h.id} className="card-glass p-4 flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all group">
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border/50">
                  <img src={h.image_url} alt={h.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-background/80 backdrop-blur-md text-[10px] font-bold text-foreground capitalize">
                    {h.category}
                  </span>

                  <span className={cn(
                    'absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold',
                    h.status === 'available' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  )}>
                    {h.status === 'available' ? 'Disponible 🟢' : 'Occupé 🔴'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-foreground line-clamp-1">{h.title}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-emerald-400" /> {h.neighborhood}, {h.city}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/30 border border-border/30 text-[11px] text-muted-foreground space-y-0.5">
                  <p className="font-semibold text-foreground flex items-center gap-1">
                    <User className="w-3 h-3 text-primary" /> Bailleur: {h.owner_name}
                  </p>
                  <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> WhatsApp: {h.whatsapp_number}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-emerald-400">
                    {formatPrice(h.price)} <span className="text-[10px] text-muted-foreground">/{h.price_type === 'month' ? 'mois' : 'jour'}</span>
                  </span>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    onClick={() => handleDeleteHousing(h)}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-400 hover:bg-red-500/10 gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer Annonce
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
