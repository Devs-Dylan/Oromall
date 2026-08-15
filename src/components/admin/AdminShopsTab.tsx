import { useState, useMemo } from 'react'
import { Store, ShieldCheck, ShieldAlert, Lock, Unlock, Search, ExternalLink, MapPin, Phone, Mail } from 'lucide-react'
import type { Shop } from '@/types'
import { ShopAPI, AuditLogAPI } from '@/lib/store'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

interface AdminShopsTabProps {
  shops: Shop[]
  adminName?: string
  onRefresh: () => void
}

export function AdminShopsTab({ shops, adminName = 'SuperAdmin', onRefresh }: AdminShopsTabProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'verified' | 'active' | 'suspended'>('all')

  const handleToggleVerify = (shop: Shop) => {
    const nextVerified = !shop.is_verified
    ShopAPI.update(shop.id, { is_verified: nextVerified })
    
    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: `${nextVerified ? 'Octroi' : 'Retrait'} du Badge Bleu de Vérification`,
      details: `Boutique : ${shop.name} (ID: ${shop.id})`,
      severity: 'info'
    })

    toastSuccess(`Badge Bleu 🛡️ ${nextVerified ? 'accordé à' : 'retiré de'} ${shop.name}`)
    onRefresh()
  }

  const handleToggleStatus = (shop: Shop) => {
    const nextStatus = shop.status === 'active' ? 'suspended' : 'active'
    ShopAPI.update(shop.id, { status: nextStatus as any })

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: `Changement de statut boutique : ${nextStatus.toUpperCase()}`,
      details: `Boutique : ${shop.name} (ID: ${shop.id})`,
      severity: nextStatus === 'suspended' ? 'warning' : 'info'
    })

    toastSuccess(`Statut de ${shop.name} mis à jour : ${nextStatus === 'active' ? 'Actif 🟢' : 'Suspendu 🔴'}`)
    onRefresh()
  }

  const filteredShops = useMemo(() => {
    return shops.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.owner_name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false

      if (filter === 'verified') return s.is_verified
      if (filter === 'active') return s.status === 'active'
      if (filter === 'suspended') return s.status === 'suspended'
      return true
    })
  }, [shops, search, filter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Store className="w-5 h-5 text-amber-400" /> Gestion & Vérification des Boutiques ({shops.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Attribuez le Badge Bleu de Vérification 🛡️ et modérez le statut d'activation des vendeurs.
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher boutique, propriétaire, ville..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'all', label: `Toutes (${shops.length})` },
            { id: 'verified', label: `Vérifiées 🛡️ (${shops.filter(s => s.is_verified).length})` },
            { id: 'active', label: `Actives 🟢 (${shops.filter(s => s.status === 'active').length})` },
            { id: 'suspended', label: `Suspendues 🔴 (${shops.filter(s => s.status === 'suspended').length})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                filter === f.id ? 'bg-amber-500 text-black font-bold shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shops Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShops.length === 0 ? (
          <div className="col-span-full card-glass p-12 text-center space-y-3">
            <Store className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucune boutique ne correspond aux filtres.</p>
          </div>
        ) : (
          filteredShops.map(shop => (
            <div key={shop.id} className="card-glass p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-card border border-border flex-shrink-0">
                      <img src={shop.logo_url || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=200'} alt={shop.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-foreground line-clamp-1">{shop.name}</h3>
                        {shop.is_verified && (
                          <span title="Boutique Officiellement Vérifiée">🛡️</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{shop.category} • {shop.city}</p>
                    </div>
                  </div>

                  <span className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                    shop.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  )}>
                    {shop.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/30 text-xs space-y-1 text-muted-foreground">
                  <p><strong className="text-foreground">Propriétaire :</strong> {shop.owner_name}</p>
                  <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {shop.owner_email}</p>
                  <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {shop.whatsapp_number}</p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between gap-2">
                  {/* Badge Bleu Action */}
                  <Button
                    onClick={() => handleToggleVerify(shop)}
                    variant="outline"
                    size="sm"
                    className={cn(
                      'text-xs flex-1 gap-1',
                      shop.is_verified ? 'border-primary/40 text-primary hover:bg-primary/10' : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                    )}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {shop.is_verified ? 'Retirer Badge 🛡️' : 'Accorder Badge 🛡️'}
                  </Button>

                  {/* Suspension / Activation */}
                  <Button
                    onClick={() => handleToggleStatus(shop)}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'text-xs gap-1',
                      shop.status === 'active' ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'
                    )}
                  >
                    {shop.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    {shop.status === 'active' ? 'Suspendre' : 'Activer'}
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
