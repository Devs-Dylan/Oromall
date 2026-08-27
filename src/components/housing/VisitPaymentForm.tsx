import { useState } from 'react'
import { X, CheckCircle, Phone, Calendar, Clock, Upload, MessageCircle } from 'lucide-react'
import type { VisitRequest, VisitPackage } from '@/types'
import { VISIT_PACKAGES, PaymentMethod } from '@/types'
import { VisitRequestAPI, NotificationAPI } from '@/lib/store'
import { formatPrice, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { FileUploadField } from '@/components/ui/FileUploadField'
import { toastSuccess, toastError } from '@/components/ui/Toast'

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
    if (!paymentProof && !paymentReference.trim()) {
      toastError('Veuillez fournir la preuve de paiement (capture ou référence).')
      return
    }
    if (!visitDate || !visitTime) {
      toastError('Veuillez sélectionner la date et l\'heure de visite.')
      return
    }

    setProcessing(true)
    await new Promise(r => setTimeout(r, 800))

    const request: Omit<VisitRequest, 'id' | 'created_date' | 'updated_date'> = {
      housing_id: housingId,
      housing_title: housingTitle,
      housing_city: housingCity,
      housing_image: housingImage,
      visitor_name: visitorName || 'Étudiant / Client',
      visitor_email: visitorEmail || 'client@marcheplus.cm',
      visitor_phone: whatsappNumber,
      package_type: pkg.id,
      package_label: pkg.label,
      amount: pkg.price,
      payment_method: paymentMethod,
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

    setCreatedRequest(saved)
    setProcessing(false)
    toastSuccess('Demande de visite enregistrée !', 'Vous pouvez notifier le support via WhatsApp.')
    onSuccess?.()
  }

  if (!open) return null

  const whatsappConfirmMessage = createdRequest
    ? `Bonjour MarchéPlus ! Je viens de payer le ${pkg.label} (${formatPrice(pkg.price)}) pour visiter le logement : "${housingTitle}" (${housingCity}) le ${visitDate} à ${visitTime}.\nMon WhatsApp de contact : ${whatsappNumber}\nRéf: ${paymentReference || 'Preuve envoyée'}`
    : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card-glass p-6 md:p-8 max-w-lg w-full space-y-6 animate-in fade-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-foreground">Demande de Visite Logement</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Paiement du forfait et planification de votre visite.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdRequest ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Demande Envoyée avec Succès !</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Votre demande de visite a été enregistrée. Vous recevrez toutes les notifications sur votre WhatsApp (<strong className="text-foreground">{whatsappNumber}</strong>).
              </p>
            </div>

            <div className="p-4 bg-muted/40 rounded-xl border border-border text-left text-xs space-y-1">
              <p><span className="text-muted-foreground">Logement :</span> <strong>{housingTitle}</strong></p>
              <p><span className="text-muted-foreground">Date :</span> {visitDate} à {visitTime}</p>
              <p><span className="text-muted-foreground">Forfait :</span> {pkg.label} ({formatPrice(pkg.price)})</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href={buildWhatsAppUrl(ADMIN_WHATSAPP, whatsappConfirmMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-colors shadow-lg shadow-emerald-600/20"
              >
                <MessageCircle className="w-5 h-5" /> Notifier le support sur WhatsApp
              </a>
              <Button variant="ghost" onClick={onClose} className="w-full">
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Package Summary */}
            <div className="p-4 rounded-xl bg-muted/40 border border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{pkg.label}</span>
                <span className="text-sm font-extrabold text-primary">{formatPrice(pkg.price)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{pkg.description}</p>
            </div>

            {/* WhatsApp Obligatoire */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <label className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" /> Numéro WhatsApp du Client (Obligatoire pour les alertes) *
              </label>
              <Input
                type="tel"
                value={whatsappNumber}
                onChange={e => setWhatsappNumber(e.target.value)}
                placeholder="Ex: 677123456 ou +237 6..."
                required
                className="bg-card font-medium"
              />
              <p className="text-[11px] text-muted-foreground">
                L'agent et le propriétaire vous enverront l'adresse exacte et la confirmation sur ce numéro.
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Mode de paiement</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mtn')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${paymentMethod === 'mtn' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}
                >
                  <Phone className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
                  <p className="text-sm font-bold text-foreground">MTN MoMo</p>
                  <p className="text-xs text-muted-foreground">{ADMIN_MTN}</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('orange')}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${paymentMethod === 'orange' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'}`}
                >
                  <Phone className="w-6 h-6 mx-auto mb-1 text-orange-500" />
                  <p className="text-sm font-bold text-foreground">Orange Money</p>
                  <p className="text-xs text-muted-foreground">{ADMIN_ORANGE}</p>
                </button>
              </div>
            </div>

            {/* Amount Display */}
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center space-y-1">
              <p className="text-xs text-muted-foreground">Montant à payer</p>
              <p className="text-2xl font-extrabold text-primary">{formatPrice(pkg.price)}</p>
              <p className="text-xs text-muted-foreground">Numéro {paymentMethod === 'mtn' ? 'MTN' : 'Orange'} : <strong className="text-foreground">{adminNumber}</strong></p>
            </div>

            {/* Payment Proof */}
            <FileUploadField
              label="Capture de paiement (optionnel si référence)"
              value={paymentProof}
              onChange={(val) => { setPaymentProof(val); if (val) setPaymentReference('') }}
              accept="image/*"
              maxSizeMB={10}
            />

            <Input
              label="Référence de transaction (optionnel si capture)"
              value={paymentReference}
              onChange={e => setPaymentReference(e.target.value)}
              placeholder="Ex: TXN123456"
            />

            {/* Visit Schedule */}
            <div className="pt-4 border-t border-border space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Planifier la visite
              </h3>

              <div className="grid grid-cols-2 gap-3">
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
                <label className="text-xs font-semibold text-foreground">Notes (optionnel)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Informations supplémentaires, demande particulière..."
                  className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none text-xs text-foreground resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
              <Button type="submit" disabled={processing} className="bg-primary text-white">
                {processing ? 'Traitement...' : 'Confirmer la demande'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
