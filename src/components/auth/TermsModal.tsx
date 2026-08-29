import { useState } from 'react'
import { X, ShieldCheck, FileText, Lock, ShoppingBag, Building2, AlertTriangle, Check, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface TermsModalProps {
  open: boolean
  onClose: () => void
  onAccept?: () => void
}

export function TermsModal({ open, onClose, onAccept }: TermsModalProps) {
  const [activeSection, setActiveSection] = useState<'cgu' | 'privacy'>('cgu')

  if (!open) return null

  const handleAccept = () => {
    if (onAccept) onAccept()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 animate-in fade-in duration-200">
      {/* Arrière-plan flou */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={onClose} />

      {/* Conteneur Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-card text-foreground rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* En-tête Modal */}
        <div className="p-5 sm:p-6 border-b border-border/80 flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-extrabold text-foreground">
                Conditions Générales & Confidentialité
              </h2>
              <p className="text-xs text-muted-foreground">
                Dernière mise à jour : 2026 • Plateforme OroMall Cameroun
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Onglets de navigation */}
        <div className="flex border-b border-border/80 bg-muted/20 px-5 pt-2 shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('cgu')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 ${
              activeSection === 'cgu'
                ? 'border-primary text-primary bg-card shadow-sm'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Conditions d'Utilisation (CGU/CGV)
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('privacy')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-1.5 ${
              activeSection === 'privacy'
                ? 'border-primary text-primary bg-card shadow-sm'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Politique de Confidentialité
          </button>
        </div>

        {/* Corps du texte avec défilement */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          
          {activeSection === 'cgu' ? (
            <div className="space-y-6">
              
              {/* Introduction */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-foreground space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="w-4 h-4" /> Préambule & Engagement de Confiance
                </p>
                <p className="text-xs text-muted-foreground">
                  En créant un compte sur OroMall (application web et mobile), vous acceptez sans réserve les présentes conditions régissant l'achat, la vente, la location de logements et les transactions Mobile Money au Cameroun.
                </p>
              </div>

              {/* Article 1 */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-black flex items-center justify-center">1</span>
                  Objet & Services Proposés par OroMall
                </h3>
                <p>
                  OroMall est une plateforme technologique camerounaise facilitant :
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
                  <li>L'achat, la commande et la livraison de produits physiques, articles et fournitures scolaires/universitaires.</li>
                  <li>La recherche, la géolocalisation et la réservation de visites pour des logements étudiants, studios modernes, cités universitaires et appartements.</li>
                  <li>La gestion commerciale et immobilière pour les Vendeurs et Bailleurs certifiés.</li>
                </ul>
              </div>

              {/* Article 2 */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-black flex items-center justify-center">2</span>
                  Comptes Utilisateurs & Statuts
                </h3>
                <p>
                  <strong>• Compte Client / Étudiant :</strong> Gratuit et ouvert à toute personne physique. Permet de commander des articles, programmer des visites de résidences, noter des boutiques et accumuler des points fidélité.
                </p>
                <p>
                  <strong>• Compte Vendeur & Bailleur :</strong> L'accès aux fonctionnalités de vente et de publication de logements n'est pas automatique. Il est soumis à la soumission d'un formulaire d'adhésion officiel et à la validation manuelle de nos équipes d'administration après vérification des coordonnées et des photos de devanture.
                </p>
              </div>

              {/* Article 3 */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-black flex items-center justify-center">3</span>
                  Paiements Sécurisés via Mobile Money (MTN MoMo & Orange Money)
                </h3>
                <p>
                  Toutes les transactions financières (achats de produits, forfaits de visite, loyers) transitent par les services agréés de Mobile Money au Cameroun. Les utilisateurs s'engagent à :
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
                  <li>Utiliser des numéros MTN MoMo ou Orange Money valides et enregistrés à leur nom.</li>
                  <li>Ne jamais effectuer de versements en dehors des canaux certifiés ou des indications officielles d'OroMall.</li>
                  <li>Conserver les reçus et SMS de confirmation de transaction en cas de besoin d'assistance.</li>
                </ul>
              </div>

              {/* Article 4 */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-black flex items-center justify-center">4</span>
                  Engagements Spécifiques des Bailleurs & Visites de Logements
                </h3>
                <p>
                  Les bailleurs et propriétaires inscrits garantissent :
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
                  <li>L'authenticité et la réalité des photos de façade et d'intérieur publiées sur la plateforme.</li>
                  <li>La disponibilité effective des logements au tarif indiqué sans frais cachés.</li>
                  <li>La ponctualité lors des rendez-vous de visite programmés par les locataires ou étudiants.</li>
                </ul>
              </div>

              {/* Article 5 */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-black flex items-center justify-center">5</span>
                  Engagements des Vendeurs, Livraisons & Retours
                </h3>
                <p>
                  Les vendeurs sont responsables de la qualité et de la conformité des articles expédiés. L'acheteur dispose d'un délai de 48 heures après réception pour signaler tout produit défectueux ou non conforme via le support client.
                </p>
              </div>

              {/* Article 6 */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-red-500/15 text-red-500 text-xs font-black flex items-center justify-center">6</span>
                  Comportements Prohibés & Sanctions
                </h3>
                <p className="text-xs">
                  Sont strictement interdits : la tentative d'escroquerie, la vente de produits contrefaits, la publication de fausses annonces de logements et l'usurpation d'identité. Toute infraction entraîne le blocage immédiat du compte et des poursuites légales.
                </p>
              </div>

            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Privacy intro */}
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-foreground space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <Lock className="w-4 h-4" /> Protection de Votre Vie Privée
                </p>
                <p className="text-xs text-muted-foreground">
                  OroMall s'engage à protéger la confidentialité de vos données personnelles conformément aux réglementations applicables sur les communications électroniques au Cameroun.
                </p>
              </div>

              {/* Donnees collectees */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground">1. Données collectées</h3>
                <p>Nous collectons uniquement les informations indispensables au bon fonctionnement de vos commandes et visites :</p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
                  <li><strong>Identité :</strong> Nom complet ou pseudonyme, adresse email.</li>
                  <li><strong>Contact & Livraison :</strong> Numéro de téléphone / WhatsApp, ville et adresse de livraison.</li>
                  <li><strong>Transactions :</strong> Numéros MTN MoMo et Orange Money pour la réception ou l'émission des paiements.</li>
                  <li><strong>Géolocalisation :</strong> Coordonnées GPS précises uniquement lorsque vous activez explicitement la fonction carte pour trouver des boutiques ou logements à proximité.</li>
                </ul>
              </div>

              {/* Utilisation */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground">2. Utilisation de vos données</h3>
                <p>Vos informations sont utilisées pour :</p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-xs">
                  <li>Le traitement de vos commandes et le suivi des livraisons.</li>
                  <li>La mise en relation directe avec les bailleurs pour vos visites de logements.</li>
                  <li>L'envoi des notifications importantes (statut de commande, validation de dossier).</li>
                </ul>
              </div>

              {/* Confidentialité absolue */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground">3. Non-divulgation à des tiers</h3>
                <p>
                  <strong>OroMall ne vend, ne loue et ne cède jamais vos données personnelles à des annonceurs publicitaires ou entreprises tierces.</strong> Vos coordonnées ne sont partagées qu'avec le vendeur ou le bailleur concerné par votre commande ou visite.
                </p>
              </div>

              {/* Vos droits */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground">4. Vos droits d'accès et de suppression</h3>
                <p>
                  Vous pouvez à tout moment modifier vos informations depuis votre profil ou demander la suppression définitive de votre compte en contactant le support à <code>support@oromall.cm</code> ou sur WhatsApp au <strong>+237 680 195 221</strong>.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Pied de page Modal */}
        <div className="p-4 sm:p-6 border-t border-border/80 bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">
            En continuant, vous confirmez avoir pris connaissance de ces règles.
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-none text-xs"
            >
              Fermer
            </Button>
            <Button
              type="button"
              onClick={handleAccept}
              className="flex-1 sm:flex-none text-xs font-bold bg-primary text-black hover:bg-primary/90"
            >
              <CheckCircle2 className="w-4 h-4" /> J'accepte les conditions
            </Button>
          </div>
        </div>

      </div>
    </div>
  )
}
