import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'

export default function AdminLoginPage() {
  const { user, loginAsAdmin, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && isAdmin()) {
      navigate('/admin', { replace: true })
    }
  }, [user, isAdmin, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
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

  const handleQuickDemoPin = () => {
    setPin('Tecnodylan14@')
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-glass p-8 space-y-6 shadow-xl border border-primary/40 rounded-3xl bg-card">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-black text-xl mx-auto shadow-sm">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Connexion Administrateur</h1>
          <p className="text-xs text-muted-foreground">Accédez à la console de gestion du site.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            className="w-full justify-center py-3 bg-primary hover:bg-primary/90 text-black font-extrabold shadow-md text-xs rounded-xl"
          >
            <Shield className="w-4 h-4 mr-1.5" /> Se connecter à la console Admin
          </Button>
        </form>

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
