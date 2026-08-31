import { useState, useMemo } from 'react'
import {
  Users, UserPlus, Shield, CheckCircle2, XCircle, KeyRound,
  Phone, Mail, MapPin, Building2, Trash2, Ban, RefreshCw, Lock
} from 'lucide-react'
import { UserAPI, HousingAPI, AuditLogAPI } from '@/lib/store'
import type { User, Housing } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { generateId, cn } from '@/lib/utils'

export function AdminAssociatesTab() {
  const [, forceUpdate] = useState(0)
  const users = UserAPI.list()
  const housings = HousingAPI.list()

  // Filter associate users
  const associates = useMemo(() => {
    return users.filter(u => u.role === 'associate')
  }, [users])

  // Associate creation modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [momoNumber, setMomoNumber] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Associate password reset modal
  const [resetModalAssociate, setResetModalAssociate] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // Handle create new Associate
  const handleCreateAssociate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !momoNumber.trim() || !whatsappNumber.trim() || !email.trim() || !password) {
      toastError('Veuillez remplir tous les champs obligatoires (Nom, N° MTN/OM, N° WhatsApp, Email, Mot de passe).')
      return
    }

    if (password.length < 6) {
      toastError('Le mot de passe doit comporter au moins 6 caractères.')
      return
    }

    const emailClean = email.trim().toLowerCase()
    if (users.some(u => u.email.toLowerCase() === emailClean)) {
      toastError('Un compte avec cette adresse email existe déjà.')
      return
    }

    setLoading(true)
    const newAssoc: User = {
      id: `associe-${generateId().slice(0, 8)}`,
      name: name.trim(),
      email: emailClean,
      password: password,
      phone: whatsappNumber.trim() || momoNumber.trim(),
      whatsapp_number: whatsappNumber.trim(),
      momo_number: momoNumber.trim(),
      mtn_number: momoNumber.trim(),
      role: 'associate',
      account_type: 'client',
      created_date: new Date().toISOString(),
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
    }

    UserAPI.create(newAssoc)

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: 'Administrateur',
      action: `Création compte Associé : ${newAssoc.name}`,
      details: `Email : ${newAssoc.email} | WhatsApp : ${newAssoc.whatsapp_number} | MTN/OM : ${newAssoc.momo_number}`,
      severity: 'info'
    })

    toastSuccess('Compte Associé créé avec succès ! 🤝', `L'associé peut désormais se connecter avec son email et mot de passe.`)
    setCreateModalOpen(false)
    setName('')
    setMomoNumber('')
    setWhatsappNumber('')
    setEmail('')
    setPassword('')
    setLoading(false)
    forceUpdate(n => n + 1)
  }

  // Toggle Ban / Suspend
  const handleToggleStatus = (assoc: User) => {
    const isSuspended = !assoc.is_banned
    UserAPI.update(assoc.id, { is_banned: isSuspended })

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: 'Administrateur',
      action: `${isSuspended ? 'Suspension' : 'Réactivation'} Associé : ${assoc.name}`,
      details: `Compte ${assoc.email} ${isSuspended ? 'suspendu' : 'réactivé'}`,
      severity: isSuspended ? 'warning' : 'info'
    })

    toastSuccess(`Compte ${isSuspended ? 'suspendu' : 'réactivé'}`)
    forceUpdate(n => n + 1)
  }

  // Reset Password
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetModalAssociate || !newPassword) return

    UserAPI.update(resetModalAssociate.id, { password: newPassword })
    toastSuccess('Mot de passe mis à jour avec succès !')
    setResetModalAssociate(null)
    setNewPassword('')
    forceUpdate(n => n + 1)
  }

  // Delete Associate
  const handleDelete = (assoc: User) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le compte associé de "${assoc.name}" ?`)) return

    UserAPI.delete(assoc.id)
    toastSuccess('Compte Associé supprimé')
    forceUpdate(n => n + 1)
  }

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Gestion des Comptes Associés & Agents Terrain
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Créez et gérez les comptes des collaborateurs autorisés à enregistrer des logements et studios pour la plateforme.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-primary hover:bg-primary/90 text-black font-extrabold text-xs shadow-md rounded-xl flex items-center gap-1.5 shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Créer un compte Associé
        </Button>
      </div>

      {/* Associates Table */}
      {associates.length === 0 ? (
        <div className="card-glass p-12 text-center space-y-3 rounded-3xl border-border">
          <Users className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">Aucun compte associé créé</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Créez votre premier compte associé pour permettre à des collaborateurs de recenser des logements.
          </p>
          <Button onClick={() => setCreateModalOpen(true)} className="btn-primary text-xs">
            <UserPlus className="w-4 h-4" /> Créer le premier Associé
          </Button>
        </div>
      ) : (
        <div className="card-glass rounded-3xl border border-border overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/80 text-muted-foreground uppercase text-[10px] font-black border-b border-border">
                <tr>
                  <th className="p-4">Associé / Agent</th>
                  <th className="p-4">Identifiants & Contact</th>
                  <th className="p-4 text-center">Logements Recensés</th>
                  <th className="p-4 text-center">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {associates.map(assoc => {
                  const assocHousings = housings.filter(h => h.submitted_by_associate_id === assoc.id)
                  const pendingCount = assocHousings.filter(h => h.status === 'pending_review').length
                  const approvedCount = assocHousings.filter(h => h.status === 'active' || h.status === 'available').length

                  return (
                    <tr key={assoc.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-primary/20 border border-emerald-500/30 text-emerald-400 font-bold flex items-center justify-center text-sm shadow-sm">
                            {assoc.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm">{assoc.name}</p>
                            <p className="text-[10px] text-muted-foreground">ID: {assoc.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 space-y-1">
                        <p className="text-foreground flex items-center gap-1.5 font-semibold">
                          <Mail className="w-3.5 h-3.5 text-primary shrink-0" /> {assoc.email}
                        </p>
                        <div className="flex flex-col gap-0.5 text-[11px]">
                          {(assoc.whatsapp_number || assoc.phone) && (
                            <p className="text-emerald-500 flex items-center gap-1.5 font-medium">
                              <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> WhatsApp : {assoc.whatsapp_number || assoc.phone}
                            </p>
                          )}
                          {(assoc.momo_number || assoc.mtn_number || assoc.orange_number) && (
                            <p className="text-amber-500 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                              <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" /> MTN/OM : {assoc.momo_number || assoc.mtn_number || assoc.orange_number}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-2 p-1.5 rounded-xl bg-muted/60 border border-border text-[11px]">
                          <span className="font-bold text-foreground">{assocHousings.length} total</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">{approvedCount} validés</span>
                          {pendingCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-bold">{pendingCount} en attente</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                          assoc.is_banned
                            ? "bg-red-500/10 text-red-400 border border-red-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        )}>
                          {assoc.is_banned ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {assoc.is_banned ? 'Suspendu' : 'Actif'}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setResetModalAssociate(assoc); setNewPassword(''); }}
                            className="text-[11px] h-7 px-2 border-border"
                            title="Modifier le mot de passe"
                          >
                            <KeyRound className="w-3 h-3" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(assoc)}
                            className={cn(
                              "text-[11px] h-7 px-2",
                              assoc.is_banned ? "text-emerald-400 border-emerald-500/30" : "text-amber-400 border-amber-500/30"
                            )}
                            title={assoc.is_banned ? 'Réactiver' : 'Suspendre'}
                          >
                            <Ban className="w-3 h-3" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(assoc)}
                            className="text-[11px] h-7 px-2 text-red-400 hover:bg-red-500/10"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL CRÉATION ASSOCIÉ ================= */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Enregistrer un nouveau compte Associé"
      >
        <form onSubmit={handleCreateAssociate} className="space-y-3.5 text-xs">
          {/* 1. Nom */}
          <Input
            label="Nom & Prénom de l'Associé *"
            type="text"
            placeholder="Ex: Alain - Agent Bastos / Ngoa-Ekellé"
            required
            value={name}
            onChange={e => setName(e.target.value)}
          />

          {/* 2. Numéro MTN / OM */}
          <Input
            label="Numéro MTN / OM (Mobile Money pour versement des commissions) *"
            type="tel"
            placeholder="Ex: 677 00 00 00 / 699 00 00 00"
            required
            value={momoNumber}
            onChange={e => setMomoNumber(e.target.value)}
          />

          {/* 3. Numéro WhatsApp */}
          <Input
            label="Numéro WhatsApp (pour coordination des visites et contact) *"
            type="tel"
            placeholder="Ex: 699 00 00 00"
            required
            value={whatsappNumber}
            onChange={e => setWhatsappNumber(e.target.value)}
          />

          {/* 4. Email */}
          <Input
            label="Adresse Email de connexion *"
            type="email"
            placeholder="alain.agent@oromall.cm"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          {/* 5. Mot de passe */}
          <Input
            label="Mot de passe provisoire (min. 6 caractères) *"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-muted-foreground space-y-1">
            <p className="font-bold text-foreground flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-primary" /> Droits accordés au compte Associé :
            </p>
            <p>Cet utilisateur pourra se connecter à l'Espace Associé pour ajouter des logements. Toutes ses publications nécessiteront votre approbation préalable dans l'onglet Soumissions.</p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={loading} className="bg-primary hover:bg-primary/90 text-black font-bold">
              <UserPlus className="w-4 h-4" /> Enregistrer l'Associé
            </Button>
          </div>
        </form>
      </Modal>

      {/* ================= MODAL RÉINITIALISATION MOT DE PASSE ================= */}
      {resetModalAssociate && (
        <Modal
          open={!!resetModalAssociate}
          onClose={() => setResetModalAssociate(null)}
          title={`Changer le mot de passe : ${resetModalAssociate.name}`}
        >
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <Input
              label="Nouveau mot de passe"
              type="password"
              placeholder="••••••••"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setResetModalAssociate(null)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-primary text-black font-bold">
                Mettre à jour
              </Button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  )
}
