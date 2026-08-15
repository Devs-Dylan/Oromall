import { useState } from 'react'
import { Sliders, Shield, AlertTriangle, Lock, Check } from 'lucide-react'
import { AuditLogAPI } from '@/lib/store'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

interface AdminSettingsTabProps {
  commissionRate: number
  onUpdateCommission: (rate: number) => void
  adminName?: string
}

export function AdminSettingsTab({ commissionRate, onUpdateCommission, adminName = 'SuperAdmin' }: AdminSettingsTabProps) {
  const [rateInput, setRateInput] = useState(String(commissionRate))
  const [maintenanceMode, setMaintenanceMode] = useState(() => {
    return localStorage.getItem('mp_maintenance_mode') === '1'
  })

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    const newRate = Number(rateInput)
    onUpdateCommission(newRate)
    localStorage.setItem('mp_maintenance_mode', maintenanceMode ? '1' : '0')

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Modification des Paramètres Système',
      details: `Taux Commission: ${newRate}% - Mode Maintenance: ${maintenanceMode ? 'ACTIF 🔴' : 'INACTIF 🟢'}`,
      severity: maintenanceMode ? 'danger' : 'info'
    })

    toastSuccess('Paramètres système mis à jour avec succès !')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
          <Sliders className="w-5 h-5 text-gray-400" /> Paramètres Système & Mode Maintenance
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ajustez les règles d'exploitation, taux de commission et verrous d'urgence.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="card-glass p-6 space-y-6 max-w-3xl">
        {/* Commission Rate setting */}
        <div className="space-y-3 border-b border-border pb-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Taux de Commission Plateforme MarchéPlus
          </h3>
          <p className="text-xs text-muted-foreground">
            Pourcentage prélevé automatiquement sur chaque vente e-commerce et réservation réalisée sur le site.
          </p>
          <div className="w-48">
            <Input
              label="Taux (%)"
              type="number"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Maintenance Switch */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" /> Interrupteur d'Urgence Mode Maintenance
          </h3>
          <p className="text-xs text-muted-foreground">
            Activer ce mode désactive temporairement l'accès aux clients et affiche l'écran de maintenance.
          </p>

          <label className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="w-5 h-5 rounded border-border text-red-500 focus:ring-red-500"
            />
            <div>
              <span className="text-xs font-bold text-foreground block">
                Basculer le site en Mode Maintenance 🛑
              </span>
              <span className="text-[11px] text-muted-foreground">
                Seuls les administrateurs connectés pourront accéder à la console.
              </span>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" className="gap-1.5 shadow-lg shadow-primary/20">
            <Check className="w-4 h-4" /> Enregistrer la Configuration
          </Button>
        </div>
      </form>
    </div>
  )
}
