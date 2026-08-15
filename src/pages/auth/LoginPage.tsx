import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn, User, Shield, Store, Sparkles } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const from = (location.state as any)?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await login(email, password)
    setLoading(false)
    toastSuccess('Connexion réussie !')
    navigate(from, { replace: true })
  }

  const quickLogin = async (demoEmail: string) => {
    setLoading(true)
    await login(demoEmail, 'demo123')
    setLoading(false)
    toastSuccess('Connexion Demo réussie !', demoEmail)
    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-glass p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white font-black text-xl mx-auto shadow-md">
            M+
          </div>
          <h1 className="text-2xl font-display font-extrabold text-foreground">Connexion à MarchéPlus</h1>
          <p className="text-xs text-muted-foreground">Accédez à vos achats, vos favoris ou votre dashboard vendeur.</p>
        </div>

        {/* Demo Quick Logins */}
        <div className="space-y-2 bg-muted/40 p-4 rounded-2xl border border-border">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Comptes Démo (Accès direct en 1-clic):
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => quickLogin('client@demo.cm')}
              className="px-2 py-1.5 rounded-lg bg-card border border-border text-[11px] font-semibold text-foreground hover:bg-primary hover:text-white transition-colors"
            >
              Client
            </button>
            <button
              onClick={() => quickLogin('vendeur@demo.cm')}
              className="px-2 py-1.5 rounded-lg bg-card border border-border text-[11px] font-semibold text-foreground hover:bg-primary hover:text-white transition-colors"
            >
              Vendeur
            </button>
            <button
              onClick={() => quickLogin('admin@demo.cm')}
              className="px-2 py-1.5 rounded-lg bg-card border border-border text-[11px] font-semibold text-foreground hover:bg-primary hover:text-white transition-colors"
            >
              Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="votre@email.cm"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <Input
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
          />

          <Button type="submit" loading={loading} className="w-full justify-center py-3">
            <LogIn className="w-4 h-4" /> Se connecter
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-2">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary font-bold hover:underline">
            S'inscrire gratuitement
          </Link>
        </div>
      </div>
    </div>
  )
}
