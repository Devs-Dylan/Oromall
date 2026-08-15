import { useNavigate } from 'react-router-dom'
import { User, Store, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { toastSuccess } from '@/components/ui/Toast'

export default function RoleSelectPage() {
  const { setRole } = useAuth()
  const navigate = useNavigate()

  const handleSelectClient = () => {
    setRole('client')
    toastSuccess('Bienvenue en tant qu\'Acheteur !')
    navigate('/')
  }

  const handleSelectSeller = () => {
    setRole('seller')
    toastSuccess('Espace Vendeur configuré !')
    navigate('/seller/onboarding')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-10 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground">Choisissez votre mode d'utilisation</h1>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Vous pourrez modifier votre statut à tout moment depuis vos paramètres.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 text-left max-w-3xl mx-auto">
        {/* Client option */}
        <div className="card-glass p-8 space-y-6 hover:border-primary/40 transition-all flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform">
              <User className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Acheteur / Étudiant</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Consultez les annonces, achetez du matériel, échangez des manuels et payez via MTN MoMo ou Orange Money.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Accès complet à la marketplace</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Gestion des favoris & avis</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Chat WhatsApp direct avec les vendeurs</li>
            </ul>
          </div>
          <Button onClick={handleSelectClient} variant="outline" className="w-full justify-center">
            Continuer comme Acheteur <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Seller option */}
        <div className="card-glass p-8 space-y-6 hover:border-primary/40 transition-all flex flex-col justify-between group border-2 border-primary/20 bg-primary/5">
          <div className="space-y-4">
            <div className="w-14 h-14 rounded-2xl gradient-primary text-white flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform shadow-md">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <span className="badge-primary mb-1">Recommandé</span>
              <h2 className="text-2xl font-bold text-foreground">Vendeur / Boutique</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ouvrez votre propre vitrine en ligne, publiez vos articles, recevez des paiements Mobile Money et gérez vos ventes.
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Création de boutique personnalisée</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Publication de produits illimitée</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dashboard analytique & suivi des commandes</li>
            </ul>
          </div>
          <Button onClick={handleSelectSeller} className="w-full justify-center">
            Ouvrir ma boutique <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
