import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Instagram, Twitter, Facebook } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-foreground text-background mt-20">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-black font-black text-sm">OM</div>
              <span className="font-extrabold text-xl text-background">OroMall <span className="text-primary text-xs font-black">GOLD</span></span>
            </div>
            <p className="text-sm text-background/60 leading-relaxed">
              La plateforme e-commerce & immobilière de référence au Cameroun. Achetez, vendez et louez en toute confiance via Mobile Money (MTN & Orange).
            </p>
            <div className="flex items-center gap-3 mt-4">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Icon className="w-4 h-4 text-background" />
                </button>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-background mb-4">Marketplace</h4>
            <ul className="space-y-2 text-sm text-background/60">
              {[
                { to: '/', label: 'Accueil' },
                { to: '/p2p', label: 'P2P' },
                { to: '/wishlist', label: 'Favoris' },
                { to: '/cart', label: 'Panier' },
              ].map(l => (
                <li key={l.to}><Link to={l.to} className="hover:text-primary transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-background mb-4">Vendeurs</h4>
            <ul className="space-y-2 text-sm text-background/60">
              {[
                { to: '/seller', label: 'Dashboard' },
                { to: '/seller/onboarding', label: 'Ouvrir une boutique' },
                { to: '/referral', label: 'Parrainage' },
                { to: '/faq', label: 'Aide & FAQ' },
              ].map(l => (
                <li key={l.to}><Link to={l.to} className="hover:text-primary transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-background mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-background/60">
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Yaoundé & Douala, Cameroun</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />+237 680195221</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />contact@oromall.cm</li>
            </ul>
            <div className="mt-4 flex items-center gap-2">
              <div className="px-3 py-1.5 bg-amber-500/20 rounded-lg">
                <p className="text-xs font-semibold text-amber-400">MTN MoMo: 680195221</p>
              </div>
              <div className="px-3 py-1.5 bg-orange-500/20 rounded-lg">
                <p className="text-xs font-semibold text-orange-400">Orange Money: 691576677</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/40">© {new Date().getFullYear()} OroMall. Tous droits réservés.</p>
          <div className="flex items-center gap-4 text-xs text-background/40">
            <span>Conditions d'utilisation</span>
            <span>•</span>
            <span>Politique de confidentialité</span>
            <span>•</span>
            <span>Paiements sécurisés MoMo</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
