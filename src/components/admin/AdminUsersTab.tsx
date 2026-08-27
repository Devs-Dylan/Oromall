import { useState, useMemo } from 'react'
import { Users, Shield, Zap, Lock, Unlock, Search, UserCheck, Mail, Calendar, Trash2 } from 'lucide-react'
import type { User, UserRole } from '@/types'
import { UserAPI, AuditLogAPI } from '@/lib/store'
import { formatDate, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

interface AdminUsersTabProps {
  users: User[]
  adminName?: string
  onRefresh: () => void
}

export function AdminUsersTab({ users, adminName = 'SuperAdmin', onRefresh }: AdminUsersTabProps) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user' | 'banned'>('all')

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

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false

      if (roleFilter === 'admin') return u.role === 'admin'
      if (roleFilter === 'user') return u.role === 'user' && !u.is_banned
      if (roleFilter === 'banned') return u.is_banned
      return true
    })
  }, [users, search, roleFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" /> Annuaire Utilisateurs & Rôles ({users.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Promouvez de nouveaux administrateurs ⚡, modifiez les droits d'accès et gérez la politique de bannissement.
          </p>
        </div>
      </div>

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
            { id: 'user', label: `Membres (${users.filter(u => u.role !== 'admin' && !u.is_banned).length})` },
            { id: 'banned', label: `Bannis 🚫 (${users.filter(u => u.is_banned).length})` },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setRoleFilter(f.id as any)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
                roleFilter === f.id ? 'bg-purple-600 text-white shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
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
            <div key={userItem.id} className="card-glass p-5 flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-bold text-purple-400 text-sm">
                      {userItem.name.charAt(0)}
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
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  )}>
                    {userItem.is_banned ? 'Banni 🚫' : userItem.role === 'admin' ? 'SuperAdmin ⚡' : 'Client / Vendeur'}
                  </span>
                </div>

                <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1">
                  <p>Inscrit le: {formatDate(userItem.created_date)}</p>
                  <p>Type de compte: {userItem.account_type || 'standard'}</p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-border/40">
                <div className="flex items-center justify-between gap-2">
                  {/* Action 1: Promote Admin */}
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
                    {userItem.role === 'admin' ? 'Rétrograder' : 'Promouvoir Admin ⚡'}
                  </Button>

                  {/* Action 2: Ban / Unban */}
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

                {/* Action 3: Delete */}
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
  )
}
