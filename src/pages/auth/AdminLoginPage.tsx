import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft, KeyRound, CheckCircle2, UserCheck, Users, Mail, Lock, Sparkles, Building2, Home } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

export default function AdminLoginPage() {
  const { user, loginAsAdmin, loginAsAssociate, isAdmin, isAssociate } = useAuth()
  const navigate = useNavigate()

  const [accessMode, setAccessMode] = useState<'admin' | 'associate'>('admin')
  
  // Admin PIN
  const [pin, setPin] = useState('')
  
  // Associate Credentials
  const [associateEmail, setAssociateEmail] = useState('')
  const [associatePassword, setAssociatePassword] = useState('')

  const [loading, setLoading] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user && isAdmin()) {
      navigate('/admin', { replace: true })
    } else if (user && user.role === 'associate') {
      navigate('/associate', { replace: true })
    }
  }, [user, isAdmin, navigate])

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin.trim()) {
      toastError('Veuillez saisir votre code PIN administrateur.')
      return
    }

    setLoading(true)
    try {
      await loginAsAdmin(pin.trim())
      toastSuccess('Connexion administrateur réussie ! 🛡️')
      navigate('/admin', { replace: true })
    } catch (err: any) {
      toastError('Code PIN incorrect', err.message || 'Le code PIN administrateur saisi est invalide.')
    } finally {
      setLoading(false)
    }
  }

  const handleAssociateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!associateEmail.trim() || !associatePassword) {
      toastError('Veuillez renseigner votre email et mot de passe associé.')
      return
    }

    setLoading(true)
    try {
      await loginAsAssociate(associateEmail.trim(), associatePassword)
      toastSuccess('Bienvenue dans votre Espace Associé ! 🤝')
      navigate('/associate', { replace: true })
    } catch (err: any) {
      toastError('Connexion échouée', err.message || 'Identifiants associé invalides ou compte suspendu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-glass p-8 space-y-6 shadow-2xl border border-primary/40 rounded-3xl bg-card">
        
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl mx-auto shadow-md transition-colors",
            accessMode === 'admin' ? "bg-amber-500/10 border border-amber-500/30 text-amber-500" : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-500"
          )}>
            {accessMode === 'admin' ? <Shield className="w-7 h-7" /> : <Users className="w-7 h-7" />}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            {accessMode === 'admin' ? 'Console Administrateur' : 'Espace Associé / Agent'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {accessMode === 'admin' 
              ? 'Accédez au pilotage global de la plateforme OroMall.' 
              : 'Espace réservé aux associés habilités pour enregistrer des logements.'}
          </p>
        </div>

        {/* 2 Choix : Administrateur vs Associé */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/70 rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setAccessMode('admin')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              accessMode === 'admin'
                ? "bg-amber-500 text-black shadow-md font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Shield className="w-4 h-4" /> Administrateur
          </button>
          <button
            type="button"
            onClick={() => setAccessMode('associate')}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              accessMode === 'associate'
                ? "bg-emerald-600 text-white shadow-md font-black"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="w-4 h-4" /> Compte Associé
          </button>
        </div>

        {/* Formulaire Administrateur */}
        {accessMode === 'admin' ? (
          <form onSubmit={handleAdminSubmit} className="space-y-4 animate-in fade-in duration-200">
            <Input
              label="Code PIN Administrateur"
              type="password"
              placeholder="Entrez votre code PIN"
              required
              value={pin}
              onChange={e => setPin(e.target.value)}
              autoFocus
            />

            <Button
              type="submit"
              loading={loading}
              className="w-full justify-center py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-lg shadow-amber-500/20 text-xs rounded-xl"
            >
              <Shield className="w-4 h-4 mr-1.5" /> Se connecter en Administrateur
            </Button>
          </form>
        ) : (
          /* Formulaire Associé */
          <form onSubmit={handleAssociateSubmit} className="space-y-4 animate-in fade-in duration-200">
            <Input
              label="Adresse Email Associé"
              type="email"
              placeholder="votre.nom@oromall.cm"
              required
              value={associateEmail}
              onChange={e => setAssociateEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4 text-muted-foreground" />}
              autoFocus
            />

            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              required
              value={associatePassword}
              onChange={e => setAssociatePassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-muted-foreground" />}
            />

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 space-y-1">
              <p className="font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Rôle d'agent recenseur :</p>
              <p className="text-muted-foreground">Vous pouvez publier des logements vérifiés. Chaque annonce sera soumise à validation administrative avant d'être mise en ligne.</p>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full justify-center py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-600/20 text-xs rounded-xl"
            >
              <Home className="w-4 h-4 mr-1.5" /> Ouvrir mon Espace Associé
            </Button>
          </form>
        )}

        {/* Footer Link */}
        <div className="pt-3 flex justify-center border-t border-border/60 text-xs">
          <Link
            to="/login"
            className="text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Retour à la connexion standard
          </Link>
        </div>
      </div>
    </div>
  )
}
