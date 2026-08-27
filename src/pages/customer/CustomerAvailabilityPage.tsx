import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, Clock, CheckCircle, XCircle, ShoppingBag, ArrowLeft } from 'lucide-react'
import { AvailabilityRequestAPI } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export default function CustomerAvailabilityPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const requests = useMemo(() => {
    if (!user) return []
    return AvailabilityRequestAPI.filter(r => r.customer_email === user.email).sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime())
  }, [user])

  const pending = useMemo(() => requests.filter(r => r.status === 'pending'), [requests])
  const approved = useMemo(() => requests.filter(r => r.status === 'approved'), [requests])
  const rejected = useMemo(() => requests.filter(r => r.status === 'rejected'), [requests])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Mes Demandes de Disponibilité</h1>
          <p className="text-sm text-muted-foreground">Suivez l'état de vos demandes de produits.</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="card-glass p-12 text-center space-y-4">
          <Package className="w-16 h-16 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-bold text-foreground">Aucune demande de disponibilité</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">Explorez la marketplace et cliquez sur "Disponible ?" sur les produits qui vous intéressent pour envoyer une demande au vendeur.</p>
          <Link to="/" className="btn-primary inline-flex">
            <ShoppingBag className="w-4 h-4" /> Explorer le marché
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> En attente ({pending.length})
              </h2>
              {pending.map(req => (
                <div key={req.id} className="card-glass p-5 border border-amber-500/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">#{req.id.slice(0, 8)}</span>
                        <span className="badge-warning">En attente</span>
                      </div>
                      <p className="font-semibold text-foreground">{req.product_name}</p>
                      <p className="text-xs text-muted-foreground">Boutique: {req.shop_name}</p>
                      <p className="text-xs text-muted-foreground">Quantité: {req.quantity} • Date limite: {req.deadline_date}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Demande du {formatDate(req.created_date)}</p>
                    </div>
                    <div className="text-xs text-muted-foreground bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      <p className="font-semibold text-amber-700 dark:text-amber-300">En attente de validation vendeur</p>
                      <p>Le vendeur sera notifié de votre demande.</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {approved.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" /> Disponibles ({approved.length})
              </h2>
              {approved.map(req => (
                <div key={req.id} className="card-glass p-5 border border-emerald-500/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">#{req.id.slice(0, 8)}</span>
                        <span className="badge-success">Disponible</span>
                      </div>
                      <p className="font-semibold text-foreground">{req.product_name}</p>
                      <p className="text-xs text-muted-foreground">Boutique: {req.shop_name}</p>
                      <p className="text-xs text-muted-foreground">Quantité: {req.quantity} • Date limite: {req.deadline_date}</p>
                    </div>
                    <Link to={`/product/${req.product_id}`}>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                        <ShoppingBag className="w-4 h-4" /> Commander maintenant
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rejected.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <XCircle className="w-5 h-5 text-destructive" /> Non disponibles ({rejected.length})
              </h2>
              {rejected.map(req => (
                <div key={req.id} className="card-glass p-5 border border-destructive/20 opacity-75">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">#{req.id.slice(0, 8)}</span>
                        <span className="badge-destructive">Non disponible</span>
                      </div>
                      <p className="font-semibold text-foreground">{req.product_name}</p>
                      <p className="text-xs text-muted-foreground">Boutique: {req.shop_name}</p>
                      <p className="text-xs text-muted-foreground">Quantité: {req.quantity} • Date limite: {req.deadline_date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
