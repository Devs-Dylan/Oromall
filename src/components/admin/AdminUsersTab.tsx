import { useState, useMemo } from 'react'
import {
  Users, Shield, Zap, Lock, Unlock, Search, UserCheck, Mail, Calendar,
  Trash2, Store, Building2, CheckCircle2, XCircle, Clock, MessageSquare, Phone, MapPin, Sparkles
} from 'lucide-react'
import type { User, UserRole, SellerActivation, Shop } from '@/types'
import { UserAPI, AuditLogAPI, ActivationAPI, ShopAPI } from '@/lib/store'
import { formatDate, formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface AdminUsersTabProps {
  users: User[]
  adminName?: string
  onRefresh: () => void
}

export function AdminUsersTab({ users, adminName = 'SuperAdmin', onRefresh }: AdminUsersTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'activations'>('users')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'seller' | 'client' | 'banned'>('all')
  const [activationFilter, setActivationFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all')

  const activations = useMemo(() => ActivationAPI.list() || [], [users])
  const pendingActivationsCount = useMemo(() => activations.filter(a => a.status === 'pending').length, [activations])

  // Actions Utilisateurs
  const handlePromoteAdmin = (userItem: User) => {
    const nextRole: UserRole = userItem.role === 'admin' ? 'user' : 'admin'
    UserAPI.update(userItem.id, { role: nextRole })

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: `${nextRole === 'admin' ? 'Promotion Administrateur ⚡' : 'Rétrogradation Utilisateur'}`,
      details: `Utilisateur : ${userItem.name} (${userItem.email})`,
      severity: nextRole === 'admin' ? 'warning' : 'info'
    })

    toastSuccess(`Rôle de ${userItem.name} mis à jour : ${nextRole === 'admin' ? 'Administrateur ⚡' : 'Utilisateur'}`)
    onRefresh()
  }

  const handleToggleBan = (userItem: User) => {
    const nextBanned = !userItem.is_banned
    UserAPI.update(userItem.id, { is_banned: nextBanned })

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: `${nextBanned ? 'Bannissement Utilisateur 🚫' : 'Débannissement Utilisateur 🟢'}`,
      details: `Utilisateur : ${userItem.name} (${userItem.email})`,
      severity: nextBanned ? 'danger' : 'info'
    })

    toastSuccess(`Compte utilisateur ${userItem.name} ${nextBanned ? 'Banni 🚫' : 'Débanni 🟢'}`)
    onRefresh()
  }

  const handleDelete = (userItem: User) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${userItem.name} (${userItem.email}) ? Cette action est irréversible.`)) return
    UserAPI.delete(userItem.id)

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Suppression Utilisateur 🗑️',
      details: `Utilisateur : ${userItem.name} (${userItem.email})`,
      severity: 'danger'
    })

    toastSuccess(`Compte de ${userItem.name} supprimé`)
    onRefresh()
  }

  // Actions Demandes d'adhésion Vendeurs / Bailleurs
  const handleApproveActivation = (act: SellerActivation) => {
    // 1. Validation de l'activation
    ActivationAPI.update(act.id, { status: 'verified' })

    // 2. Activation de la boutique associée
    if (act.shop_id) {
      ShopAPI.update(act.shop_id, { status: 'active', is_verified: true })
    }

    // 3. Mise à jour du type de compte de l'utilisateur
    const targetUser = users.find(u => u.email === act.user_email || (act.user_id && u.id === act.user_id))
    if (targetUser) {
      UserAPI.update(targetUser.id, { account_type: 'seller' })
    }

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Validation Adhésion Vendeur / Bailleur ✅',
      details: `Dossier validé pour "${act.shop_name}" (${act.user_email})`,
      severity: 'info'
    })

    toastSuccess(`Dossier "${act.shop_name}" approuvé ! Statut Vendeur / Bailleur activé.`)
    onRefresh()
  }

  const handleRejectActivation = (act: SellerActivation) => {
    if (!confirm(`Confirmez-vous le rejet du dossier pour "${act.shop_name}" (${act.user_email}) ?`)) return

    ActivationAPI.update(act.id, { status: 'rejected' })

    if (act.shop_id) {
      ShopAPI.update(act.shop_id, { status: 'suspended' })
    }

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Rejet Adhésion Vendeur / Bailleur ❌',
      details: `Dossier rejeté pour "${act.shop_name}" (${act.user_email})`,
      severity: 'warning'
    })

    toastSuccess(`Dossier "${act.shop_name}" rejeté.`)
    onRefresh()
  }

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false

      if (roleFilter === 'admin') return u.role === 'admin'
      if (roleFilter === 'seller') return u.account_type === 'seller'
      if (roleFilter === 'client') return u.account_type === 'client' || (!u.account_type && u.role !== 'admin')
      if (roleFilter === 'banned') return u.is_banned
      return true
    })
  }, [users, search, roleFilter])

  const filteredActivations = useMemo(() => {
    return activations.filter(a => {
      const matchesSearch = (a.shop_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.user_email || '').toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false

      if (activationFilter !== 'all' && a.status !== activationFilter) return false
      return true
    })
  }, [activations, search, activationFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Utilisateurs & Adhésions Vendeurs / Bailleurs
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gérez les comptes clients, administrateurs et validez manuellement les dossiers de candidatures Vendeurs et Bailleurs.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-card p-1.5 rounded-2xl border border-border">
          <button
            onClick={() => setActiveSubTab('users')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
              activeSubTab === 'users' ? 'bg-primary text-black shadow-md' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Users className="w-4 h-4" /> Annuaire Utilisateurs ({users.length})
          </button>

          <button
            onClick={() => setActiveSubTab('activations')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 relative',
              activeSubTab === 'activations' ? 'bg-primary text-black shadow-md' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Store className="w-4 h-4" /> Demandes d'adhésion
            {pendingActivationsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
                {pendingActivationsCount} en attente
              </span>
            )}
          </button>
        </div>
      </div>

      {/* SOUS-ONGLET 1 : ANNUAIRE UTILISATEURS */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="card-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher nom, email..."
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {[
                { id: 'all', label: `Tous (${users.length})` },
                { id: 'admin', label: `Admins ⚡ (${users.filter(u => u.role === 'admin').length})` },
                { id: 'seller', label: `Vendeurs / Bailleurs (${users.filter(u => u.account_type === 'seller').length})` },
                { id: 'client', label: `Clients / Étudiants (${users.filter(u => u.account_type === 'client' || (!u.account_type && u.role !== 'admin')).length})` },
                { id: 'banned', label: `Bannis 🚫 (${users.filter(u => u.is_banned).length})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setRoleFilter(f.id as any)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                    roleFilter === f.id ? 'bg-primary text-black shadow-sm font-bold' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full card-glass p-12 text-center space-y-3">
                <Users className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">Aucun utilisateur trouvé.</p>
              </div>
            ) : (
              filteredUsers.map(userItem => (
                <div key={userItem.id} className="card-glass p-5 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                          {userItem.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-foreground flex items-center gap-1">
                            {userItem.name}
                            {userItem.role === 'admin' && <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                          </h3>
                          <p className="text-xs text-muted-foreground">{userItem.email}</p>
                        </div>
                      </div>

                      <span className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase',
                        userItem.is_banned ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        userItem.role === 'admin' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        userItem.account_type === 'seller' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      )}>
                        {userItem.is_banned ? 'Banni 🚫' : userItem.role === 'admin' ? 'SuperAdmin ⚡' : userItem.account_type === 'seller' ? 'Vendeur / Bailleur' : 'Client / Étudiant'}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1">
                      <p>Inscrit le : {formatDate(userItem.created_date)}</p>
                      <p>Téléphone : {userItem.phone || userItem.mtn_number || userItem.orange_number || 'Non renseigné'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-border/40">
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        onClick={() => handlePromoteAdmin(userItem)}
                        variant="outline"
                        size="sm"
                        className={cn(
                          'text-xs flex-1 gap-1',
                          userItem.role === 'admin' ? 'border-slate-500/30 text-slate-400' : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                        )}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        {userItem.role === 'admin' ? 'Rétrograder' : 'Admin ⚡'}
                      </Button>

                      <Button
                        onClick={() => handleToggleBan(userItem)}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'text-xs gap-1',
                          userItem.is_banned ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-red-400 hover:bg-red-500/10'
                        )}
                      >
                        {userItem.is_banned ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        {userItem.is_banned ? 'Débannir' : 'Bannir'}
                      </Button>
                    </div>

                    <Button
                      onClick={() => handleDelete(userItem)}
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs gap-1 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Supprimer le compte
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SOUS-ONGLET 2 : DEMANDES D'ADHÉSION VENDEURS / BAILLEURS */}
      {activeSubTab === 'activations' && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="card-glass p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher boutique, demandeur, email..."
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {[
                { id: 'all', label: `Toutes (${activations.length})` },
                { id: 'pending', label: `En attente ⏳ (${activations.filter(a => a.status === 'pending').length})` },
                { id: 'verified', label: `Approuvées ✅ (${activations.filter(a => a.status === 'verified').length})` },
                { id: 'rejected', label: `Rejetées ❌ (${activations.filter(a => a.status === 'rejected').length})` },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setActivationFilter(f.id as any)}
                  className={cn(
                    'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                    activationFilter === f.id ? 'bg-amber-500 text-black shadow-sm font-bold' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activations List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActivations.length === 0 ? (
              <div className="col-span-full card-glass p-12 text-center space-y-3">
                <Store className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm font-semibold text-foreground">Aucune demande d'adhésion trouvée.</p>
              </div>
            ) : (
              filteredActivations.map(act => (
                <div key={act.id} className="card-glass p-6 space-y-4 hover:border-amber-500/40 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-foreground">{act.shop_name}</h3>
                          <span className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase',
                            act.status === 'pending' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse' :
                            act.status === 'verified' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                            'bg-red-500/15 text-red-400 border-red-500/30'
                          )}>
                            {act.status === 'pending' ? 'En attente ⏳' : act.status === 'verified' ? 'Approuvée ✅' : 'Rejetée ❌'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-primary" /> {act.user_name} ({act.user_email})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-card text-muted-foreground border border-border">
                          {act.activity_type === 'bailleur' ? '🏠 Bailleur' : act.activity_type === 'both' ? '🌟 Mixte' : '🛍️ Vendeur'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-card/60 p-3 rounded-xl border border-border/60">
                      <div>
                        <span className="font-medium block text-[10px] text-muted-foreground">Ville :</span>
                        <span className="font-bold text-foreground">{act.city || 'Non renseigné'}</span>
                      </div>
                      <div>
                        <span className="font-medium block text-[10px] text-muted-foreground">Catégorie :</span>
                        <span className="font-bold text-foreground">{act.category || 'Général'}</span>
                      </div>
                      <div>
                        <span className="font-medium block text-[10px] text-muted-foreground">WhatsApp :</span>
                        <span className="font-bold text-emerald-400">{act.whatsapp_number || 'Non renseigné'}</span>
                      </div>
                      <div>
                        <span className="font-medium block text-[10px] text-muted-foreground">Date de soumission :</span>
                        <span className="font-bold text-foreground">{formatDate(act.created_date)}</span>
                      </div>
                    </div>

                    {act.description && (
                      <p className="text-xs text-muted-foreground italic line-clamp-2 bg-muted/30 p-2.5 rounded-lg border border-border/40">
                        "{act.description}"
                      </p>
                    )}
                  </div>

                  {/* Boutons d'actions administratives */}
                  <div className="pt-3 border-t border-border/40 flex flex-wrap items-center gap-2">
                    {act.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleApproveActivation(act)}
                          size="sm"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approuver le dossier
                        </Button>

                        <Button
                          onClick={() => handleRejectActivation(act)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/10 text-xs gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Rejeter
                        </Button>
                      </>
                    )}

                    {act.status === 'verified' && (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Espace Vendeur / Bailleur débloqué
                      </span>
                    )}

                    {act.status === 'rejected' && (
                      <Button
                        onClick={() => handleApproveActivation(act)}
                        variant="outline"
                        size="sm"
                        className="text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10 gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Réévaluer & Approuver
                      </Button>
                    )}

                    {act.whatsapp_number && (
                      <a
                        href={`https://wa.me/237${act.whatsapp_number.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${act.user_name}, l'équipe d'administration OroMall vous contacte concernant votre dossier d'adhésion pour "${act.shop_name}".`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors ml-auto"
                        title="Contacter sur WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  )
}
