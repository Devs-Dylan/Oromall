import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, User, Store } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mtnNumber, setMtnNumber] = useState('')
  const [orangeNumber, setOrangeNumber] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return
    setLoading(true)
    await register(name, email, password)
    setLoading(false)
    toastSuccess('Compte créé avec succès !')
    navigate('/role')
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card-glass p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center text-white font-black text-xl mx-auto shadow-md">
            M+
          </div>
          <h1 className="text-2xl font-display font-extrabold text-foreground">Inscription MarchéPlus</h1>
          <p className="text-xs text-muted-foreground">Rejoignez la plus grande communauté d'étudiants vendeurs et acheteurs.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Nom complet" placeholder="Ex: Jean Nsangou" required value={name} onChange={e => setName(e.target.value)} />
          <Input label="Adresse Email" type="email" placeholder="votre@email.cm" required value={email} onChange={e => setEmail(e.target.value)} />
          <Input label="Mot de passe" type="password" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} />

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Input label="Numéro MTN MoMo (optionnel)" placeholder="6XX XXX XXX" value={mtnNumber} onChange={e => setMtnNumber(e.target.value)} />
            <Input label="Numéro Orange Money (optionnel)" placeholder="6XX XXX XXX" value={orangeNumber} onChange={e => setOrangeNumber(e.target.value)} />
          </div>

          <Button type="submit" loading={loading} className="w-full justify-center py-3">
            <UserPlus className="w-4 h-4" /> Créer mon compte
          </Button>
        </form>

        <div className="text-center text-xs text-muted-foreground pt-2">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-primary font-bold hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}
