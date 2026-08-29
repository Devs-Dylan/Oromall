import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck, FileText, Lock, ArrowLeft, Building2, ShoppingBag, Phone } from 'lucide-react'

export default function TermsPage() {
  const [activeTab, setActiveTab] = useState<'cgu' | 'privacy'>('cgu')

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-200">
      
      {/* En-tête */}
      <div className="space-y-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à l'accueil
        </Link>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="badge-primary text-xs px-2.5 py-0.5">Juridique & Conformité</span>
            <span className="text-xs text-muted-foreground">• Mise à jour 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-foreground">
            Conditions Générales d'Utilisation & Confidentialité
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Règlement officiel régissant l'utilisation de la plateforme de commerce en ligne et de gestion immobilière OroMall au Cameroun.
          </p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex border-b border-border gap-3">
        <button
          type="button"
          onClick={() => setActiveTab('cgu')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'cgu'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4" /> Conditions Générales (CGU / CGV)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'privacy'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Lock className="w-4 h-4" /> Politique de Confidentialité
        </button>
      </div>

      {/* Contenu */}
      <div className="card-glass p-6 sm:p-10 space-y-8 text-sm leading-relaxed text-muted-foreground border border-border">
        {activeTab === 'cgu' ? (
          <div className="space-y-8">
            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-primary/15 text-primary text-xs font-black flex items-center justify-center">1</span>
                Objet et Description des Services
              </h2>
              <p>
                OroMall est une plateforme camerounaise tout-en-un dédiée à la digitalisation des commerces de proximité et des logements pour étudiants et particuliers. Elle offre les services suivants :
              </p>
              <ul className="list-disc list-inside space-y-1 pl-3 text-xs sm:text-sm">
                <li>Vitrine e-commerce et vente d'articles (fournitures scolaires, informatique, mode, maison).</li>
                <li>Catalogue interactif et géolocalisation de cités universitaires, chambres étudiantes, studios et résidences.</li>
                <li>Prise de rendez-vous et paiement sécurisé de forfaits de visite via Mobile Money.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-primary/15 text-primary text-xs font-black flex items-center justify-center">2</span>
                Inscription, Rôles et Processus de Validation
              </h2>
              <p>
                <strong>Clients / Étudiants :</strong> Accès immédiat et gratuit à toutes les fonctionnalités d'achat et de consultation.
              </p>
              <p>
                <strong>Vendeurs & Bailleurs :</strong> Pour garantir la sécurité et l'authenticité des annonces, les créateurs de boutiques et les bailleurs doivent soumettre un formulaire d'adhésion officiel comprenant notamment la photo de façade/devanture et les contacts de paiement. La publication d'annonces n'est active qu'après examen et approbation par nos équipes.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-primary/15 text-primary text-xs font-black flex items-center justify-center">3</span>
                Paiements via MTN Mobile Money & Orange Money
              </h2>
              <p>
                Les paiements effectués sur OroMall sont traités conformément aux normes de sécurité Mobile Money au Cameroun. Les utilisateurs s'engagent à fournir des numéros valides. Tout transfert en dehors du protocole de la plateforme dégage la responsabilité d'OroMall.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-primary/15 text-primary text-xs font-black flex items-center justify-center">4</span>
                Visites Immobilières et Logements
              </h2>
              <p>
                Les Bailleurs s'engagent à afficher des photos réelles et fidèles de leurs chambres et résidences. En cas de non-respect ou de logement non conforme lors de la visite, le locataire peut saisir le support client pour médiation ou remboursement de forfait selon les conditions applicables.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-primary/15 text-primary text-xs font-black flex items-center justify-center">5</span>
                Litiges & Assistance Client
              </h2>
              <p>
                Pour toute réclamation, notre équipe d'assistance est joignable 7j/7 via WhatsApp au <strong>+237 680 195 221</strong> ou par email à <code>support@oromall.cm</code>.
              </p>
            </section>
          </div>
        ) : (
          <div className="space-y-8">
            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" /> Collecte et Utilisation des Données
              </h2>
              <p>
                Nous collectons uniquement les informations requises pour vous fournir une expérience fiable : nom, email, téléphone/WhatsApp, ville et coordonnées Mobile Money de transaction.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" /> Sécurité et Non-Revente
              </h2>
              <p>
                Vos informations personnelles ne sont <strong>jamais vendues ou cédées à des régies publicitaires externes</strong>. Les mots de passe et données de session bénéficient d'un stockage sécurisé et chiffré.
              </p>
            </section>
          </div>
        )}
      </div>

    </div>
  )
}
