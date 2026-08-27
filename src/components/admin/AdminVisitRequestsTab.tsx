import { useState, useMemo } from 'react'
import {
  Eye, CheckCircle, XCircle, ShieldAlert, Calendar, User, Phone, Mail,
  Home, DollarSign, Download, Search, Filter, MessageSquare, Clock, MapPin,
  ExternalLink, Trash2, Check, AlertCircle, FileText, Smartphone, Send
} from 'lucide-react'
import type { VisitRequest, Housing } from '@/types'
import { VisitRequestAPI, HousingAPI, NotificationAPI, AuditLogAPI } from '@/lib/store'
import { formatPrice, formatDate, cn, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface AdminVisitRequestsTabProps {
  adminName?: string
  onRefresh: () => void
}

export function AdminVisitRequestsTab({ adminName = 'SuperAdmin', onRefresh }: AdminVisitRequestsTabProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending' | 'rejected'>('all')
  const [search, setSearch] = useState('')
  
  // Inspection Modal State
  const [inspectRequest, setInspectRequest] = useState<VisitRequest | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [selectedHousing, setSelectedHousing] = useState<Housing | null>(null)
  const [zoomProof, setZoomProof] = useState<string | null>(null)

  const requests = VisitRequestAPI.list()

  // KPIs
  const totalRequests = requests.length
  const pendingRequests = requests.filter(r => r.status === 'pending').length
  const approvedRequests = requests.filter(r => r.status === 'approved').length
  const completedRequests = requests.filter(r => r.status === 'completed').length
  const rejectedRequests = requests.filter(r => r.status === 'rejected' || r.status === 'cancelled').length
  const totalRevenue = requests
    .filter(r => r.payment_status === 'paid')
    .reduce((sum, r) => sum + (r.amount || 0), 0)

  // Filtered List
  const filtered = useMemo(() => {
    return requests.filter(r => {
      // Status filter
      if (filter !== 'all' && r.status !== filter) return false
      
      // Payment filter
      if (paymentFilter !== 'all' && r.payment_status !== paymentFilter) return false
      
      // Search query
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchTitle = (r.housing_title || '').toLowerCase().includes(query)
        const matchName = (r.visitor_name || '').toLowerCase().includes(query)
        const matchEmail = (r.visitor_email || '').toLowerCase().includes(query)
        const matchPhone = (r.visitor_phone || '').toLowerCase().includes(query)
        const matchCity = (r.housing_city || '').toLowerCase().includes(query)
        const matchRef = (r.payment_reference || '').toLowerCase().includes(query)
        const matchId = r.id.toLowerCase().includes(query)
        if (!matchTitle && !matchName && !matchEmail && !matchPhone && !matchCity && !matchRef && !matchId) {
          return false
        }
      }
      return true
    })
  }, [requests, filter, paymentFilter, search])

  // Open Detailed Inspection
  const handleOpenInspect = (req: VisitRequest) => {
    setInspectRequest(req)
    setAdminNote(req.notes || '')
    if (req.housing_id) {
      const h = HousingAPI.get(req.housing_id)
      setSelectedHousing(h || null)
    } else {
      setSelectedHousing(null)
    }
  }

  // Action Handlers
  const handleApprove = (req: VisitRequest) => {
    VisitRequestAPI.update(req.id, {
      status: 'approved',
      payment_status: 'paid',
      updated_date: new Date().toISOString(),
    })
    NotificationAPI.create({
      user_email: req.visitor_email,
      title: 'Demande de visite approuvée ! 🏠',
      message: `Votre visite pour "${req.housing_title}" prévue le ${req.visit_date} à ${req.visit_time} a été confirmée. Vous pouvez contacter le bailleur.`,
      type: 'system',
      read: false,
    })
    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Approbation Visite',
      details: `Demande #${req.id.slice(0, 8)} approuvée pour ${req.visitor_name} (${req.housing_title})`,
      severity: 'info',
    })
    toastSuccess('Visite approuvée et paiement validé !')
    if (inspectRequest && inspectRequest.id === req.id) {
      setInspectRequest({ ...inspectRequest, status: 'approved', payment_status: 'paid' })
    }
    onRefresh()
  }

  const handleReject = (req: VisitRequest) => {
    VisitRequestAPI.update(req.id, {
      status: 'rejected',
      updated_date: new Date().toISOString(),
    })
    NotificationAPI.create({
      user_email: req.visitor_email,
      title: 'Demande de visite non approuvée',
      message: `Votre demande de visite pour "${req.housing_title}" n'a pas pu être validée. Veuillez contacter le support en cas d'erreur.`,
      type: 'system',
      read: false,
    })
    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Rejet Visite',
      details: `Demande #${req.id.slice(0, 8)} rejetée pour ${req.visitor_name}`,
      severity: 'warning',
    })
    toastSuccess('Demande de visite refusée')
    if (inspectRequest && inspectRequest.id === req.id) {
      setInspectRequest({ ...inspectRequest, status: 'rejected' })
    }
    onRefresh()
  }

  const handleComplete = (req: VisitRequest) => {
    VisitRequestAPI.update(req.id, {
      status: 'completed',
      updated_date: new Date().toISOString(),
    })
    NotificationAPI.create({
      user_email: req.visitor_email,
      title: 'Visite effectuée 🏠',
      message: `Votre visite pour "${req.housing_title}" a été marquée comme effectuée. Avez-vous aimé ce logement ?`,
      type: 'system',
      read: false,
    })
    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Clôture Visite',
      details: `Demande #${req.id.slice(0, 8)} marquée comme effectuée`,
      severity: 'info',
    })
    toastSuccess('Visite marquée comme effectuée !')
    if (inspectRequest && inspectRequest.id === req.id) {
      setInspectRequest({ ...inspectRequest, status: 'completed' })
    }
    onRefresh()
  }

  const handleUpdatePaymentStatus = (req: VisitRequest, status: 'paid' | 'pending' | 'rejected') => {
    VisitRequestAPI.update(req.id, {
      payment_status: status,
      updated_date: new Date().toISOString(),
    })
    toastSuccess(`Statut paiement mis à jour : ${status === 'paid' ? 'Payé ✅' : status === 'rejected' ? 'Rejeté ❌' : 'En attente ⏳'}`)
    if (inspectRequest && inspectRequest.id === req.id) {
      setInspectRequest({ ...inspectRequest, payment_status: status })
    }
    onRefresh()
  }

  const handleSaveNotes = () => {
    if (!inspectRequest) return
    VisitRequestAPI.update(inspectRequest.id, {
      notes: adminNote,
      updated_date: new Date().toISOString(),
    })
    toastSuccess('Notes enregistrées avec succès')
    setInspectRequest({ ...inspectRequest, notes: adminNote })
    onRefresh()
  }

  const handleDeleteRequest = (req: VisitRequest) => {
    if (!confirm(`Voulez-vous vraiment supprimer définitivement la demande de visite #${req.id.slice(0, 8)} ?`)) return
    VisitRequestAPI.delete(req.id)
    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Suppression Demande Visite',
      details: `Demande #${req.id.slice(0, 8)} supprimée`,
      severity: 'danger',
    })
    toastSuccess('Demande de visite supprimée')
    if (inspectRequest && inspectRequest.id === req.id) {
      setInspectRequest(null)
    }
    onRefresh()
  }

  const handleExportCSV = () => {
    const rows = [
      ['ID', 'Date Soumission', 'Logement', 'Ville', 'Visiteur', 'Email', 'Téléphone', 'Date Visite', 'Heure', 'Forfait', 'Montant (FCFA)', 'Mode Paiement', 'Réf Paiement', 'Statut Paiement', 'Statut Visite', 'Notes'],
      ...requests.map(r => [
        r.id,
        r.created_date,
        r.housing_title,
        r.housing_city,
        r.visitor_name,
        r.visitor_email,
        r.visitor_phone,
        r.visit_date,
        r.visit_time,
        r.package_label,
        r.amount,
        r.payment_method,
        r.payment_reference || '',
        r.payment_status,
        r.status,
        (r.notes || '').replace(/"/g, '""'),
      ])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `marcheplus_demandes_visites_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toastSuccess('Demandes de visite exportées en CSV !')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Gestion des Demandes de Visite Immobilière
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Surveillez, inspectez et validez les visites de logements avec preuve de paiement Mobile Money & Orange Money.
          </p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
          <Download className="w-4 h-4" /> Exporter CSV
        </Button>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card-glass p-3.5 rounded-2xl border border-border/60">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Total</span>
          <span className="text-2xl font-black text-foreground mt-1 block">{totalRequests}</span>
          <span className="text-[10px] text-muted-foreground">Demandes créées</span>
        </div>

        <div className="card-glass p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
            <Clock className="w-3 h-3" /> En attente
          </span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">{pendingRequests}</span>
          <span className="text-[10px] text-muted-foreground">À traiter en priorité</span>
        </div>

        <div className="card-glass p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Approuvées
          </span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">{approvedRequests}</span>
          <span className="text-[10px] text-muted-foreground">Validées & payées</span>
        </div>

        <div className="card-glass p-3.5 rounded-2xl border border-blue-500/30 bg-blue-500/5">
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block flex items-center gap-1">
            <Home className="w-3 h-3" /> Effectuées
          </span>
          <span className="text-2xl font-black text-blue-400 mt-1 block">{completedRequests}</span>
          <span className="text-[10px] text-muted-foreground">Visites achevées</span>
        </div>

        <div className="card-glass p-3.5 rounded-2xl border border-red-500/30 bg-red-500/5">
          <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider block flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Refusées
          </span>
          <span className="text-2xl font-black text-red-400 mt-1 block">{rejectedRequests}</span>
          <span className="text-[10px] text-muted-foreground">Rejetées ou annulées</span>
        </div>

        <div className="card-glass p-3.5 rounded-2xl border border-primary/40 bg-primary/5">
          <span className="text-[11px] font-semibold text-primary uppercase tracking-wider block flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Revenus
          </span>
          <span className="text-lg font-black text-primary mt-1 block truncate" title={formatPrice(totalRevenue)}>
            {formatPrice(totalRevenue)}
          </span>
          <span className="text-[10px] text-muted-foreground">Total encaissé</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card-glass p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par visiteur, email, téléphone, titre du logement, ville, réf..."
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary w-full md:w-auto"
            >
              <option value="all">Paiement : Tous</option>
              <option value="paid">Paiement : Payé ✅</option>
              <option value="pending">Paiement : En attente ⏳</option>
              <option value="rejected">Paiement : Rejeté ❌</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `Toutes (${requests.length})` },
            { id: 'pending', label: `En attente ⏳ (${requests.filter(r => r.status === 'pending').length})` },
            { id: 'approved', label: `Approuvées ✅ (${requests.filter(r => r.status === 'approved').length})` },
            { id: 'completed', label: `Effectuées 🏠 (${requests.filter(r => r.status === 'completed').length})` },
            { id: 'rejected', label: `Refusées ❌ (${requests.filter(r => r.status === 'rejected').length})` },
            { id: 'cancelled', label: `Annulées 🚫 (${requests.filter(r => r.status === 'cancelled').length})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                filter === f.id
                  ? 'bg-primary text-white shadow-sm shadow-primary/20 scale-105'
                  : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card-glass p-12 text-center space-y-3 rounded-2xl">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-bold text-foreground">Aucune demande de visite trouvée</p>
            <p className="text-xs text-muted-foreground">Modifiez vos filtres ou effectuez une autre recherche.</p>
          </div>
        ) : (
          filtered.map(req => {
            const visitorWaUrl = buildWhatsAppUrl(
              req.visitor_phone,
              `Bonjour ${req.visitor_name}, concernant votre demande de visite pour "${req.housing_title}" prévue le ${req.visit_date} à ${req.visit_time}.`
            )

            return (
              <div
                key={req.id}
                className={cn(
                  'card-glass p-4 sm:p-5 rounded-2xl border transition-all hover:shadow-lg',
                  req.status === 'pending'
                    ? 'border-amber-500/40 bg-amber-500/[0.02]'
                    : req.status === 'approved'
                    ? 'border-emerald-500/40 bg-emerald-500/[0.02]'
                    : req.status === 'rejected'
                    ? 'border-red-500/40 bg-red-500/[0.02]'
                    : req.status === 'completed'
                    ? 'border-blue-500/40 bg-blue-500/[0.02]'
                    : 'border-border'
                )}
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  {/* Left info */}
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Housing Image Preview */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                      {req.housing_image ? (
                        <img
                          src={req.housing_image}
                          alt={req.housing_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Home className="w-8 h-8 opacity-40" />
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/70 text-white px-1 rounded">
                        {req.housing_city || 'Immo'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                          #{req.id.slice(0, 8).toUpperCase()}
                        </span>
                        
                        {/* Visit Status Badge */}
                        <span
                          className={cn(
                            'text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border',
                            req.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : req.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : req.status === 'completed'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : req.status === 'rejected'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-muted text-muted-foreground border-border'
                          )}
                        >
                          {req.status === 'pending' ? '⏳ En attente' : req.status === 'approved' ? '✅ Approuvée' : req.status === 'completed' ? '🏠 Effectuée' : req.status === 'rejected' ? '❌ Refusée' : '🚫 Annulée'}
                        </span>

                        {/* Payment Status Badge */}
                        <span
                          className={cn(
                            'text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border',
                            req.payment_status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : req.payment_status === 'rejected'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          )}
                        >
                          Paiement : {req.payment_status === 'paid' ? 'Payé 💰' : req.payment_status === 'rejected' ? 'Rejeté ❌' : 'En attente ⏳'}
                        </span>

                        <span className="text-[11px] text-muted-foreground ml-auto hidden sm:inline-block">
                          {formatDate(req.created_date)}
                        </span>
                      </div>

                      {/* Title & Details */}
                      <div>
                        <h4 className="text-sm sm:text-base font-bold text-foreground truncate">
                          {req.housing_title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-0.5">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <User className="w-3.5 h-3.5 text-primary" /> {req.visitor_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" /> {req.visitor_phone}
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-emerald-400">
                            <Calendar className="w-3.5 h-3.5" /> {req.visit_date} à {req.visit_time}
                          </span>
                        </div>
                      </div>

                      {/* Package & Payment Method */}
                      <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                        <span className="px-2 py-0.5 rounded-lg bg-card border border-border text-[11px] font-semibold text-foreground">
                          📦 {req.package_label || 'Visite Simple'}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20 text-[11px] font-black text-primary">
                          {formatPrice(req.amount)}
                        </span>
                        <span className="px-2 py-0.5 rounded-lg bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          {req.payment_method}
                        </span>
                        {req.payment_reference && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            Réf: <strong className="text-foreground">{req.payment_reference}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Detail Button */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-border/40">
                    <Button
                      size="sm"
                      onClick={() => handleOpenInspect(req)}
                      className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 text-xs font-bold gap-1.5 flex-1 sm:flex-initial"
                    >
                      <Eye className="w-4 h-4" /> Plus de détails & Inspection
                    </Button>

                    <div className="flex items-center gap-1.5">
                      {req.visitor_phone && (
                        <a
                          href={visitorWaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs flex items-center gap-1 font-bold transition-all"
                          title="Discuter sur WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      )}

                      {req.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(req)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-2.5"
                            title="Approuver la visite"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(req)}
                            className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs h-8 px-2.5"
                            title="Refuser la demande"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}

                      {req.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleComplete(req)}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 px-2.5"
                          title="Marquer comme effectuée"
                        >
                          <Home className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* FULL INSPECTION MODAL */}
      {inspectRequest && (
        <Modal
          open={!!inspectRequest}
          onClose={() => setInspectRequest(null)}
          title={`🔍 Inspection Demande de Visite #${inspectRequest.id.slice(0, 8).toUpperCase()}`}
          size="lg"
        >
          <div className="space-y-6 max-h-[78vh] overflow-y-auto pr-1">
            {/* Status & ID Banner */}
            <div className="p-4 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/30">
                    ID : #{inspectRequest.id}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Créée le {formatDate(inspectRequest.created_date)}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-foreground mt-1">
                  Demande de visite pour : <span className="text-primary">{inspectRequest.housing_title}</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs font-bold uppercase px-3 py-1 rounded-xl border',
                    inspectRequest.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : inspectRequest.status === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : inspectRequest.status === 'completed'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-red-500/10 text-red-400 border-red-500/30'
                  )}
                >
                  Visite : {inspectRequest.status}
                </span>

                <span
                  className={cn(
                    'text-xs font-bold uppercase px-3 py-1 rounded-xl border',
                    inspectRequest.payment_status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : inspectRequest.payment_status === 'rejected'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  )}
                >
                  Paiement : {inspectRequest.payment_status}
                </span>
              </div>
            </div>

            {/* Grid 2 Columns : Housing & Visitor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logement Info */}
              <div className="card-glass p-4 rounded-2xl border border-border/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Home className="w-4 h-4 text-primary" /> Informations du Logement
                </h4>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0">
                    {inspectRequest.housing_image ? (
                      <img
                        src={inspectRequest.housing_image}
                        alt={inspectRequest.housing_title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{inspectRequest.housing_title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-primary" /> {inspectRequest.housing_city || 'Cameroun'}
                    </p>
                    {selectedHousing && (
                      <p className="text-xs font-bold text-emerald-400 mt-1">
                        Loyer : {formatPrice(selectedHousing.price)} / mois
                      </p>
                    )}
                  </div>
                </div>

                {/* Bailleur / Propriétaire */}
                {selectedHousing && (
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1.5">
                    <p className="font-semibold text-foreground flex items-center justify-between">
                      <span>Bailleur : {selectedHousing.owner_name}</span>
                      {selectedHousing.whatsapp_number && (
                        <a
                          href={buildWhatsAppUrl(selectedHousing.whatsapp_number, `Bonjour, concernant votre logement "${selectedHousing.title}" pour une visite.`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                    </p>
                    {selectedHousing.owner_phone && (
                      <p className="text-muted-foreground">Tél : {selectedHousing.owner_phone}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Visiteur & RDV */}
              <div className="card-glass p-4 rounded-2xl border border-border/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" /> Visiteur & Rendez-vous
                </h4>

                <div className="space-y-1.5 text-xs">
                  <p className="text-foreground font-bold text-sm">{inspectRequest.visitor_name}</p>
                  <p className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" /> {inspectRequest.visitor_email}
                  </p>
                  <p className="text-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> {inspectRequest.visitor_phone}
                  </p>
                  <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold flex items-center gap-2 mt-2">
                    <Calendar className="w-4 h-4" />
                    <span>RDV prévu : {inspectRequest.visit_date} à {inspectRequest.visit_time}</span>
                  </div>
                </div>

                {inspectRequest.visitor_phone && (
                  <div className="flex gap-2 pt-1">
                    <a
                      href={buildWhatsAppUrl(inspectRequest.visitor_phone, `Bonjour ${inspectRequest.visitor_name}, l'équipe MarchéPlus vous contacte pour votre visite du ${inspectRequest.visit_date}.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Visiteur
                    </a>
                    <a
                      href={`tel:${inspectRequest.visitor_phone}`}
                      className="px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" /> Appeler
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Paiement, Forfait & Preuve de Transaction */}
            <div className="card-glass p-5 rounded-2xl border border-border/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-primary" /> Détails Forfait & Paiement Mobile Money
                </span>
                <span className="text-primary font-extrabold text-sm">{formatPrice(inspectRequest.amount)}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                  <span className="text-muted-foreground block text-[11px]">Forfait Souscrit :</span>
                  <span className="font-bold text-foreground text-sm mt-0.5 block">{inspectRequest.package_label}</span>
                  <span className="text-[10px] text-muted-foreground">{inspectRequest.package_type === 'premium' ? '3 visites incluses' : '1 visite unique'}</span>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                  <span className="text-muted-foreground block text-[11px]">Méthode & Opérateur :</span>
                  <span className="font-bold text-primary uppercase text-sm mt-0.5 block">{inspectRequest.payment_method}</span>
                  <span className="text-[10px] text-muted-foreground">Mobile Money Gateway</span>
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/40">
                  <span className="text-muted-foreground block text-[11px]">Référence Transaction :</span>
                  <span className="font-mono font-bold text-foreground text-sm mt-0.5 block">
                    {inspectRequest.payment_reference || 'Non renseignée'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">À rapprocher des SMS</span>
                </div>
              </div>

              {/* Preuve de Paiement */}
              {inspectRequest.payment_proof_url && (
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" /> Preuve de paiement téléversée :
                  </span>
                  <div className="relative group inline-block">
                    <img
                      src={inspectRequest.payment_proof_url}
                      alt="Preuve de paiement"
                      className="max-h-56 rounded-xl border border-border object-contain bg-black/40 cursor-pointer hover:opacity-90 transition-all"
                      onClick={() => setZoomProof(inspectRequest.payment_proof_url!)}
                    />
                    <button
                      type="button"
                      onClick={() => setZoomProof(inspectRequest.payment_proof_url!)}
                      className="absolute bottom-2 right-2 bg-black/75 text-white text-[11px] px-2 py-1 rounded-lg flex items-center gap-1 opacity-90 hover:opacity-100"
                    >
                      <Eye className="w-3 h-3" /> Agrandir
                    </button>
                  </div>
                </div>
              )}

              {/* Boutons Statut Paiement */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs font-semibold text-muted-foreground">Mettre à jour le paiement :</span>
                <button
                  type="button"
                  onClick={() => handleUpdatePaymentStatus(inspectRequest, 'paid')}
                  className={cn(
                    'px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1',
                    inspectRequest.payment_status === 'paid'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-card border border-border text-emerald-400 hover:bg-emerald-500/10'
                  )}
                >
                  <Check className="w-3.5 h-3.5" /> Marquer Payé
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdatePaymentStatus(inspectRequest, 'pending')}
                  className={cn(
                    'px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1',
                    inspectRequest.payment_status === 'pending'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'bg-card border border-border text-amber-400 hover:bg-amber-500/10'
                  )}
                >
                  <Clock className="w-3.5 h-3.5" /> En attente
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdatePaymentStatus(inspectRequest, 'rejected')}
                  className={cn(
                    'px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1',
                    inspectRequest.payment_status === 'rejected'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-card border border-border text-red-400 hover:bg-red-500/10'
                  )}
                >
                  <XCircle className="w-3.5 h-3.5" /> Rejeter paiement
                </button>
              </div>
            </div>

            {/* Admin Notes & Direct Actions */}
            <div className="card-glass p-5 rounded-2xl border border-border/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-primary" /> Notes Internes & Actions Administrateur
              </h4>

              <div className="space-y-2">
                <Textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Notes privées (ex: Bailleur prévenu par WhatsApp, clés dispo chez le gardien, etc.)..."
                  rows={3}
                  className="text-xs"
                />
                <Button size="sm" onClick={handleSaveNotes} variant="outline" className="text-xs">
                  Enregistrer les notes
                </Button>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/40">
                <div className="flex flex-wrap items-center gap-2">
                  {inspectRequest.status !== 'approved' && (
                    <Button
                      onClick={() => handleApprove(inspectRequest)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" /> Approuver la Visite
                    </Button>
                  )}

                  {inspectRequest.status !== 'completed' && (
                    <Button
                      onClick={() => handleComplete(inspectRequest)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5"
                    >
                      <Home className="w-4 h-4" /> Marquer Effectuée
                    </Button>
                  )}

                  {inspectRequest.status !== 'rejected' && (
                    <Button
                      variant="outline"
                      onClick={() => handleReject(inspectRequest)}
                      className="text-red-400 border-red-500/30 hover:bg-red-500/10 text-xs gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Refuser
                    </Button>
                  )}
                </div>

                <Button
                  variant="ghost"
                  onClick={() => handleDeleteRequest(inspectRequest)}
                  className="text-red-400 hover:bg-red-500/10 text-xs gap-1.5 ml-auto"
                >
                  <Trash2 className="w-4 h-4" /> Supprimer
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Proof Zoom Modal */}
      {zoomProof && (
        <Modal
          open={!!zoomProof}
          onClose={() => setZoomProof(null)}
          title="📸 Preuve de Paiement Agrandie"
          size="lg"
        >
          <div className="p-2 text-center space-y-4">
            <img
              src={zoomProof}
              alt="Preuve de paiement grand format"
              className="max-h-[80vh] w-auto mx-auto rounded-xl shadow-2xl object-contain border border-border"
            />
            <div className="flex justify-end">
              <Button onClick={() => setZoomProof(null)}>Fermer</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
