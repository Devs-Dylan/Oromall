import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Lock, ShieldCheck, ShoppingBag, Home, Sparkles, ArrowRight, X, UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface AuthRequiredModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  actionName?: string
}

export function AuthRequiredModal({
  open,
  onClose,
  title = 'Connexion requise',
  description = 'Vous devez être connecté à votre compte pour effectuer cette action sur OroMall.',
  actionName = 'cette action',
}: AuthRequiredModalProps) {
  const navigate = useNavigate()
  const location = useLocation()

  if (!open) return null

  const handleLogin = () => {
    onClose()
    navigate('/login', { state: { from: location } })
  }

  const handleRegister = () => {
    onClose()
    navigate('/register')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="card-glass p-6 sm:p-8 max-w-md w-full space-y-6 border border-amber-500/40 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 p-0.5 flex items-center justify-center shadow-lg shadow-primary/30">
            <div className="w-full h-full bg-[#0a0a0f] rounded-[14px] flex items-center justify-center text-primary">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold font-display text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">{description}</p>
          </div>
        </div>

        {/* Benefits list */}
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2.5 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-amber-400">
            <Sparkles className="w-3.5 h-3.5 fill-current" /> Avec votre compte gratuit :
          </p>
          <div className="space-y-1.5 text-[11px]">
            <p className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Commandez des articles avec paiement Mobile Money</span>
            </p>
            <p className="flex items-center gap-2">
              <Home className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Réservez des visites de chambres & logements</span>
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Échangez en direct avec les vendeurs et bailleurs certifiés</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Button
            onClick={handleLogin}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-primary to-amber-600 hover:opacity-95 text-black font-extrabold text-xs shadow-xl shadow-primary/25 rounded-xl justify-center flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4" /> Se connecter à mon compte <ArrowRight className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="outline"
            onClick={handleRegister}
            className="w-full py-3 text-xs justify-center font-bold"
          >
            Créer un compte gratuitement
          </Button>
        </div>

        <p className="text-[10px] text-center text-muted-foreground">
          Inscription rapide en moins de 30 secondes avec votre numéro de téléphone.
        </p>

      </div>
    </div>
  )
}
