import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Download, Search, LayoutDashboard, Eye } from 'lucide-react'
import type { AuditLog } from '@/types'
import { AuditLogAPI, ShopAPI } from '@/lib/store'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

interface AdminAuditInspectTabProps {
  auditLogs: AuditLog[]
  shops: { id: string; name: string; city: string; status: string }[]
}

type AuditView = 'logs' | 'inspect'

export function AdminAuditInspectTab({ auditLogs, shops }: AdminAuditInspectTabProps) {
  const [view, setView] = useState<AuditView>('logs')
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'danger'>('all')
  const [inspectShopId, setInspectShopId] = useState('')

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(search.toLowerCase()) || log.admin_name.toLowerCase().includes(search.toLowerCase()) || (log.details || '').toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false
      if (severityFilter !== 'all') return (log.severity || 'info') === severityFilter
      return true
    })
  }, [auditLogs, search, severityFilter])

  const handleExportCSV = () => {
    const rows = [['ID', 'Horodatage', 'Administrateur', 'Action', 'Détails', 'Niveau'], ...auditLogs.map(log => [log.id, log.timestamp, log.admin_name, log.action, log.details || '', log.severity || 'info'])]
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `marcheplus_audit_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toastSuccess('Journal exporté au format CSV !')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            📜 Audit & Inspection
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Journal d'audit système et inspection des dashboards vendeurs.</p>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2">
        <button onClick={() => setView('logs')} className={cn('px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5', view === 'logs' ? 'bg-purple-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
          <FileText className="w-3.5 h-3.5" /> 📜 Journal Audit ({auditLogs.length})
        </button>
        <button onClick={() => setView('inspect')} className={cn('px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5', view === 'inspect' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
          <LayoutDashboard className="w-3.5 h-3.5" /> 🔍 Inspecter Vendeur
        </button>
      </div>

      {/* Logs View */}
      {view === 'logs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par action ou administrateur..." className="pl-9 text-xs" />
            </div>
            <Button onClick={handleExportCSV} variant="outline" className="text-xs gap-1.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/10"><Download className="w-4 h-4" /> Exporter CSV</Button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['all', 'info', 'warning', 'danger'].map(f => (
              <button key={f} onClick={() => setSeverityFilter(f as any)} className={cn('px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all', severityFilter === f ? 'bg-purple-600 text-white shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {f === 'all' ? `Tous (${auditLogs.length})` : f === 'info' ? 'Infos ℹ️' : f === 'warning' ? 'Avertissements ⚠️' : 'Actions Critiques 🚨'}
              </button>
            ))}
          </div>
          <div className="card-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-bold border-b border-border/40">
                  <tr><th className="p-3.5">Horodatage</th><th className="p-3.5">Administrateur</th><th className="p-3.5">Action</th><th className="p-3.5">Détails</th><th className="p-3.5">Niveau</th></tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredLogs.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Aucune entrée dans le journal.</td></tr> : filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{formatDate(log.timestamp)}</td>
                      <td className="p-3.5 font-bold text-foreground whitespace-nowrap">{log.admin_name}</td>
                      <td className="p-3.5 font-bold text-primary">{log.action}</td>
                      <td className="p-3.5 text-muted-foreground">{log.details || '-'}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', log.severity === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : log.severity === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20')}>
                          {log.severity || 'info'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inspect View */}
      {view === 'inspect' && (
        <div className="space-y-4">
          <div className="card-glass p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Inspecter le Dashboard d'un Vendeur</h3>
            <p className="text-xs text-muted-foreground">Sélectionnez une boutique pour ouvrir son dashboard vendeur en temps réel.</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <select value={inspectShopId} onChange={e => setInspectShopId(e.target.value)} className="bg-card text-foreground text-xs font-bold px-3 py-2 rounded-xl border border-border focus:ring-primary">
                <option value="">-- Choisir une boutique --</option>
                {shops.map(s => <option key={s.id} value={s.id}>{s.name} ({s.city}) - {s.status}</option>)}
              </select>
              {inspectShopId && (
                <Link to={`/seller?inspect=${inspectShopId}`} className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow hover:bg-primary/90 transition-all flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Ouvrir le Dashboard Vendeur →
                </Link>
              )}
            </div>
          </div>
          {inspectShopId && (
            <div className="card-glass p-4 border-amber-500/30">
              <p className="text-xs text-amber-400 font-semibold mb-2">🛡️ Aperçu rapide de la boutique sélectionnée :</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div><p className="text-muted-foreground font-semibold">Boutique</p><p className="font-bold text-foreground">{ShopAPI.get(inspectShopId)?.name}</p></div>
                <div><p className="text-muted-foreground font-semibold">Ville</p><p className="font-bold text-foreground">{ShopAPI.get(inspectShopId)?.city}</p></div>
                <div><p className="text-muted-foreground font-semibold">Statut</p><p className="font-bold text-foreground">{ShopAPI.get(inspectShopId)?.status}</p></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
