import { useState } from 'react'
import { X, CheckCircle, Phone, Calendar, Clock, Upload, MessageCircle, Zap, CreditCard, ShieldCheck } from 'lucide-react'
import type { VisitRequest, VisitPackage } from '@/types'
import { VISIT_PACKAGES, PaymentMethod } from '@/types'
import { VisitRequestAPI, NotificationAPI } from '@/lib/store'
import { formatPrice, buildWhatsAppUrl, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileUploadField } from '@/components/ui/FileUploadField'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { createMaketouCheckout, maketouCartKey } from '@/lib/maketou'

interface VisitPaymentFormProps {
  open: boolean
  onClose: () => void
  housingId: string
  housingTitle: string
  housingCity: string
  housingImage: string
  visitorName: string
  visitorEmail: string
  visitorPhone: string
  selectedPackage: VisitPackage
  onSuccess?: () => void
}

const ADMIN_MTN = '680195221'
const ADMIN_ORANGE = '691576677'
const ADMIN_WHATSAPP = '237680195221'

export function VisitPaymentForm({
  open, onClose, housingId, housingTitle, housingCity, housingImage,
  visitorName, visitorEmail, visitorPhone, selectedPackage, onSuccess
}: VisitPaymentFormProps) {
  const [checkoutType, setCheckoutType] = useState<'maketou' | 'manual'>('maketou')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mtn')
  const [paymentProof, setPaymentProof] = useState<string | undefined>(undefined)
  const [paymentReference, setPaymentReference] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [visitTime, setVisitTime] = useState('')
  const [notes, setNotes] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState(visitorPhone || '')
  const [processing, setProcessing] = useState(false)
  const [createdRequest, setCreatedRequest] = useState<any>(null)

  const pkg = VISIT_PACKAGES.find(p => p.id === selectedPackage) || VISIT_PACKAGES[0]
  const adminNumber = paymentMethod === 'mtn' ? ADMIN_MTN : ADMIN_ORANGE

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!whatsappNumber.trim()) {
      toastError('Le numéro WhatsApp du client est obligatoire pour les notifications de visite.')
      return
    }
    if (checkoutType === 'manual' && !paymentProof && !paymentReference.trim()) {
      toastError('Veuillez fournir la preuve de paiement (capture ou référence).')
      return
    }
    if (!visitDate || !visitTime) {
      toastError('Veuillez sélectionner la date et l\'heure de visite.')
      return
    }

    setProcessing(true)

    const request: Omit<VisitRequest, 'id' | 'created_date' | 'updated_date'> = {
      housing_id: housingId,
      housing_title: housingTitle,
      housing_city: housingCity,
      housing_image: housingImage,
      visitor_name: visitorName || 'Étudiant / Client',
      visitor_email: visitorEmail || 'client@oromall.cm',
      visitor_phone: whatsappNumber,
      package_type: pkg.id,
      package_label: pkg.label,
      amount: pkg.price,
      payment_method: checkoutType === 'maketou' ? 'momo_online' : paymentMethod,
      payment_proof_url: paymentProof,
      payment_reference: paymentReference || undefined,
      payment_status: 'pending',
      visit_date: visitDate,
      visit_time: visitTime,
      status: 'pending',
      notes: notes || undefined,
    }

    const saved = VisitRequestAPI.create(request)

    NotificationAPI.create({
      user_email: visitorEmail,
      title: 'Demande de visite enregistrée',
      message: `Votre demande de visite pour "${housingTitle}" a été enregistrée. Les confirmations seront envoyées par WhatsApp au ${whatsappNumber}.`,
      type: 'system',
      read: false,
    })

    // SI PAIEMENT EN LIGNE MAKETOU SÉLECTIONNÉ :
    if (checkoutType === 'maketou') {
      try {
        const maketouRes = await createMaketouCheckout({
          amount: pkg.price,
          firstName: (visitorName || 'Client').trim(),
          email: visitorEmail || `${whatsappNumber.replace(/\D/g, '')}@client.oromall.cm`,
          phone: whatsappNumber.trim(),
          redirectURL: `${window.location.origin}/orders?status=return&ref=${saved.id}&type=visit`,
          meta: {
            visitRequestId: saved.id,
            housingId,
            package: pkg.id,
            source: 'oromall_housing_visit',
          },
        })

        if (maketouRes.success && maketouRes.invoice_url) {
          if (maketouRes.cartId) {
            localStorage.setItem(maketouCartKey(saved.id), maketouRes.cartId)
          }
          window.location.href = maketouRes.invoice_url
          return
        } else {
          toastError('Erreur passerelle Maketou', maketouRes.message || 'Impossible d\'ouvrir le guichet.')
        }
      } catch (err: any) {
        toastError('Erreur de paiement', err?.message || 'Erreur réseau.')
      }
    }

    setCreatedRequest(saved)
    setProcessing(false)
    toastSuccess('Demande de visite enregistrée !', 'Vous pouvez notifier le support via WhatsApp.')
    onSuccess?.()
  }

  if (!open) return null

  const whatsappConfirmMessage = createdRequest
    ? `Bonjour OroMall ! Je viens de réserver le ${pkg.label} (${formatPrice(pkg.price)}) pour visiter le logement : "${housingTitle}" (${housingCity}) le ${visitDate} à ${visitTime}.\nMon WhatsApp de contact : ${whatsappNumber}\nRéf: ${paymentReference || 'Preuve envoyée'}`
    : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="card-glass p-6 md:p-8 max-w-lg w-full space-y-6 max-h-[90vh] overflow-y-auto border border-primary/40 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-xl font-bold font-display text-foreground">Demande de Visite Logement</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Paiement du forfait et planification de votre visite.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdRequest ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Demande de visite transmise !</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Votre demande pour <strong className="text-foreground">{housingTitle}</strong> a bien été enregistrée.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Forfait :</span>
                <span className="font-bold text-foreground">{pkg.label} ({formatPrice(pkg.price)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date :</span>
                <span className="font-bold text-foreground">{visitDate} à {visitTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contact :</span>
                <span className="font-bold text-foreground">{whatsappNumber}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href={buildWhatsAppUrl(ADMIN_WHATSAPP, whatsappConfirmMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                <MessageCircle className="w-4 h-4" /> Envoyer la confirmation sur WhatsApp
              </a>
              <Button variant="outline" onClick={onClose} className="w-full justify-center text-xs">
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Housing & Package Summary */}
            <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 flex items-center gap-3">
              <img src={housingImage} alt={housingTitle} className="w-12 h-12 rounded-xl object-cover border border-border/50 shrink-0" />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-foreground truncate">{housingTitle}</h4>
                <p className="text-[11px] text-muted-foreground">{housingCity}</p>
                <p className="text-xs font-extrabold text-primary">{pkg.label} • {formatPrice(pkg.price)}</p>
              </div>
            </div>

            {/* WhatsApp Contact */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Numéro WhatsApp du visiteur *</label>
              <Input
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                placeholder="Ex: 680195221"
                required
              />
              <p className="text-[10px] text-muted-foreground">Pour recevoir la confirmation du bailleur et la localisation GPS exacte.</p>
            </div>

            {/* Payment Choice */}
            <div className="space-y-3 p-3.5 rounded-2xl bg-card border border-border">
              <h3 className="font-bold text-foreground flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" /> Mode de Règlement ({formatPrice(pkg.price)})
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Sécurisé Maketou
                </span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setCheckoutType('maketou')}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-1',
                    checkoutType === 'maketou'
                      ? 'border-emerald-500 bg-emerald-500/10 text-foreground ring-2 ring-emerald-500/20 shadow-md'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-500 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-emerald-500" /> Paiement Direct en Ligne
                    </span>
                    <span className="text-[9px] uppercase font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                      Instantané
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    MTN MoMo, OM, Wave & Carte. Push USSD sur votre mobile.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutType('manual')}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-1',
                    checkoutType === 'manual'
                      ? 'border-amber-400 bg-amber-500/10 text-foreground ring-2 ring-amber-400/20 shadow-md'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-400">
                      Transfert Manuel MoMo
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Transfert au numéro de l'agence avec justificatif.
                  </p>
                </button>
              </div>

              {checkoutType === 'manual' && (
                <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mtn')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${paymentMethod === 'mtn' ? 'border-primary bg-primary/10 font-bold' : 'border-border hover:bg-muted'}`}
                    >
                      <p className="text-xs font-bold text-foreground">MTN MoMo</p>
                      <p className="text-[10px] text-muted-foreground">{ADMIN_MTN}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('orange')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${paymentMethod === 'orange' ? 'border-primary bg-primary/10 font-bold' : 'border-border hover:bg-muted'}`}
                    >
                      <p className="text-xs font-bold text-foreground">Orange Money</p>
                      <p className="text-[10px] text-muted-foreground">{ADMIN_ORANGE}</p>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <FileUploadField
                      label="Capture du paiement"
                      value={paymentProof}
                      onChange={(val) => { setPaymentProof(val); if (val) setPaymentReference('') }}
                      accept="image/*"
                      maxSizeMB={10}
                    />

                    <Input
                      label="Réf / ID Transaction"
                      value={paymentReference}
                      onChange={e => setPaymentReference(e.target.value)}
                      placeholder="Ex: TXN123456"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Visit Schedule */}
            <div className="pt-2 border-t border-border space-y-3">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Planifier la date & heure de visite
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Date souhaitée *</label>
                  <Input
                    type="date"
                    value={visitDate}
                    onChange={e => setVisitDate(e.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Heure souhaitée *</label>
                  <Input
                    type="time"
                    value={visitTime}
                    onChange={e => setVisitTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Précisions pour le bailleur (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: Je viendrai avec un colocataire, disponible après 14h..."
                  className="w-full px-3 py-2 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-xs text-foreground resize-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-2.5 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={onClose} className="text-xs">
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={processing}
                className="bg-gradient-to-r from-amber-500 via-primary to-amber-600 hover:opacity-95 text-black font-extrabold text-xs shadow-xl shadow-primary/25 rounded-xl"
              >
                {processing ? (
                  'Redirection...'
                ) : checkoutType === 'maketou' ? (
                  <>
                    <Zap className="w-3.5 h-3.5 fill-current" /> Payer {formatPrice(pkg.price)} via Maketou
                  </>
                ) : (
                  'Confirmer la demande'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
