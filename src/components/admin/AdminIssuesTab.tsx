import { useState, useMemo } from 'react'
import { ShieldAlert, ShieldCheck, CheckCircle, XCircle, Eye, MessageSquare, AlertTriangle } from 'lucide-react'
import type { Report, Dispute } from '@/types'
import { ReportAPI, DisputeAPI, OrderAPI, NotificationAPI, AuditLogAPI } from '@/lib/store'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

interface AdminIssuesTabProps {
  reports: Report[]
  disputes: Dispute[]
  adminName?: string
  onRefresh: () => void
}

type IssuesView = 'reports' | 'disputes'

export function AdminIssuesTab({ reports, disputes, adminName = 'SuperAdmin', onRefresh }: AdminIssuesTabProps) {
  const [view, setView] = useState<IssuesView>('reports')
  const [reportFilter, setReportFilter] = useState<'pending' | 'resolved' | 'all'>('pending')
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [resolution, setResolution] = useState('')
  const [resolutionType, setResolutionType] = useState<'resolved_buyer' | 'resolved_seller'>('resolved_buyer')

  const filteredReports = useMemo(() => reports.filter(r => reportFilter === 'all' || r.status === reportFilter), [reports, reportFilter])

  const handleResolveReport = (reportId: string, label: string) => {
    ReportAPI.update(reportId, { status: 'resolved' })
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Résolution Signalement', details: `Signalement résolu : ${label}`, severity: 'info' })
    toastSuccess('Signalement marqué comme résolu !')
    onRefresh()
  }

  const handleInvestigateDispute = async (dispute: Dispute) => {
    DisputeAPI.update(dispute.id, { status: 'investigating', updated_date: new Date().toISOString() })
    toastSuccess('Litige en cours d\'investigation')
    onRefresh()
  }

  const handleResolveDispute = async () => {
    if (!selectedDispute || !resolution.trim()) return
    DisputeAPI.update(selectedDispute.id, { status: resolutionType, resolution, resolved_by: 'admin', updated_date: new Date().toISOString() })
    NotificationAPI.create({ user_email: selectedDispute.customer_email, title: `Litige résolu - Commande #${selectedDispute.order_id.slice(0, 8)}`, message: `Votre litige a été résolu. Décision: ${resolutionType === 'resolved_buyer' ? 'En faveur de l\'acheteur' : 'En faveur du vendeur'}.`, type: 'system', read: false })
    NotificationAPI.create({ user_email: selectedDispute.vendor_email, title: `Litige résolu - Commande #${selectedDispute.order_id.slice(0, 8)}`, message: `Le litige a été résolu. Décision: ${resolutionType === 'resolved_buyer' ? 'En faveur de l\'acheteur' : 'En faveur du vendeur'}.`, type: 'system', read: false })
    setSelectedDispute(null)
    setResolution('')
    toastSuccess('Litige résolu')
    onRefresh()
  }

  const handleCloseDispute = async (dispute: Dispute) => {
    DisputeAPI.update(dispute.id, { status: 'closed', updated_date: new Date().toISOString() })
    toastSuccess('Litige fermé')
    onRefresh()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            ⚠️ Litiges & Signalements
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Traitez les réclamations, litiges et comportements suspects.</p>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2">
        <button
          onClick={() => setView('reports')}
          className={cn('px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5', view === 'reports' ? 'bg-red-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
        >
          <ShieldAlert className="w-3.5 h-3.5" /> 🚨 Signalements ({reports.length})
        </button>
        <button
          onClick={() => setView('disputes')}
          className={cn('px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5', view === 'disputes' ? 'bg-amber-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> ⚖️ Litiges ({disputes.length})
        </button>
      </div>

      {/* Reports View */}
      {view === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['pending', 'resolved', 'all'].map(f => (
              <button key={f} onClick={() => setReportFilter(f as any)} className={cn('px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all', reportFilter === f ? 'bg-red-600 text-white shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {f === 'pending' ? `En attente ⚠️ (${reports.filter(r => r.status === 'pending').length})` : f === 'resolved' ? `Résolus ✅ (${reports.filter(r => r.status === 'resolved').length})` : `Tous (${reports.length})`}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredReports.length === 0 ? (
              <div className="card-glass p-12 text-center space-y-3"><ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto" /><p className="text-sm font-semibold text-foreground">Aucun signalement dans ce statut.</p></div>
            ) : filteredReports.map(report => (
              <div key={report.id} className="card-glass p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-red-500/40 transition-all">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded border border-red-500/20 uppercase">Signalé par {report.reporter_name}</span>
                    <span className="text-[11px] text-muted-foreground">{formatDate(report.created_date)}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">Cible : <span className="text-primary">{report.target_label}</span> ({report.target_type})</p>
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/30">Raison : "{report.reason}" {report.details ? `- ${report.details}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                  {report.status === 'pending' ? (
                    <Button onClick={() => handleResolveReport(report.id, report.target_label)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1"><CheckCircle className="w-3.5 h-3.5" /> Marquer Résolu</Button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Résolu ✅</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disputes View */}
      {view === 'disputes' && (
        <div className="space-y-3">
          {disputes.length === 0 ? (
            <div className="card-glass p-12 text-center space-y-3"><ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto" /><p className="text-sm font-semibold text-foreground">Aucun litige enregistré.</p></div>
          ) : disputes.map(dispute => (
            <div key={dispute.id} className={`card-glass p-5 border ${dispute.status === 'open' ? 'border-amber-500/30' : dispute.status === 'investigating' ? 'border-blue-500/30' : dispute.status.startsWith('resolved') ? 'border-emerald-500/30' : 'border-border'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">#{dispute.id.slice(0, 8)}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${dispute.status === 'open' ? 'badge-warning' : dispute.status === 'investigating' ? 'badge-info' : dispute.status.startsWith('resolved') ? 'badge-success' : 'badge-destructive'}`}>
                      {dispute.status === 'open' ? 'Ouvert' : dispute.status === 'investigating' ? 'En investigation' : dispute.status === 'resolved_buyer' ? 'Résolu (Acheteur)' : dispute.status === 'resolved_seller' ? 'Résolu (Vendeur)' : 'Fermé'}
                    </span>
                  </div>
                  <p className="font-semibold text-foreground text-sm">{dispute.subject}</p>
                  <p className="text-xs text-muted-foreground">Commande: #{dispute.order_id.slice(0, 8)} • Boutique: {dispute.shop_id}</p>
                  <p className="text-xs text-muted-foreground">Acheteur: {dispute.customer_name} • Vendeur: {dispute.vendor_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{dispute.description}</p>
                  {dispute.evidence_url && <p className="text-xs text-primary mt-1">Preuve: {dispute.evidence_url}</p>}
                  {dispute.resolution && <p className="text-xs text-emerald-600 mt-1 font-semibold">Résolution: {dispute.resolution}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDate(dispute.created_date)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {dispute.status === 'open' && (
                    <Button size="sm" onClick={() => handleInvestigateDispute(dispute)}><Eye className="w-4 h-4" /> Investiguer</Button>
                  )}
                  {(dispute.status === 'open' || dispute.status === 'investigating') && (
                    <Button size="sm" variant="outline" onClick={() => setSelectedDispute(dispute)} className="text-primary"><MessageSquare className="w-4 h-4" /> Résoudre</Button>
                  )}
                  {(dispute.status === 'open' || dispute.status === 'investigating') && (
                    <Button size="sm" variant="outline" onClick={() => handleCloseDispute(dispute)} className="text-destructive hover:bg-destructive/10"><XCircle className="w-4 h-4" /> Fermer</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDispute && (
        <Modal open={!!selectedDispute} onClose={() => { setSelectedDispute(null); setResolution('') }} title="Résoudre le litige">
          <div className="space-y-4">
            <div className="bg-muted/40 p-4 rounded-xl space-y-2">
              <p className="font-semibold text-foreground text-sm">{selectedDispute.subject}</p>
              <p className="text-xs text-muted-foreground">Acheteur: {selectedDispute.customer_name} • Vendeur: {selectedDispute.vendor_name}</p>
              <p className="text-xs text-muted-foreground">{selectedDispute.description}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Décision</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setResolutionType('resolved_buyer')} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${resolutionType === 'resolved_buyer' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>En faveur de l'acheteur</button>
                <button type="button" onClick={() => setResolutionType('resolved_seller')} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${resolutionType === 'resolved_seller' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>En faveur du vendeur</button>
              </div>
            </div>
            <Textarea label="Explication de la résolution" rows={4} required value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Expliquez votre décision..." />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="ghost" onClick={() => { setSelectedDispute(null); setResolution('') }}>Annuler</Button>
              <Button onClick={handleResolveDispute} disabled={!resolution.trim()}><CheckCircle className="w-4 h-4" /> Confirmer la résolution</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
