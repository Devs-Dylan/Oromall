import { useState } from 'react'
import { Megaphone, Check, Eye, Plus, Gift, Trash2, Tag } from 'lucide-react'
import type { PromoCode, Referral } from '@/types'
import { PromoAPI, ReferralAPI, AuditLogAPI } from '@/lib/store'
import { formatPrice, formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface AdminCommsTabProps {
  promos: PromoCode[]
  referrals: Referral[]
  adminName?: string
  onRefresh: () => void
}

type CommsView = 'promos' | 'announcements'

export function AdminCommsTab({ promos, referrals, adminName = 'SuperAdmin', onRefresh }: AdminCommsTabProps) {
  const [view, setView] = useState<CommsView>('promos')

  // Promo state
  const [modalOpen, setModalOpen] = useState(false)
  const [pCode, setPCode] = useState('')
  const [pType, setPType] = useState<'percent' | 'fixed'>('percent')
  const [pValue, setPValue] = useState('15')
  const [pDesc, setPDesc] = useState('')

  // Announcement state
  const [announcementText, setAnnouncementText] = useState(() => localStorage.getItem('mp_announcement') || '🔥 Offres spéciales rentrée académique : Jusqu\'à -20% sur la catégorie Électronique !')
  const [enabled, setEnabled] = useState(() => localStorage.getItem('mp_announcement_enabled') !== '0')

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pCode || !pValue) { toastError('Veuillez spécifier le code et la réduction.'); return }
    PromoAPI.create({ code: pCode.toUpperCase(), description: pDesc || `Code Promo Global -${pValue}${pType === 'percent' ? '%' : ' FCFA'}`, discount_type: pType, value: Number(pValue), uses_count: 0, active: true })
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Création Code Promo Global', details: `Code: ${pCode.toUpperCase()}`, severity: 'info' })
    toastSuccess(`Code promo ${pCode.toUpperCase()} activé !`)
    setModalOpen(false)
    setPCode(''); setPValue('15'); setPDesc('')
    onRefresh()
  }

  const handleDeletePromo = (promoId: string) => {
    PromoAPI.delete(promoId)
    toastSuccess('Code promo supprimé.')
    onRefresh()
  }

  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('mp_announcement', announcementText)
    localStorage.setItem('mp_announcement_enabled', enabled ? '1' : '0')
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Mise à jour Bannière', details: `Texte: "${announcementText}" (${enabled ? 'Actif' : 'Masqué'})`, severity: 'info' })
    toastSuccess('Bannière d\'annonce mise à jour !')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            📢 Promotions & Communications
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gérez les codes promo et la bannière globale du site.</p>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2">
        <button onClick={() => setView('promos')} className={cn('px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5', view === 'promos' ? 'bg-pink-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
          <Tag className="w-3.5 h-3.5" /> 🎟️ Codes Promo ({promos.length})
        </button>
        <button onClick={() => setView('announcements')} className={cn('px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5', view === 'announcements' ? 'bg-amber-600 text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
          <Megaphone className="w-3.5 h-3.5" /> 📢 Bannière Globale
        </button>
      </div>

      {/* Promos View */}
      {view === 'promos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setModalOpen(true)} className="bg-pink-600 hover:bg-pink-500 text-white text-xs gap-1.5"><Plus className="w-4 h-4" /> Nouveau Code</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {promos.length === 0 ? (
              <div className="col-span-full card-glass p-12 text-center space-y-3"><Tag className="w-12 h-12 text-muted-foreground mx-auto" /><p className="text-sm font-semibold text-foreground">Aucun code promo créé.</p></div>
            ) : promos.map(promo => (
              <div key={promo.id} className="card-glass p-4 flex flex-col justify-between space-y-3 hover:border-pink-500/40 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold font-mono text-pink-400 bg-pink-500/10 px-3 py-1 rounded-lg border border-pink-500/20">{promo.code}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Global 🌐</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{promo.description}</p>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/40 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Réduction: <span className="text-pink-400">{promo.discount_type === 'percent' ? `-${promo.value}%` : `-${formatPrice(promo.value)}`}</span></span>
                  <Button size="sm" variant="ghost" onClick={() => handleDeletePromo(promo.id)} className="text-red-400 hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            ))}
          </div>

          {/* Referral Widget */}
          <div className="card-glass p-6 space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2"><Gift className="w-5 h-5 text-amber-400" /> Programme de Parrainage</h3>
            <div className="divide-y divide-border/40">
              {referrals.length === 0 ? <p className="text-xs text-muted-foreground py-4 text-center">Aucun parrainage enregistré.</p> : referrals.map(ref => (
                <div key={ref.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div><p className="font-semibold text-foreground">Parrain: {ref.referrer_email}</p><p className="text-muted-foreground">Filleul: {ref.referred_email}</p></div>
                  <span className="font-bold text-emerald-400">Prime: {formatPrice(ref.reward_amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Create Promo Modal */}
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Créer un code promo global">
            <form onSubmit={handleCreatePromo} className="space-y-4">
              <Input label="Code Promo" value={pCode} onChange={e => setPCode(e.target.value)} placeholder="RENTREE2026" required />
              <div className="grid grid-cols-2 gap-3">
                <Select label="Type" value={pType} onChange={e => setPType(e.target.value as any)} options={[{ value: 'percent', label: 'Pourcentage (%)' }, { value: 'fixed', label: 'Montant Fixe (FCFA)' }]} />
                <Input label="Valeur" type="number" value={pValue} onChange={e => setPValue(e.target.value)} required />
              </div>
              <Input label="Description" value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Offre promotionnelle..." />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Annuler</Button>
                <Button type="submit" className="bg-pink-600 hover:bg-pink-500 text-white">Activer</Button>
              </div>
            </form>
          </Modal>
        </div>
      )}

      {/* Announcements View */}
      {view === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSaveAnnouncement} className="lg:col-span-2 card-glass p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-foreground">Éditeur de la Bannière Flash</h3>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
                <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="rounded border-border text-primary focus:ring-primary" />
                <span>Afficher la bannière</span>
              </label>
            </div>
            <Textarea label="Texte de l'annonce" value={announcementText} onChange={e => setAnnouncementText(e.target.value)} placeholder="Entrez le message..." rows={4} required />
            <div className="flex justify-end pt-2">
              <Button type="submit" className="gap-1.5"><Check className="w-4 h-4" /> Publier</Button>
            </div>
          </form>
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Eye className="w-4 h-4 text-primary" /> Aperçu Visuel</h3>
            <div className="card-glass p-4 space-y-3">
              <p className="text-xs text-muted-foreground">La bannière apparaîtra ainsi en haut de l'écran :</p>
              {enabled ? <div className="p-3 rounded-xl bg-gradient-to-r from-primary via-purple-600 to-amber-500 text-white text-xs font-bold shadow-lg animate-pulse">{announcementText}</div> : <div className="p-3 rounded-xl bg-muted text-muted-foreground text-xs text-center border border-dashed border-border">La bannière est désactivée.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
