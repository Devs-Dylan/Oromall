import { useState, useMemo } from 'react'
import {
  CheckCircle2, XCircle, Eye, Building2, MapPin, Phone,
  Clock, ShieldAlert, Sparkles, User, MessageSquare, AlertCircle, Check, X, ExternalLink
} from 'lucide-react'
import { HousingAPI, NotificationAPI, AuditLogAPI } from '@/lib/store'
import type { Housing } from '@/types'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toastSuccess, toastError } from '@/components/ui/Toast'

export function AdminAssociateSubmissionsTab() {
  const [, forceUpdate] = useState(0)
  const allHousings = HousingAPI.list()

  // State for preview modal
  const [previewHousing, setPreviewHousing] = useState<Housing | null>(null)

  // State for reject modal
  const [rejectHousing, setRejectHousing] = useState<Housing | null>(null)
  const [rejectReason, setRejectReason] = useState<string>('')

  // Filter pending associate submissions
  const pendingSubmissions = useMemo(() => {
    return allHousings.filter(h => h.status === 'pending_review')
  }, [allHousings])

  const approvedSubmissions = useMemo(() => {
    return allHousings.filter(h => h.submitted_by_associate_id && (h.status === 'active' || h.status === 'available'))
  }, [allHousings])

  const rejectedSubmissions = useMemo(() => {
    return allHousings.filter(h => h.submitted_by_associate_id && h.status === 'rejected')
  }, [allHousings])

  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'approved' | 'rejected'>('pending')

  // Approve housing submission
  const handleApprove = (housing: Housing) => {
    HousingAPI.update(housing.id, {
      status: 'active',
      rejection_reason: undefined,
      updated_date: new Date().toISOString()
    })

    // Create Audit log
    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: 'Administrateur',
      action: `Validation logement associé : ${housing.title}`,
      details: `Logement validé et mis en ligne. Soumis par : ${housing.submitted_by_associate_name || 'Associé'} (${housing.city} - ${housing.neighborhood})`,
      severity: 'info'
    })

    toastSuccess('Logement validé et mis en ligne ! 🏠', `Visible dès maintenant dans le catalogue public et sur la carte.`)
    setPreviewHousing(null)
    forceUpdate(n => n + 1)
  }

  // Reject housing submission
  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectHousing) return

    HousingAPI.update(rejectHousing.id, {
      status: 'rejected',
      rejection_reason: rejectReason.trim() || 'Informations incomplètes ou non conformes.',
      updated_date: new Date().toISOString()
    })

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: 'Administrateur',
      action: `Refus logement associé : ${rejectHousing.title}`,
      details: `Motif : ${rejectReason.trim() || 'Non conforme'}. Soumis par : ${rejectHousing.submitted_by_associate_name || 'Associé'}`,
      severity: 'warning'
    })

    toastSuccess('Soumission rejetée', 'L\'associé pourra consulter le motif et corriger l\'annonce.')
    setRejectHousing(null)
    setRejectReason('')
    setPreviewHousing(null)
    forceUpdate(n => n + 1)
  }

  const currentList = activeSubTab === 'pending'
    ? pendingSubmissions
    : activeSubTab === 'approved'
      ? approvedSubmissions
      : rejectedSubmissions

  return (
    <div className="space-y-6">
      
      {/* Header & KPI badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Soumissions de Logements par les Associés
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Validez et publiez les annonces de studios, chambres et résidences recensées par vos collaborateurs sur le terrain.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('pending')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              activeSubTab === 'pending'
                ? "bg-amber-500 text-black shadow-md font-black"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            🟡 En Attente ({pendingSubmissions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('approved')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              activeSubTab === 'approved'
                ? "bg-emerald-600 text-white shadow-md font-black"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            🟢 Validés ({approvedSubmissions.length})
          </button>
          <button
            onClick={() => setActiveSubTab('rejected')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              activeSubTab === 'rejected'
                ? "bg-red-600 text-white shadow-md font-black"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            🔴 Rejetés ({rejectedSubmissions.length})
          </button>
        </div>
      </div>

      {/* Main List */}
      {currentList.length === 0 ? (
        <div className="card-glass p-12 text-center space-y-3 rounded-3xl border-border">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">
            {activeSubTab === 'pending' 
              ? 'Aucune soumission en attente pour le moment' 
              : activeSubTab === 'approved'
                ? 'Aucun logement associé validé'
                : 'Aucune soumission rejetée'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {activeSubTab === 'pending'
              ? 'Dès qu\'un associé enregistre une nouvelle chambre ou un studio, son annonce apparaîtra ici pour vérification administrative.'
              : 'Les annonces traitées s\'archivent automatiquement ici.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {currentList.map(housing => (
            <div
              key={housing.id}
              className="card-glass rounded-3xl overflow-hidden border border-border flex flex-col justify-between hover:border-primary/50 transition-all shadow-md group"
            >
              <div>
                {/* Photo Header */}
                <div className="relative aspect-[16/10] overflow-hidden bg-card border-b border-border">
                  <img
                    src={housing.image_url}
                    alt={housing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg bg-black/80 text-white text-[10px] font-bold capitalize backdrop-blur-xs">
                      {housing.category}
                    </span>
                    {housing.furnished && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold">
                        Meublé 🛋️
                      </span>
                    )}
                  </div>

                  <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-lg bg-primary text-black text-xs font-black shadow-md">
                    {formatPrice(housing.price)} <span className="text-[10px] font-normal">/{housing.price_type === 'day' ? 'j' : 'm'}</span>
                  </span>
                </div>

                {/* Info Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {housing.title}
                    </h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      {housing.city} • {housing.neighborhood} {housing.address ? `(${housing.address})` : ''}
                    </p>
                  </div>

                  {/* Associate Info Pill */}
                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border/80 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <User className="w-3.5 h-3.5 text-primary" /> Recensé par :
                      </span>
                      <span className="font-bold text-primary">
                        {housing.submitted_by_associate_name || 'Agent Associé'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                      <span>Bailleur : <strong>{housing.owner_name}</strong></span>
                      <span>WA : <strong>{housing.whatsapp_number}</strong></span>
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>📐 {housing.surface_sqm} m²</span>
                    <span>• 🛏️ {housing.bedrooms} ch.</span>
                    <span>• 🚿 {housing.bathrooms} sdb</span>
                  </div>

                  {/* Rejection notice if rejected */}
                  {housing.status === 'rejected' && housing.rejection_reason && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[11px] text-red-400">
                      <p className="font-bold">Motif du refus :</p>
                      <p className="text-xs mt-0.5">{housing.rejection_reason}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 space-y-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewHousing(housing)}
                    className="flex-1 text-xs gap-1 py-2 justify-center"
                  >
                    <Eye className="w-3.5 h-3.5" /> Examiner fiche
                  </Button>

                  {housing.status === 'pending_review' && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(housing)}
                      className="flex-1 text-xs gap-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold justify-center"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valider & Publier
                    </Button>
                  )}
                </div>

                {housing.status === 'pending_review' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setRejectHousing(housing); setRejectReason(''); }}
                    className="w-full text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 py-1.5"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" /> Rejeter la soumission
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MODAL EXAMEN COMPLET ================= */}
      {previewHousing && (
        <Modal
          open={!!previewHousing}
          onClose={() => setPreviewHousing(null)}
          title={`Examen : ${previewHousing.title}`}
          size="lg"
        >
          <div className="space-y-5 text-xs">
            {/* Photos carousel / grid */}
            <div className="grid grid-cols-2 gap-2">
              {(previewHousing.images && previewHousing.images.length > 0 ? previewHousing.images : [previewHousing.image_url]).map((img, idx) => (
                <div key={idx} className="aspect-[16/10] rounded-xl overflow-hidden bg-card border border-border">
                  <img src={img} alt="Aperçu" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* Main Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-muted/50 border border-border">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Loyer</p>
                <p className="font-extrabold text-sm text-primary">{formatPrice(previewHousing.price)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Caution</p>
                <p className="font-bold text-foreground">{formatPrice(previewHousing.deposit_amount || 0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Ville / Quartier</p>
                <p className="font-bold text-foreground">{previewHousing.city} - {previewHousing.neighborhood}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Agent Associé</p>
                <p className="font-bold text-emerald-400">{previewHousing.submitted_by_associate_name || 'Associé'}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <p className="font-bold text-foreground text-xs">Description complète :</p>
              <p className="text-muted-foreground leading-relaxed p-3 rounded-xl bg-card border border-border">
                {previewHousing.description}
              </p>
            </div>

            {/* Bailleur & Contacts */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <p className="font-bold text-emerald-400">Coordonnées du Bailleur (Recensées par l'agent) :</p>
              <p className="text-foreground">Nom : <strong>{previewHousing.owner_name}</strong></p>
              <p className="text-foreground">WhatsApp : <strong>{previewHousing.whatsapp_number}</strong></p>
              {previewHousing.owner_phone && <p className="text-foreground">Téléphone : <strong>{previewHousing.owner_phone}</strong></p>}
            </div>

            {/* Action Bar inside modal */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-border">
              <Button variant="ghost" onClick={() => setPreviewHousing(null)}>
                Fermer
              </Button>
              <Button
                onClick={() => { setRejectHousing(previewHousing); setRejectReason(''); }}
                variant="outline"
                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                <XCircle className="w-4 h-4" /> Rejeter
              </Button>
              <Button
                onClick={() => handleApprove(previewHousing)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                <CheckCircle2 className="w-4 h-4" /> Approuver & Publier immédiatement
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ================= MODAL REJET ================= */}
      {rejectHousing && (
        <Modal
          open={!!rejectHousing}
          onClose={() => setRejectHousing(null)}
          title="Refuser la soumission de logement"
        >
          <form onSubmit={handleRejectConfirm} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <p className="font-bold">Vous êtes sur le point de rejeter cette annonce :</p>
              <p className="text-muted-foreground mt-0.5 font-medium">{rejectHousing.title} (Soumis par {rejectHousing.submitted_by_associate_name})</p>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Motif du rejet (explication pour l'associé) :</label>
              <textarea
                rows={3}
                required
                placeholder="Ex: Photos de mauvaise qualité, prix ou coordonnées du bailleur à vérifier..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:border-red-500 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setRejectHousing(null)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-500 text-white font-bold">
                Confirmer le refus
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  )
}
