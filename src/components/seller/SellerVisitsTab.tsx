import { useState, useMemo } from 'react'
import { Calendar, Clock, Phone, MessageSquare, CheckCircle, XCircle, User, MapPin } from 'lucide-react'
import type { VisitBooking } from '@/types'
import { VisitBookingAPI } from '@/lib/store'
import { formatDate, buildWhatsAppUrl, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { toastSuccess } from '@/components/ui/Toast'

interface SellerVisitsTabProps {
  visits: VisitBooking[]
  onRefresh: () => void
}

export function SellerVisitsTab({ visits, onRefresh }: SellerVisitsTabProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')

  const handleUpdateVisitStatus = (visitId: string, nextStatus: 'confirmed' | 'cancelled') => {
    VisitBookingAPI.update(visitId, { status: nextStatus })
    toastSuccess(`Statut de la visite mis à jour : ${nextStatus === 'confirmed' ? 'Confirmée 🟢' : 'Annulée 🔴'}`)
    onRefresh()
  }

  const filteredVisits = useMemo(() => {
    return visits.filter(v => filter === 'all' || v.status === filter)
  }, [visits, filter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Planning des Visites Immobilières ({visits.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gérez les rendez-vous de visite demandés par les locataires et contactez-les directement sur WhatsApp.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-glass p-3 flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'all', label: `Toutes (${visits.length})` },
          { id: 'pending', label: `En attente ⏳ (${visits.filter(v => v.status === 'pending').length})` },
          { id: 'confirmed', label: `Confirmées ✅ (${visits.filter(v => v.status === 'confirmed').length})` },
          { id: 'cancelled', label: `Annulées ❌ (${visits.filter(v => v.status === 'cancelled').length})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
              filter === f.id ? 'bg-primary text-white shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Visit Bookings Cards */}
      <div className="space-y-3">
        {filteredVisits.length === 0 ? (
          <div className="card-glass p-12 text-center space-y-3">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucune demande de visite pour le moment.</p>
          </div>
        ) : (
          filteredVisits.map(visit => {
            const waUrl = buildWhatsAppUrl(
              visit.user_phone || '237677000000',
              `Bonjour ${visit.user_name}, concernant votre demande de visite pour le logement "${visit.housing_title}" prévue le ${visit.visit_date} à ${visit.visit_time}.`
            )

            return (
              <div key={visit.id} className="card-glass p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/30 transition-all">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-primary" /> {visit.user_name}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {visit.user_phone}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-foreground">
                    Logement: <span className="text-primary">{visit.housing_title}</span>
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold text-emerald-400">
                      <Calendar className="w-3.5 h-3.5" /> {visit.visit_date} à {visit.visit_time}
                    </span>
                    {visit.message && (
                      <span className="italic truncate max-w-xs">"{visit.message}"</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  {/* WhatsApp Direct Integration */}
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Direct
                  </a>

                  {visit.status === 'pending' && (
                    <>
                      <Button onClick={() => handleUpdateVisitStatus(visit.id, 'confirmed')} size="sm" variant="outline" className="text-xs gap-1 text-emerald-400 border-emerald-500/30">
                        <CheckCircle className="w-3.5 h-3.5" /> Accepter
                      </Button>
                      <Button onClick={() => handleUpdateVisitStatus(visit.id, 'cancelled')} size="sm" variant="ghost" className="text-xs gap-1 text-red-400 hover:bg-red-500/10">
                        <XCircle className="w-3.5 h-3.5" /> Refuser
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
