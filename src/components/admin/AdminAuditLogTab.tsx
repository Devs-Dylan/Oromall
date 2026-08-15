import { useState, useMemo } from 'react'
import { FileText, Download, Search, Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import type { AuditLog } from '@/types'
import { AuditLogAPI } from '@/lib/store'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

interface AdminAuditLogTabProps {
  auditLogs: AuditLog[]
}

export function AdminAuditLogTab({ auditLogs }: AdminAuditLogTabProps) {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'danger'>('all')

  const handleExportCSV = () => {
    const rows = [
      ['ID', 'Horodatage', 'Administrateur', 'Action', 'Détails', 'Niveau'],
      ...auditLogs.map(log => [
        log.id,
        log.timestamp,
        log.admin_name,
        log.action,
        log.details || '',
        log.severity || 'info'
      ])
    ]

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `marcheplus_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toastSuccess('Journal d\'audit exporté au format CSV !')
  }

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) || log.admin_name.toLowerCase().includes(search.toLowerCase()) || (log.details || '').toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false

      if (severityFilter !== 'all') return (log.severity || 'info') === severityFilter
      return true
    })
  }, [auditLogs, search, severityFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" /> Journal d'Audit Système ({auditLogs.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Traçabilité complète des actions administratives effectuées sur la plateforme en temps réel.
          </p>
        </div>

        <Button onClick={handleExportCSV} variant="outline" className="text-xs gap-1.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
          <Download className="w-4 h-4" /> Exporter Journal CSV
        </Button>
      </div>

      {/* Search & Toolbar */}
      <div className="card-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par action ou administrateur..."
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'all', label: `Tous (${auditLogs.length})` },
            { id: 'info', label: 'Infos ℹ️' },
            { id: 'warning', label: 'Avertissements ⚠️' },
            { id: 'danger', label: 'Actions Critiques 🚨' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSeverityFilter(f.id as any)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                severityFilter === f.id ? 'bg-purple-600 text-white shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-bold border-b border-border/40">
              <tr>
                <th className="p-3.5">Horodatage</th>
                <th className="p-3.5">Administrateur</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Détails</th>
                <th className="p-3.5">Niveau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Aucune entrée dans le journal d'audit.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="p-3.5 font-bold text-foreground whitespace-nowrap">
                      {log.admin_name}
                    </td>
                    <td className="p-3.5 font-bold text-primary">
                      {log.action}
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {log.details || '-'}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold uppercase',
                        log.severity === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        log.severity === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      )}>
                        {log.severity || 'info'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
