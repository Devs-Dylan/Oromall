import { useState, useMemo } from 'react'
import { Tag, Plus, Trash2, CheckCircle, Percent, Clock, AlertCircle } from 'lucide-react'
import type { PromoCode } from '@/types'
import { PromoAPI } from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface SellerPromosTabProps {
  promos: PromoCode[]
  userEmail?: string
  onRefresh: () => void
}

export function SellerPromosTab({ promos, userEmail, onRefresh }: SellerPromosTabProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [pCode, setPCode] = useState('')
  const [pType, setPType] = useState<'percent' | 'fixed'>('percent')
  const [pValue, setPValue] = useState('10')
  const [pDesc, setPDesc] = useState('')

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pCode || !pValue) {
      toastError('Veuillez spécifier un code et une valeur.')
      return
    }

    PromoAPI.create({
      code: pCode.toUpperCase(),
      description: pDesc || `Réduction boutique -${pValue}${pType === 'percent' ? '%' : ' FCFA'}`,
      discount_type: pType,
      value: Number(pValue),
      uses_count: 0,
      active: true,
      owner_email: userEmail
    })

    toastSuccess(`Code promo boutique ${pCode.toUpperCase()} créé avec succès !`)
    setModalOpen(false)
    setPCode('')
    setPValue('10')
    setPDesc('')
    onRefresh()
  }

  const handleTogglePromo = (promoId: string, currentActive: boolean) => {
    PromoAPI.update(promoId, { active: !currentActive })
    toastSuccess(`Code promo ${!currentActive ? 'activé 🟢' : 'désactivé 🔴'}`)
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
            <Tag className="w-5 h-5 text-pink-400" /> Coupons & Offres Marketing ({promos.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Boostez vos ventes en proposant des codes promo exclusifs à vos clients.
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5 bg-pink-600 hover:bg-pink-500 shadow-lg shadow-pink-600/20">
          <Plus className="w-4 h-4" /> Créer un Code Promo
        </Button>
      </div>

      {/* Promos List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.length === 0 ? (
          <div className="col-span-full card-glass p-12 text-center space-y-3">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucun code promo créé pour votre boutique.</p>
            <Button onClick={() => setModalOpen(true)} variant="outline" size="sm">Créer mon premier coupon</Button>
          </div>
        ) : (
          promos.map(promo => (
            <div key={promo.id} className="card-glass p-4 flex flex-col justify-between space-y-4 hover:border-pink-500/40 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold font-mono text-pink-400 bg-pink-500/10 px-3 py-1 rounded-lg border border-pink-500/20">
                    {promo.code}
                  </span>
                  <button
                    onClick={() => handleTogglePromo(promo.id, promo.active)}
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors',
                      promo.active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'
                    )}
                  >
                    {promo.active ? 'Actif 🟢' : 'Inactif 🔴'}
                  </button>
                </div>

                <p className="text-xs text-muted-foreground pt-1">{promo.description}</p>
              </div>

              <div className="space-y-3 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground">
                    Réduction: <span className="text-pink-400">{promo.discount_type === 'percent' ? `-${promo.value}%` : `-${formatPrice(promo.value)}`}</span>
                  </span>
                  <span className="text-muted-foreground">{promo.uses_count || 0} utilisations</span>
                </div>

                <div className="flex justify-end pt-1">
                  <Button onClick={() => handleDeletePromo(promo.id)} variant="ghost" size="sm" className="h-8 text-xs text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Promo Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Créer un coupon de réduction boutique">
        <form onSubmit={handleCreatePromo} className="space-y-4">
          <Input
            label="Code Promo (ex: BIENVENUE10)"
            value={pCode}
            onChange={(e) => setPCode(e.target.value)}
            placeholder="RENTREE2026"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select label="Type de réduction" value={pType} onChange={(e) => setPType(e.target.value as any)}>
              <option value="percent">Pourcentage (%)</option>
              <option value="fixed">Montant fixe (FCFA)</option>
            </Select>

            <Input
              label={pType === 'percent' ? 'Valeur (%)' : 'Valeur (FCFA)'}
              type="number"
              value={pValue}
              onChange={(e) => setPValue(e.target.value)}
              placeholder="10"
              required
            />
          </div>

          <Input
            label="Description"
            value={pDesc}
            onChange={(e) => setPDesc(e.target.value)}
            placeholder="Ex: 10% de réduction sur tout le catalogue"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white">Activer le coupon</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
