import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn, User, Shield, Store } from 'lucide-react'
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
  const [loading, setLoading] = useState(false)

  const from = (location.state as any)?.from?.pathname || '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await login(email, password)
      toastSuccess('Connexion réussie !')
      navigate(from, { replace: true })
    } catch {
      toastError('Échec de la connexion', 'Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-glass p-8 space-y-6 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary text-black font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25 border border-amber-400/40">
            OM
          </div>
          <h1 className="text-2xl font-display font-extrabold text-foreground">Connexion à OroMall</h1>
          <p className="text-muted-foreground text-sm mt-1">Accédez à votre compte client ou vendeur</p>
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

        <div className="text-center text-xs pt-2 border-t border-border/60">
          <Link to="/admin/login" className="text-primary hover:underline font-bold inline-flex items-center justify-center gap-1.5 py-1 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
            <Shield className="w-3.5 h-3.5" /> Accès Administrateur
          </Link>
        </div>
      </div>
    </div>
  )
}
