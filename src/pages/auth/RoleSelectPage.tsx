import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, GraduationCap, Building2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { toastSuccess } from '@/components/ui/Toast'

export default function RoleSelectPage() {
  const { setRole } = useAuth()
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-10 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground">
          Choisissez votre mode d'utilisation
        </h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Vous pourrez modifier votre statut à tout moment depuis vos paramètres de profil.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 text-left max-w-3xl mx-auto">
        {/* Option 1: Client / Étudiant */}
        <div className="card-glass p-8 space-y-6 hover:border-primary/40 transition-all flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 mb-2 inline-block">
                Acheteur & Locataire
              </span>
              <h2 className="text-2xl font-bold text-foreground">Client / Étudiant</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Consultez les annonces, achetez du matériel, réservez des visites de chambres/studios et payez via MTN MoMo ou Orange Money.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Accès complet à la marketplace</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Recherche de logements & réservation de visites</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Gestion des favoris & chat avec les vendeurs</li>
            </ul>
          </div>
          <Button onClick={handleSelectClient} variant="outline" className="w-full justify-center">
            Continuer comme Client / Étudiant <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Option 2: Vendeur / Bailleur */}
        <div className="card-glass p-8 space-y-6 hover:border-amber-500/40 transition-all flex flex-col justify-between group border-2 border-amber-500/20 bg-amber-500/5">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-black flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform shadow-md">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <span className="badge-primary mb-1">Recommandé</span>
              <h2 className="text-2xl font-bold text-foreground">Vendeur / Bailleur</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ouvrez votre propre vitrine en ligne, publiez vos articles ou vos logements / chambres, recevez des paiements Mobile Money et gérez votre activité.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Création de boutique personnalisée</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Publication de produits et de logements</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dashboard analytique & suivi des commandes et visites</li>
            </ul>
          </div>
          <Button onClick={handleSelectSeller} className="w-full justify-center">
            Ouvrir mon espace Vendeur / Bailleur <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
