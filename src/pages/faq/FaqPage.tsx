import { useState } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, MessageSquare, Phone } from 'lucide-react'
import { buildWhatsAppUrl } from '@/lib/utils'

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      q: "Comment effectuer un paiement via Mobile Money sur OroMall ?",
      a: "Pour payer votre commande, vous pouvez transférer le montant directement au numéro MTN MoMo ou Orange Money du vendeur indiqué sur la page produit ou lors de l'initialisation de la commande. Vous uploaderez ensuite votre preuve ou identifiant de transaction."
    },
    {
      q: "Comment ouvrir ma propre boutique ?",
      a: "Accédez au menu 'Ouvrir une boutique', remplissez les informations de votre boutique (nom, catégorie, ville, WhatsApp) et choisissez votre type de compte. Après validation de l'activation par l'administrateur, votre boutique sera en ligne."
    },
    {
      q: "Est-il possible de se faire livrer directement sur le campus ou à domicile ?",
      a: "Oui ! OroMall privilégie la proximité. Vous pouvez fixer un point de rendez-vous avec le vendeur (ex: Campus, Carrefour, Entrée principale) ou convenir d'une livraison à domicile à Yaoundé, Douala, Dschang, etc."
    },
    {
      q: "Comment fonctionne le code PIN de livraison ?",
      a: "Lors d'une commande initiée sur la plateforme, un code PIN unique est généré pour l'acheteur. Donnez ce code au vendeur ou livreur SEULEMENT lorsque vous avez reçu et vérifié votre article en main propre pour confirmer la transaction."
    },
    {
      q: "Que faire en cas de litige ou de problème avec une commande ?",
      a: "En cas de problème, contactez directement l'équipe de support OroMall via WhatsApp en appuyant sur le bouton 'Support WhatsApp' en bas de page."
    }
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-primary text-black font-black flex items-center justify-center mx-auto shadow-md">
          <HelpCircle className="w-7 h-7" />
        </div>
        <h1 className="text-3xl font-display font-extrabold text-foreground">Centre d'aide & Foire Aux Questions</h1>
        <p className="text-muted-foreground text-sm">Tout ce que vous devez savoir pour utiliser OroMall en toute simplicité.</p>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <div key={i} className="card-glass overflow-hidden border border-border transition-colors">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full p-5 text-left flex items-center justify-between font-semibold text-foreground text-base gap-4"
            >
              <span>{faq.q}</span>
              {openIndex === i ? <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
            </button>
            {openIndex === i && (
              <div className="p-5 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border/40 bg-muted/20">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* WhatsApp Support Box */}
      <div className="card-glass p-8 rounded-3xl bg-gradient-to-r from-emerald-600/10 to-primary/10 border border-emerald-500/20 text-center space-y-4">
        <h3 className="text-xl font-bold text-foreground">Une autre question ?</h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">Notre équipe d'assistance est disponible 7j/7 pour vous accompagner.</p>
        <a
          href={buildWhatsAppUrl('237680195221', 'Bonjour support OroMall, j\'ai une question concernant...')}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-soft"
        >
          <MessageSquare className="w-4 h-4" /> Support WhatsApp Direct
        </a>
      </div>
    </div>
  )
}
