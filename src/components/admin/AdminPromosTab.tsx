import { useState } from 'react'
import { Tag, Plus, Users, Gift, Trash2, CheckCircle } from 'lucide-react'
import type { PromoCode, Referral } from '@/types'
import { PromoAPI, ReferralAPI, AuditLogAPI } from '@/lib/store'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface AdminPromosTabProps {
  promos: PromoCode[]
  referrals: Referral[]
  adminName?: string
  onRefresh: () => void
}

export function AdminPromosTab({ promos, referrals, adminName = 'SuperAdmin', onRefresh }: AdminPromosTabProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [pCode, setPCode] = useState('')
  const [pType, setPType] = useState<'percent' | 'fixed'>('percent')
  const [pValue, setPValue] = useState('15')
  const [pDesc, setPDesc] = useState('')

  const handleCreateGlobalPromo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pCode || !pValue) {
      toastError('Veuillez spécifier le code et la réduction.')
      return
    }

    PromoAPI.create({
      code: pCode.toUpperCase(),
      description: pDesc || `Code Promo Global -${pValue}${pType === 'percent' ? '%' : ' FCFA'}`,
      discount_type: pType,
      value: Number(pValue),
      uses_count: 0,
      active: true,
    })

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Création Code Promo Global Site',
      details: `Code: ${pCode.toUpperCase()} (${pValue}${pType === 'percent' ? '%' : ' FCFA'})`,
      severity: 'info'
    })

    toastSuccess(`Code promo global ${pCode.toUpperCase()} activé sur tout le site !`)
    setModalOpen(false)
    setPCode('')
    setPValue('15')
    setPDesc('')
    onRefresh()
  }

  const handleDeletePromo = (promoId: string) => {
    PromoAPI.delete(promoId)
    toastSuccess('Code promo supprimé.')
    onRefresh()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Tag className="w-5 h-5 text-pink-400" /> Codes Promo Globaux & Parrainage ({promos.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Créez des coupons de réduction applicables sur toute la plateforme et suivez le programme de parrainage.
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} className="bg-pink-600 hover:bg-pink-500 text-white text-xs gap-1.5 shadow-lg shadow-pink-600/20">
          <Plus className="w-4 h-4" /> Nouveau Code Global
        </Button>
      </div>

      {/* Promos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.length === 0 ? (
          <div className="col-span-full card-glass p-12 text-center space-y-3">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucun code promo global créé.</p>
          </div>
        ) : (
          promos.map(promo => (
            <div key={promo.id} className="card-glass p-4 flex flex-col justify-between space-y-3 hover:border-pink-500/40 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold font-mono text-pink-400 bg-pink-500/10 px-3 py-1 rounded-lg border border-pink-500/20">
                    {promo.code}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Global 🌐
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{promo.description}</p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/40 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  Réduction: <span className="text-pink-400">{promo.discount_type === 'percent' ? `-${promo.value}%` : `-${formatPrice(promo.value)}`}</span>
                </span>
                <Button onClick={() => handleDeletePromo(promo.id)} variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Referral Program Widget */}
      <div className="card-glass p-6 space-y-4">
        <h3 className="font-bold text-base text-foreground flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-400" /> Suivi du Programme de Parrainage
        </h3>

        <div className="divide-y divide-border/40">
          {referrals.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">Aucun parrainage enregistré pour le moment.</p>
          ) : (
            referrals.map(ref => (
              <div key={ref.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-foreground">Parrain: {ref.referrer_email}</p>
                  <p className="text-muted-foreground">Filleul: {ref.referred_email}</p>
                </div>
                <span className="font-bold text-emerald-400">Prime: {formatPrice(ref.reward_amount)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Créer un code promo global pour MarchéPlus">
        <form onSubmit={handleCreateGlobalPromo} className="space-y-4">
          <Input label="Code Promo Global" value={pCode} onChange={(e) => setPCode(e.target.value)} placeholder="RENTREE2026" required />
          
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={pType} onChange={(e) => setPType(e.target.value as any)}>
              <option value="percent">Pourcentage (%)</option>
              <option value="fixed">Montant Fixe (FCFA)</option>
            </Select>

            <Input label="Valeur" type="number" value={pValue} onChange={(e) => setPValue(e.target.value)} required />
          </div>

          <Input label="Description" value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Offre promotionnelle spéciale rentrée" />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white">Activer sur tout le site</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
