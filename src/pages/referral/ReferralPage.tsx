import { useState } from 'react'
import { Gift, Copy, Check, Users, DollarSign, Tag, Award } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { toastSuccess } from '@/components/ui/Toast'

export default function ReferralPage() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  const referralCode = user ? `REF-${user.name.toUpperCase().slice(0, 4)}-${user.id.slice(0, 4)}` : 'REF-DEMO-1234'
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    toastSuccess('Lien copié dans le presse-papier !')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
      {/* Hero Banner */}
      <div className="card-glass p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-amber-500/5 to-card border border-border text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white mx-auto shadow-lg">
          <Gift className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground">Programme de Parrainage MarchéPlus</h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
          Invitez vos amis et camarades de campus à créer une boutique ou acheter sur MarchéPlus et gagnez <strong className="text-primary font-bold">1 000 FCFA</strong> par vendeur inscrit !
        </p>

        {/* Copy Link Input */}
        <div className="max-w-xl mx-auto flex items-center gap-2 p-2 bg-card rounded-2xl border border-border shadow-sm">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-1 px-3 py-2 bg-transparent text-xs sm:text-sm text-foreground focus:outline-none truncate"
          />
          <Button onClick={copyLink} size="sm" className="flex-shrink-0">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copié' : 'Copier'}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard icon={<Users className="w-6 h-6" />} label="Filleuls inscrits" value="4 Étudiants" color="orange" />
        <StatCard icon={<DollarSign className="w-6 h-6" />} label="Gains accumulés" value={formatPrice(4000)} color="green" />
        <StatCard icon={<Award className="w-6 h-6" />} label="Niveau Parrain" value="Bronze (Top 10%)" color="purple" />
      </div>

      {/* How it works */}
      <div className="card-glass p-8 space-y-6">
        <h2 className="text-2xl font-display font-bold text-foreground text-center">Comment ça marche ?</h2>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2 p-4 rounded-2xl bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto text-lg">1</div>
            <h3 className="font-bold text-foreground text-base">Partagez votre lien</h3>
            <p className="text-xs text-muted-foreground">Envoyez votre lien unique à vos amis sur WhatsApp, Telegram ou les réseaux sociaux.</p>
          </div>
          <div className="space-y-2 p-4 rounded-2xl bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto text-lg">2</div>
            <h3 className="font-bold text-foreground text-base">Ils s'inscrivent</h3>
            <p className="text-xs text-muted-foreground">Votre ami crée son compte ou sa boutique en utilisant votre code parrain.</p>
          </div>
          <div className="space-y-2 p-4 rounded-2xl bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center mx-auto text-lg">3</div>
            <h3 className="font-bold text-foreground text-base">Recevez vos FCFA</h3>
            <p className="text-xs text-muted-foreground">Recevez 1 000 FCFA directement via MTN MoMo ou Orange Money à chaque boutique activée !</p>
          </div>
        </div>
      </div>
    </div>
  )
}
