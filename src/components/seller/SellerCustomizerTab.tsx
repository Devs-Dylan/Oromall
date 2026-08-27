import { useState } from 'react'
import {
  Settings, Image, Store, Clock, MapPin, ShieldCheck, Truck, RotateCcw,
  Check, Sparkles, Navigation, Phone, Mail, Globe, Share2, DollarSign, Tag, MessageCircle
} from 'lucide-react'
import type { Shop } from '@/types'
import { ShopAPI } from '@/lib/store'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { ImageUploadField } from '@/components/ui/ImageUploadField'
import { LocationPicker } from '@/components/shared/LocationPicker'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface SellerCustomizerTabProps {
  shop?: Shop
  onRefresh: () => void
}

export function SellerCustomizerTab({ shop, onRefresh }: SellerCustomizerTabProps) {
  // 1. Informations Générales & Identité
  const [sName, setSName] = useState(shop?.name || '')
  const [sDescription, setSDescription] = useState(shop?.description || '')
  const [sCategory, setSCategory] = useState(shop?.category || 'Mode')
  const [sCity, setSCity] = useState(shop?.city || 'Yaoundé')
  const [sAddress, setSAddress] = useState(shop?.address || '')
  const [sHours, setSHours] = useState(shop?.business_hours || 'Lun - Sam: 08h00 - 19h30')

  // 2. Contacts Vendeur & Numéros de Paiement
  const [sWhatsApp, setSWhatsApp] = useState(shop?.whatsapp_number || '')
  const [sMTN, setSMTN] = useState(shop?.mtn_number || '')
  const [sOrange, setSOrange] = useState(shop?.orange_number || '')
  const [sEmail, setSEmail] = useState(shop?.owner_email || '')

  // 3. Images, Logo & Branding
  const [sCover, setSCover] = useState(shop?.cover_image || '')
  const [sProfile, setSProfile] = useState(shop?.profile_image || shop?.logo_url || '')

  // 4. Politiques Commerciales & Garanties
  const [sShipping, setSShipping] = useState(shop?.policies?.shipping || 'Livraison rapide en 24-48h sur campus et à domicile')
  const [sReturns, setSReturns] = useState(shop?.policies?.returns || 'Satisfait ou échangé sous 7 jours après réception')
  const [sGuarantee, setSGuarantee] = useState(shop?.policies?.guarantee || 'Garantie produit et conformité certifiée')

  // 5. Réseaux Sociaux & Liens
  const [sFacebook, setSFacebook] = useState(shop?.social_links?.facebook || '')
  const [sInstagram, setSInstagram] = useState(shop?.social_links?.instagram || '')
  const [sWebsite, setSWebsite] = useState(shop?.social_links?.website || '')

  // 6. Coordonnées GPS
  const [sLatitude, setSLatitude] = useState(shop?.latitude?.toString() || '')
  const [sLongitude, setSLongitude] = useState(shop?.longitude?.toString() || '')

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toastError('Géolocalisation non supportée par votre navigateur.')
      return
    }
    toastSuccess('Détection de position...', 'Veuillez autoriser l\'accès GPS.')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSLatitude(position.coords.latitude.toString())
        setSLongitude(position.coords.longitude.toString())
        toastSuccess('Position GPS enregistrée !', `Lat: ${position.coords.latitude.toFixed(5)}, Lng: ${position.coords.longitude.toFixed(5)}`)
      },
      (error) => {
        toastError('Erreur de géolocalisation', error.message)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleSaveCustomizer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop) {
      toastError('Aucune boutique active associée à votre compte.')
      return
    }

    ShopAPI.update(shop.id, {
      name: sName,
      description: sDescription,
      category: sCategory,
      city: sCity,
      business_hours: sHours,
      address: sAddress,
      whatsapp_number: sWhatsApp,
      mtn_number: sMTN || undefined,
      orange_number: sOrange || undefined,
      owner_email: sEmail,
      latitude: sLatitude ? Number(sLatitude) : undefined,
      longitude: sLongitude ? Number(sLongitude) : undefined,
      cover_image: sCover || undefined,
      profile_image: sProfile || undefined,
      logo_url: sProfile || undefined,
      policies: {
        shipping: sShipping,
        returns: sReturns,
        guarantee: sGuarantee,
      },
      social_links: {
        facebook: sFacebook || undefined,
        instagram: sInstagram || undefined,
        website: sWebsite || undefined,
      },
    })

    toastSuccess('Boutique personnalisée et mise à jour avec succès !')
    onRefresh()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" /> Studio & Gestion Complète de Boutique
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personnalisez votre vitrine, vos bannières, vos contacts Mobile Money, vos politiques de livraison et vos liens réseaux.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveCustomizer} className="space-y-6">
        {/* Grille Principale */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECTION 1 : Identité & Description */}
          <div className="card-glass p-5 space-y-4 border-l-4 border-l-primary">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> 1. Identité & Présentation Vitrine
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Nom officiel de la boutique *</label>
                <Input value={sName} onChange={e => setSName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Catégorie Principale</label>
                  <Input value={sCategory} onChange={e => setSCategory(e.target.value)} placeholder="Mode, Électronique..." />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Ville Principale *</label>
                  <Input value={sCity} onChange={e => setSCity(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Description publique de votre boutique</label>
                <Textarea
                  rows={3}
                  value={sDescription}
                  onChange={e => setSDescription(e.target.value)}
                  placeholder="Présentez vos produits phares, vos valeurs, vos offres spéciales..."
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" /> Horaires d'ouverture
                </label>
                <Input value={sHours} onChange={e => setSHours(e.target.value)} placeholder="Ex: Lun - Sam: 08h00 - 19h00" />
              </div>
            </div>
          </div>

          {/* SECTION 2 : Contacts & Mobile Money */}
          <div className="card-glass p-5 space-y-4 border-l-4 border-l-emerald-500">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" /> 2. Contacts Directs & Paiements MoMo
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5 text-emerald-400">
                  <MessageCircle className="w-3.5 h-3.5" /> Numéro WhatsApp Vendeur (Commandes) *
                </label>
                <Input value={sWhatsApp} onChange={e => setSWhatsApp(e.target.value)} placeholder="677 00 00 00" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Numéro MTN MoMo</label>
                  <Input value={sMTN} onChange={e => setSMTN(e.target.value)} placeholder="670 00 00 00" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Numéro Orange Money</label>
                  <Input value={sOrange} onChange={e => setSOrange(e.target.value)} placeholder="690 00 00 00" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Email de contact boutique</label>
                <Input type="email" value={sEmail} onChange={e => setSEmail(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Adresse physique (Quartier, Immeuble)
                </label>
                <Input value={sAddress} onChange={e => setSAddress(e.target.value)} placeholder="Ex: Face Entrée Campus Ngoa-Ekellé" />
              </div>
            </div>
          </div>

          {/* SECTION 3 : Branding & Images */}
          <div className="card-glass p-5 space-y-4 border-l-4 border-l-purple-500">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Image className="w-4 h-4 text-purple-400" /> 3. Logo & Image de Couverture
            </h3>
            <div className="space-y-4 text-xs">
              <ImageUploadField
                label="Logo / Photo de profil de la boutique"
                value={sProfile}
                onChange={setSProfile}
                aspectRatio="1:1"
              />
              <ImageUploadField
                label="Bannière de couverture de la vitrine"
                value={sCover}
                onChange={setSCover}
                aspectRatio="16:9"
              />
            </div>
          </div>

          {/* SECTION 4 : Politiques Commerciales & Engagements */}
          <div className="card-glass p-5 space-y-4 border-l-4 border-l-blue-500">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> 4. Politiques Commerciales & Garanties
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-muted-foreground" /> Politique de Livraison
                </label>
                <Input value={sShipping} onChange={e => setSShipping(e.target.value)} placeholder="Délais et zones de livraison..." />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" /> Retours & Remboursements
                </label>
                <Input value={sReturns} onChange={e => setSReturns(e.target.value)} placeholder="Conditions de retour d'article..." />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" /> Garantie Produit
                </label>
                <Input value={sGuarantee} onChange={e => setSGuarantee(e.target.value)} placeholder="Durée et conditions de garantie..." />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5 : Réseaux Sociaux & Géolocalisation GPS */}
        <div className="card-glass p-6 space-y-4 border border-border">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Share2 className="w-4 h-4 text-primary" /> 5. Réseaux Sociaux & Localisation GPS sur la Carte Interactive
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Lien Page Facebook</label>
              <Input value={sFacebook} onChange={e => setSFacebook(e.target.value)} placeholder="https://facebook.com/..." />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Compte Instagram</label>
              <Input value={sInstagram} onChange={e => setSInstagram(e.target.value)} placeholder="https://instagram.com/..." />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Site Web / Portfolio</label>
              <Input value={sWebsite} onChange={e => setSWebsite(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <LocationPicker
              latitude={sLatitude}
              longitude={sLongitude}
              city={sCity}
              onChange={({ latitude, longitude, city }) => {
                setSLatitude(latitude)
                setSLongitude(longitude)
                if (city) setSCity(city)
              }}
              label="Position GPS exacte de la Boutique sur la Carte"
            />
          </div>
        </div>

        {/* Bouton de Sauvegarde */}
        <div className="flex justify-end pt-2">
          <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-lg shadow-primary/20">
            <Check className="w-4 h-4 mr-2" /> Enregistrer les Personnalisations de la Boutique
          </Button>
        </div>
      </form>
    </div>
  )
}
