import { useState, useMemo } from 'react'
import { ShieldAlert, CheckCircle, Lock, AlertTriangle, MessageSquare, Trash2 } from 'lucide-react'
import type { Report } from '@/types'
import { ReportAPI, AuditLogAPI } from '@/lib/store'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { toastSuccess } from '@/components/ui/Toast'

interface AdminReportsTabProps {
  reports: Report[]
  adminName?: string
  onRefresh: () => void
}

export function AdminReportsTab({ reports, adminName = 'SuperAdmin', onRefresh }: AdminReportsTabProps) {
  const [filter, setFilter] = useState<'pending' | 'resolved' | 'all'>('pending')

  const handleResolveReport = (reportId: string, label: string) => {
    ReportAPI.update(reportId, { status: 'resolved' })

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Résolution de Litige / Signalement',
      details: `Signalement résolu : ${label}`,
      severity: 'info'
    })

    toastSuccess('Signalement marqué comme résolu !')
    onRefresh()
  }

  const filteredReports = useMemo(() => {
    return reports.filter(r => filter === 'all' || r.status === filter)
  }, [reports, filter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" /> Litiges, Réclamations & Sécurité ({reports.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Traitez les réclamations d'acheteurs, arnaques signalées et comportements suspects.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card-glass p-3 flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'pending', label: `En attente ⚠️ (${reports.filter(r => r.status === 'pending').length})` },
          { id: 'resolved', label: `Résolus ✅ (${reports.filter(r => r.status === 'resolved').length})` },
          { id: 'all', label: `Tous (${reports.length})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
              filter === f.id ? 'bg-red-600 text-white shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <div className="card-glass p-12 text-center space-y-3">
            <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucun signalement dans ce statut.</p>
          </div>
        ) : (
          filteredReports.map(report => (
            <div key={report.id} className="card-glass p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-red-500/40 transition-all">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded border border-red-500/20 uppercase">
                    Signalé par {report.reporter_name}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{formatDate(report.created_date)}</span>
                </div>

                <p className="text-sm font-bold text-foreground">Cible : <span className="text-primary">{report.target_label}</span> ({report.target_type})</p>
                <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/30">
                  Raison : "{report.reason}" {report.details ? `- ${report.details}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                {report.status === 'pending' ? (
                  <Button
                    onClick={() => handleResolveReport(report.id, report.target_label)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Marquer Résolu
                  </Button>
                ) : (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Résolu ✅
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
