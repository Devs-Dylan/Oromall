import { Gift, Award, Sparkles, TrendingUp, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function LoyaltyPointsWidget() {
  const { user } = useAuth()

  if (!user) return null

  const points = user.loyalty_points || 150 // Seed points par défaut
  const discountFcfa = Math.floor(points * 10) // 1 point = 10 FCFA

  return (
    <div className="card-glass p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Programme Client Pro</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300">VIP</span>
          </div>
          <h4 className="text-sm font-extrabold text-foreground mt-0.5">
            Solde Fidélité : <span className="text-amber-400 font-mono text-base">{points} Pts</span>
          </h4>
          <p className="text-xs text-muted-foreground">
            Équivalent à <strong className="text-emerald-400 font-bold">{discountFcfa} FCFA</strong> de réduction MoMo déblocable.
          </p>
        </div>
      </div>

      <div className="hidden sm:flex flex-col items-end gap-1">
        <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-emerald-400" /> +10 Pts à chaque achat
        </span>
        <span className="text-[10px] text-amber-400/80">Automatiquement appliqué</span>
      </div>
    </div>
  )
}
