import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LogIn, Mail, Lock, Eye, EyeOff, Shield, Sparkles,
  ShoppingBag, Building2, CheckCircle2, ArrowRight, ShieldCheck, Zap
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)

  const from = (location.state as any)?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      toastError('Champs obligatoires', 'Veuillez renseigner votre email et mot de passe.')
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
      toastSuccess('Ravi de vous revoir !', 'Connexion réussie à votre compte OroMall.')
      navigate(from, { replace: true })
    } catch {
      toastError('Échec de la connexion', 'Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Lumières décoratives d'arrière-plan */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-5xl rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* ================= GAUCHE : BANDEAU IMMERSIF (Desktop) ================= */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/90 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-amber-500/20">
          
          {/* Motifs géométriques décoratifs */}
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* En-tête marque */}
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-primary text-black font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-300/40">
                OM
              </div>
              <div>
                <span className="font-display font-black text-xl tracking-tight text-white flex items-center gap-1.5">
                  OroMall
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-400/30">
                    GOLD
                  </span>
                </span>
                <p className="text-[11px] text-slate-400">Marketplace & Logements Cameroun</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white leading-tight">
                Le Carrefour Digital du Commerce & de l'Immobilier
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Connectez-vous pour retrouver vos commandes, vos favoris, vos logements réservés ou piloter votre boutique professionnelle.
              </p>
            </div>
          </div>

          {/* Badges d'avantages */}
          <div className="space-y-3 my-8 relative z-10">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">Marketplace & Fournitures</p>
                <p className="text-slate-400 text-[11px]">Commandes livrées ou à emporter</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">Logements Étudiants & Cités</p>
                <p className="text-slate-400 text-[11px]">Visites programmées et contacts directs</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">Paiements Sécurisés MoMo & OM</p>
                <p className="text-slate-400 text-[11px]">Transactions protégées au Cameroun</p>
              </div>
            </div>
          </div>

          {/* Pied de page gauche */}
          <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between relative z-10">
            <span>© 2026 OroMall Cameroun</span>
            <span className="flex items-center gap-1 text-amber-400">
              <Zap className="w-3.5 h-3.5" /> 100% Mobile Ready
            </span>
          </div>

        </div>

        {/* ================= DROITE : FORMULAIRE DE CONNEXION ================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center space-y-6">
          
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight">
              Bon retour parmi nous 👋
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Entrez vos identifiants pour accéder à votre espace personnalisé.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email avec icône */}
            <div>
              <Input
                label="Adresse Email"
                type="email"
                placeholder="votre@email.cm"
                required
                leftIcon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="py-3 text-sm rounded-xl"
              />
            </div>

            {/* Mot de passe avec toggle affichage */}
            <div>
              <div className="form-group">
                <label className="form-label flex items-center justify-between">
                  <span>Mot de passe</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="input-field pl-10 pr-11 py-3 text-sm rounded-xl w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg focus:outline-none"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Options de session */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <span>Se souvenir de moi</span>
              </label>

              <button
                type="button"
                onClick={() => toastSuccess('Réinitialisation', 'Un lien de récupération a été envoyé à votre adresse e-mail.')}
                className="text-primary hover:underline font-semibold"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {/* Bouton de connexion vibrant */}
            <div className="pt-2">
              <Button
                type="submit"
                loading={loading}
                className="w-full justify-center py-3.5 text-sm font-bold shadow-xl shadow-primary/25 bg-gradient-to-r from-amber-500 via-primary to-amber-600 hover:opacity-95 text-black rounded-xl transition-all"
              >
                <LogIn className="w-4 h-4" /> Se connecter à mon compte
              </Button>
            </div>

          </form>

          {/* Séparateur et lien inscription */}
          <div className="pt-4 border-t border-border/70 space-y-4">
            <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-foreground">Nouveau sur OroMall ?</p>
                <p className="text-[11px] text-muted-foreground">Créez votre compte en moins d'une minute.</p>
              </div>
              <Link
                to="/register"
                className="shrink-0 px-4 py-2 rounded-xl bg-primary text-black font-bold text-xs shadow-sm hover:bg-primary/90 flex items-center gap-1 transition-all"
              >
                S'inscrire <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Lien Administrateur */}
            <div className="text-center pt-1">
              <Link
                to="/admin/login"
                className="text-muted-foreground hover:text-foreground text-xs inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-muted transition-colors font-medium"
              >
                <Shield className="w-3.5 h-3.5 text-amber-500" /> Console d'administration
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
