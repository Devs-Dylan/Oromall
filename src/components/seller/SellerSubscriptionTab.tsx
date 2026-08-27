import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Upload } from 'lucide-react'
import type { Subscription } from '@/types'
import { SubscriptionAPI, NotificationAPI } from '@/lib/store'
import { formatPrice, formatDate, cn, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { FileUploadField } from '@/components/ui/FileUploadField'
import { useAuth } from '@/hooks/useAuth'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface SellerSubscriptionTabProps {
  subscription: Subscription | undefined
  onRefresh: () => void
}

export function SellerSubscriptionTab({ subscription, onRefresh }: SellerSubscriptionTabProps) {
  const { user } = useAuth()
  const [renewModalOpen, setRenewModalOpen] = useState(false)
  const [proofType, setProofType] = useState<'reference' | 'image'>('reference')
  const [proofValue, setProofValue] = useState('')
  const [proofFile, setProofFile] = useState<string | undefined>(undefined)
  const [processing, setProcessing] = useState(false)

  const handleRenew = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalProof = proofFile || proofValue
    if (!finalProof || (proofType === 'reference' && !proofValue.trim())) {
      toastError('Veuillez fournir la preuve de paiement.')
      return
    }
    setProcessing(true)
    await new Promise(r => setTimeout(r, 800))

    if (subscription) {
      SubscriptionAPI.update(subscription.id, {
        payment_proof_url: finalProof,
        payment_proof_type: proofType,
        payment_reference: proofType === 'reference' ? proofValue : undefined,
        status: 'expiring',
        updated_date: new Date().toISOString(),
      })
    } else {
      SubscriptionAPI.create({
        shop_id: '',
        shop_name: '',
        owner_email: user?.email || '',
        owner_name: user?.name || '',
        status: 'expiring',
        amount: 15000,
        currency: 'FCFA',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_proof_url: finalProof,
        payment_proof_type: proofType,
        payment_reference: proofType === 'reference' ? proofValue : undefined,
        days_remaining: 30,
      })
    }

    NotificationAPI.create({
      user_email: user?.email,
      title: 'Renouvellement d\'abonnement en cours',
      message: 'Votre preuve de paiement a été soumise. L\'admin va valider sous peu.',
      type: 'system',
      read: false,
    })

    setProcessing(false)
    setRenewModalOpen(false)
    setProofValue('')
    setProofFile(undefined)
    toastSuccess('Preuve de paiement soumise !', 'En attente de validation par l\'admin.')
    onRefresh()
  }

  if (!subscription) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Mon Abonnement
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Abonnez-vous pour activer votre boutique.</p>
          </div>
        </div>
        <div className="card-glass p-8 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-foreground">Aucun abonnement actif</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">Votre boutique n'est pas encore activée. Souscrivez un abonnement pour commencer à vendre.</p>
          <Button onClick={() => setRenewModalOpen(true)} className="bg-primary text-white">
            <RefreshCw className="w-4 h-4" /> Souscrire un abonnement (15 000 FCFA / 30j)
          </Button>
        </div>

        <Modal open={renewModalOpen} onClose={() => setRenewModalOpen(false)} title="Souscrire un abonnement">
          <form onSubmit={handleRenew} className="space-y-4">
            <div className="bg-muted/40 p-4 rounded-xl space-y-2">
              <p className="font-semibold text-foreground">Abonnement Boutique - 15 000 FCFA / 30 jours</p>
              <p className="text-xs text-muted-foreground">Payer via MTN MoMo ou Orange Money aux numéros de l'admin :</p>
              <p className="text-xs text-foreground">MTN: 680195221 • OM: 691576677</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Type de preuve</label>
              <div className="flex gap-3">
                <button type="button" onClick={() => setProofType('reference')} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${proofType === 'reference' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
                  Référence de paiement
                </button>
                <button type="button" onClick={() => setProofType('image')} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${proofType === 'image' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
                  Capture d'écran
                </button>
              </div>
            </div>
            <Input
              label={proofType === 'reference' ? 'Référence / ID de transaction' : 'URL de l\'image'}
              required
              value={proofValue}
              onChange={e => setProofValue(e.target.value)}
              placeholder={proofType === 'reference' ? 'Ex: TXN123456' : 'https://...'}
            />
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="ghost" onClick={() => setRenewModalOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={processing} className="bg-primary text-white">
                <Upload className="w-4 h-4" /> Soumettre la preuve
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    )
  }

  const isExpiring = subscription.days_remaining <= 5 && subscription.days_remaining > 0
  const isExpired = subscription.days_remaining <= 0

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" /> Mon Abonnement
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gérez votre abonnement et renouvelez-le avant expiration.</p>
        </div>
      </div>

      <div className={`card-glass p-6 border ${isExpired ? 'border-red-500/30' : isExpiring ? 'border-amber-500/30' : 'border-emerald-500/30'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${subscription.status === 'active' ? 'badge-success' : subscription.status === 'expiring' ? 'badge-warning' : subscription.status === 'expired' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                {subscription.status === 'active' ? 'Active' : subscription.status === 'expiring' ? 'Expire bientôt' : subscription.status === 'expired' ? 'Expirée' : 'Suspendue'}
              </span>
              <span className="text-xs text-muted-foreground">Depuis le {formatDate(subscription.start_date)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Fin d'abonnement : <strong className="text-foreground">{formatDate(subscription.end_date)}</strong></p>
            <p className="text-xs text-muted-foreground">Jours restants : <strong className={isExpiring || isExpired ? 'text-red-500' : 'text-foreground'}>{subscription.days_remaining} jours</strong></p>
            {subscription.payment_reference && <p className="text-xs text-muted-foreground">Référence: {subscription.payment_reference}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setRenewModalOpen(true)} className="bg-primary text-white">
              <RefreshCw className="w-4 h-4" /> Renouveler (15 000 FCFA)
            </Button>
            {isExpiring && (
              <p className="text-xs text-amber-600 font-semibold">Attention: expire dans {subscription.days_remaining} jours</p>
            )}
            {isExpired && (
              <p className="text-xs text-red-600 font-semibold">Abonnement expiré. Renouvelez pour réactiver votre boutique.</p>
            )}
          </div>
        </div>
      </div>

      <Modal open={renewModalOpen} onClose={() => setRenewModalOpen(false)} title="Renouveler mon abonnement">
        <form onSubmit={handleRenew} className="space-y-4">
          <div className="bg-muted/40 p-4 rounded-xl space-y-2">
            <p className="font-semibold text-foreground">Abonnement Boutique - 15 000 FCFA / 30 jours</p>
            <p className="text-xs text-muted-foreground">Payer via MTN MoMo ou Orange Money aux numéros de l'admin :</p>
            <p className="text-xs text-foreground">MTN: 680195221 • OM: 691576677</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Type de preuve</label>
            <div className="flex gap-3">
              <button type="button" onClick={() => setProofType('reference')} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${proofType === 'reference' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
                Référence de paiement
              </button>
              <button type="button" onClick={() => setProofType('image')} className={`flex-1 p-3 rounded-xl border text-xs font-bold transition-all ${proofType === 'image' ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted'}`}>
                Capture d'écran
              </button>
            </div>
          </div>
          {proofType === 'reference' ? (
            <Input
              label="Référence / ID de transaction"
              required
              value={proofValue}
              onChange={e => setProofValue(e.target.value)}
              placeholder="Ex: TXN123456"
            />
          ) : (
            <FileUploadField
              label="Capture d'écran du paiement"
              value={proofFile}
              onChange={(val) => { setProofFile(val); if (val) setProofValue('') }}
              accept="image/*"
              maxSizeMB={10}
            />
          )}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setRenewModalOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={processing} className="bg-primary text-white">
              <Upload className="w-4 h-4" /> Soumettre la preuve
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
