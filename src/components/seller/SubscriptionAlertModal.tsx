import { useState, useEffect } from 'react'
import { AlertTriangle, Clock, CreditCard, Sparkles, X, ArrowRight, ShieldAlert } from 'lucide-react'
import type { Subscription } from '@/types'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface SubscriptionAlertModalProps {
  subscription: Subscription | undefined
  onOpenRenew: () => void
}

export function SubscriptionAlertModal({ subscription, onOpenRenew }: SubscriptionAlertModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!subscription) return

    // Show popup if remaining days <= 5 or expired
    const isExpiring = subscription.days_remaining <= 5
    if (isExpiring) {
      // Check session storage to avoid spamming on every sub-tab click within same session
      const dismissed = sessionStorage.getItem(`sub_alert_dismissed_${subscription.id}`)
      if (!dismissed) {
        setIsOpen(true)
      }
    }
  }, [subscription])

  if (!isOpen || !subscription) return null

  const daysLeft = subscription.days_remaining
  const isExpired = daysLeft <= 0

  const handleDismiss = () => {
    sessionStorage.setItem(`sub_alert_dismissed_${subscription.id}`, 'true')
    setIsOpen(false)
  }

  const handleAction = () => {
    handleDismiss()
    onOpenRenew()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-b from-slate-900 via-card to-background p-6 md:p-8 shadow-2xl shadow-amber-500/10 space-y-6">
        
        {/* Decorative elements / Pub style badge */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

        <button 
          onClick={handleDismiss} 
          className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Publicité / Announcement Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-3 h-3" /> Offre & Rappel Important Vendeur
            </span>
            <h2 className="text-xl font-black font-display text-foreground mt-1">
              {isExpired ? '🚨 Boutique Suspendue / Expire !' : '⚠️ Échéance de paiement imminente !'}
            </h2>
          </div>
        </div>

        {/* Pub Content Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-semibold">Statut Boutique :</span>
            <span className="font-extrabold text-foreground">{subscription.shop_name}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Temps restant :</span>
            <span className={`text-lg font-black ${isExpired ? 'text-red-500' : 'text-amber-400'} flex items-center gap-1`}>
              <Clock className="w-4 h-4" /> {isExpired ? 'Expiré' : `${daysLeft} jour(s) restant(s)`}
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-amber-500/10">
            Ne laissez pas votre boutique se désactiver ! Renouvelez dès maintenant pour conserver l'accès illimité à votre catalogue produits, vos commandes Mobile Money et l'espace immobilier.
          </p>
        </div>

        {/* Info MoMo Admin */}
        <div className="bg-muted/40 p-4 rounded-xl space-y-1.5 text-xs">
          <p className="font-bold text-foreground flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-primary" /> Tarif d'abonnement : 15 000 FCFA / 30 jours
          </p>
          <p className="text-muted-foreground">Paiement Mobile Money direct :</p>
          <div className="flex gap-4 font-mono font-bold text-foreground">
            <span>💛 MTN MoMo: 680195221</span>
            <span>🧡 Orange Money: 691576677</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            onClick={handleAction} 
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-lg shadow-amber-500/20 text-sm py-3"
          >
            Renouveler Mon Abonnement <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleDismiss} 
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Rappeler plus tard
          </Button>
        </div>

      </div>
    </div>
  )
}
