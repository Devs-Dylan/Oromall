import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, GraduationCap, Building2, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { toastSuccess } from '@/components/ui/Toast'

export default function RoleSelectPage() {
  const { setRole, updateUser } = useAuth()
  const navigate = useNavigate()

  const handleSelectClient = () => {
    setRole('client')
    toastSuccess('Bienvenue en tant que Client / Étudiant !')
    navigate('/')
  }

  const handleSelectSeller = () => {
    setRole('seller')
    toastSuccess('Espace Vendeur / Bailleur configuré !')
    navigate('/seller/onboarding')
  }

  const handleSelectAssociate = () => {
    updateUser({ role: 'associate' })
    toastSuccess('Bienvenue dans votre Espace Associé ! 🤝')
    navigate('/associate')
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-10 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground">
          Choisissez votre mode d'utilisation
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Vous pourrez modifier votre statut à tout moment depuis vos paramètres de profil.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
        {/* Option 1: Client / Étudiant */}
        <div className="card-glass p-6 space-y-6 hover:border-primary/40 transition-all flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-2 inline-block">
                Acheteur & Locataire
              </span>
              <h2 className="text-xl font-bold text-foreground">Client / Étudiant</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Consultez les annonces, achetez du matériel, réservez des visites de chambres/studios et payez via MTN MoMo ou Orange Money.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Marketplace complète</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Réservation de visites</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Favoris & chat vendeur</li>
            </ul>
          </div>
          <Button onClick={handleSelectClient} variant="outline" className="w-full justify-center text-xs">
            Client / Étudiant <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Option 2: Vendeur / Bailleur */}
        <div className="card-glass p-6 space-y-6 hover:border-amber-500/40 transition-all flex flex-col justify-between group border-2 border-amber-500/20 bg-amber-500/5">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-black flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="badge-primary mb-1 text-[10px]">Recommandé</span>
              <h2 className="text-xl font-bold text-foreground">Vendeur / Bailleur</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ouvrez votre boutique, publiez vos articles ou vos logements, encaissez des paiements Mobile Money et suivez vos ventes.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Vitrine personnalisée</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Publication d'annonces</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Dashboard de gestion</li>
            </ul>
          </div>
          <Button onClick={handleSelectSeller} className="w-full justify-center text-xs">
            Vendeur / Bailleur <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Option 3: Associé / Agent Terrain */}
        <div className="card-glass p-6 space-y-6 hover:border-emerald-500/40 transition-all flex flex-col justify-between group border-2 border-emerald-500/20 bg-emerald-500/5">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-1 inline-block">
                Partenaire MoMo
              </span>
              <h2 className="text-xl font-bold text-foreground">Associé Terrain</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Recensez des logements sur le terrain, planifiez les visites avec les clients et percevez vos primes sur MTN / Orange Money.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Recensement logements</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Primes de 5 000 FCFA / bien</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Planning des visites</li>
            </ul>
          </div>
          <Button onClick={handleSelectAssociate} className="w-full justify-center text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
            Espace Associé <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
