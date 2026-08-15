import { useState } from 'react'
import { Settings, Image, Store, Clock, MapPin, ShieldCheck, Truck, RotateCcw, Check, Sparkles } from 'lucide-react'
import type { Shop } from '@/types'
import { ShopAPI } from '@/lib/store'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

interface SellerCustomizerTabProps {
  shop?: Shop
  onRefresh: () => void
}

export function SellerCustomizerTab({ shop, onRefresh }: SellerCustomizerTabProps) {
  const [sName, setSName] = useState(shop?.name || '')
  const [sHours, setSHours] = useState(shop?.business_hours || 'Lun - Sam: 08h00 - 19h30')
  const [sAddress, setSAddress] = useState(shop?.address || '')
  const [sBanner, setSBanner] = useState(shop?.banner_url || '')
  const [sLogo, setSLogo] = useState(shop?.logo_url || '')
  const [sShipping, setSShipping] = useState(shop?.policies?.shipping || 'Livraison rapide à domicile ou sur le campus')
  const [sReturns, setSReturns] = useState(shop?.policies?.returns || 'Satisfait ou remplacé sous 7 jours')
  const [sGuarantee, setSGuarantee] = useState(shop?.policies?.guarantee || 'Garantie produit 6 mois')

  const handleSaveCustomizer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop) return

    ShopAPI.update(shop.id, {
      name: sName,
      business_hours: sHours,
      address: sAddress,
      banner_url: sBanner,
      logo_url: sLogo,
      policies: {
        shipping: sShipping,
        returns: sReturns,
        guarantee: sGuarantee,
      }
    })

    toastSuccess('Vitrine de la boutique personnalisée et enregistrée !')
    onRefresh()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" /> Vitrine Shopify Theme Customizer
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Personnalisez la bannière, le logo, les horaires d'ouverture et les engagements de votre boutique.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Form */}
        <form onSubmit={handleSaveCustomizer} className="lg:col-span-2 card-glass p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
            <Store className="w-4 h-4 text-primary" /> Informations Générales de la Vitrine
          </h3>

          <Input
            label="Nom public de la boutique"
            value={sName}
            onChange={(e) => setSName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="URL du Logo"
              value={sLogo}
              onChange={(e) => setSLogo(e.target.value)}
              placeholder="https://..."
            />
            <Input
              label="URL de la Bannière de couverture"
              value={sBanner}
              onChange={(e) => setSBanner(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Horaires d'ouverture"
              value={sHours}
              onChange={(e) => setSHours(e.target.value)}
            />
            <Input
              label="Adresse physique / Campus"
              value={sAddress}
              onChange={(e) => setSAddress(e.target.value)}
            />
          </div>

          <h3 className="text-sm font-bold text-foreground border-b border-border pb-2 pt-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Engagements & Politiques Client
          </h3>

          <Input
            label="Politique de Livraison"
            value={sShipping}
            onChange={(e) => setSShipping(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Politique de Retours"
              value={sReturns}
              onChange={(e) => setSReturns(e.target.value)}
            />
            <Input
              label="Garantie proposée"
              value={sGuarantee}
              onChange={(e) => setSGuarantee(e.target.value)}
            />
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" className="gap-2 shadow-lg shadow-primary/20">
              <Check className="w-4 h-4" /> Enregistrer le Thème
            </Button>
          </div>
        </form>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aperçu en Direct pour les Clients</h3>

          <div className="card-glass overflow-hidden space-y-4 shadow-xl">
            {/* Banner preview */}
            <div className="h-32 bg-card relative overflow-hidden">
              <img
                src={sBanner || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000'}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
            </div>

            {/* Logo and shop name */}
            <div className="px-5 pb-5 pt-0 -mt-10 relative space-y-3">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-card border-2 border-background shadow-lg">
                <img
                  src={sLogo || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=200'}
                  alt="Logo preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h4 className="text-base font-bold font-display text-foreground">{sName || 'Nom de la Boutique'}</h4>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-primary" /> {sHours}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-400" /> {sAddress || 'Cameroun'}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Truck className="w-3.5 h-3.5 text-primary" /> {sShipping}
                </p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> {sReturns}
                </p>
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> {sGuarantee}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
