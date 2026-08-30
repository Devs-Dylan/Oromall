import { useState } from 'react'
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Home, MapPin, Phone, MessageSquare, ArrowLeft,
  BedDouble, Bath, Maximize2, ShieldCheck, CheckCircle2,
  Calendar, Clock, User, Wifi, Zap, Droplet, Car, Tv, Wind, Check, Star,
  Flame, Sofa, UtensilsCrossed, CarFront, Warehouse, Building2,
  Landmark, PawPrint, Cigarette, School, Stethoscope, ShoppingCart, Bus, DollarSign
} from 'lucide-react'
import { HousingAPI, VisitBookingAPI, OrderAPI, ChatAPI, NotificationAPI, VisitRequestAPI } from '@/lib/store'
import { formatPrice, buildWhatsAppUrl, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toastSuccess } from '@/components/ui/Toast'
import LeafletMap, { MapMarkerItem } from '@/components/shared/LeafletMap'
import { useAuth } from '@/hooks/useAuth'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal'
import { VisitPackagesModal } from '@/components/housing/VisitPackagesModal'
import { VisitPaymentForm } from '@/components/housing/VisitPaymentForm'

const AMENITY_ICONS: Record<string, { label: string; icon: any }> = {
  wifi: { label: 'Wifi Haut Débit', icon: Wifi },
  eau_gratuite: { label: 'Eau de forage gratuite', icon: Droplet },
  groupe_electrogene: { label: 'Groupe Électrogène', icon: Zap },
  gardien: { label: 'Gardien 24h/24', icon: ShieldCheck },
  parking: { label: 'Parking Sécurisé', icon: Car },
  climatisation: { label: 'Climatisation', icon: Wind },
  tv: { label: 'Smart TV', icon: Tv },
  piscine: { label: 'Piscine Privée', icon: Star },
  terrasse: { label: 'Terrasse', icon: Home },
  jardin: { label: 'Jardin', icon: Check },
  cuisine_equipee: { label: 'Cuisine Équipée', icon: UtensilsCrossed },
  chauffage: { label: 'Chauffage', icon: Flame },
  lave_linge: { label: 'Machine à Laver', icon: Check },
  refrigerateur: { label: 'Réfrigérateur', icon: Check },
  salon_meuble: { label: 'Salon Meublé', icon: Sofa },
  securite_24h: { label: 'Sécurité 24h/24', icon: ShieldCheck },
  eau_ville: { label: 'Eau de Ville (CAMWATER)', icon: Droplet },
  electricite_solaire: { label: 'Énergie Solaire', icon: Zap },
  animaux_autorises: { label: 'Animaux Autorisés', icon: PawPrint },
  fumer_autorise: { label: 'Fumer Autorisé', icon: Cigarette },
  ecoles_proximite: { label: 'Écoles à Proximité', icon: School },
  hopitaux_proximite: { label: 'Hôpitaux à Proximité', icon: Stethoscope },
  marches_proximite: { label: 'Marchés à Proximité', icon: ShoppingCart },
  transport_public: { label: 'Transport Public', icon: Bus },
}

export default function HousingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { requireAuth, authModalOpen, closeAuthModal, modalMeta } = useRequireAuth()
  const housing = HousingAPI.get(id || '')

  const [selectedImage, setSelectedImage] = useState<string>(housing?.image_url || '')

  // New Visit Flow state
  const [showPackageModal, setShowPackageModal] = useState(searchParams.get('package') === 'single' || searchParams.get('package') === 'premium')
  const [selectedPackage, setSelectedPackage] = useState<'single' | 'premium' | null>(searchParams.get('package') as 'single' | 'premium' | null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  // Old visit modal state (keeping for backward compatibility if needed)
  const [showVisitModal, setShowVisitModal] = useState(false)

  // Visit Booking Form state
  const [visitorName, setVisitorName] = useState('')
  const [visitorPhone, setVisitorPhone] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [visitTime, setVisitTime] = useState('10:00')
  const [visitMessage, setVisitMessage] = useState('')

  if (!housing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground">Logement non trouvé</h2>
        <p className="text-muted-foreground mt-2">Ce logement n'est plus disponible ou a été retiré.</p>
        <Link to="/housing" className="btn-primary inline-flex mt-6"><ArrowLeft className="w-4 h-4" /> Retour aux logements</Link>
      </div>
    )
  }

  // Check if user has approved or pending visit requests for this housing
  const userVisits = user?.email
    ? VisitRequestAPI.filter(v =>
        v.housing_id === housing.id &&
        (v.visitor_email?.toLowerCase() === user.email.toLowerCase() ||
         Boolean(user.phone && v.visitor_phone === user.phone) ||
         Boolean(user.mtn_number && v.visitor_phone === user.mtn_number) ||
         Boolean(user.orange_number && v.visitor_phone === user.orange_number))
      )
    : []

  const approvedVisit = userVisits.find(v => v.status === 'approved' || v.status === 'completed')
  const pendingVisit = userVisits.find(v => v.status === 'pending')

  const imagesList = housing.images && housing.images.length > 0 ? housing.images : [housing.image_url]

  const mapMarker: MapMarkerItem[] = [{
    id: housing.id,
    title: housing.title,
    type: 'housing',
    latitude: housing.latitude,
    longitude: housing.longitude,
    price: `${formatPrice(housing.price)} / ${housing.price_type === 'day' ? 'jour' : 'mois'}`,
    subtitle: `${housing.city} • ${housing.neighborhood}`,
    image_url: housing.image_url,
  }]

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!visitorName || !visitorPhone || !visitDate) {
      alert('Veuillez remplir votre nom, téléphone et date de visite.')
      return
    }

    VisitBookingAPI.create({
      housing_id: housing.id,
      housing_title: housing.title,
      user_name: visitorName,
      user_phone: visitorPhone,
      user_email: visitorEmail || 'non-renseigne@client.cm',
      visit_date: visitDate,
      visit_time: visitTime,
      message: visitMessage,
      status: 'pending'
    })

    toastSuccess('Demande de visite enregistrée ! Le bailleur vous recontactera rapidement.')
    setShowVisitModal(false)
    setVisitorName('')
    setVisitorPhone('')
    setVisitMessage('')
  }

  return (
    <div className="min-h-screen pb-16 space-y-8 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 pt-6">

      {/* Top breadcrumb navigation */}
      <Link to="/housing" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Retour au catalogue des logements
      </Link>

      {/* Title & Price Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-primary capitalize bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Home className="w-3.5 h-3.5" /> {housing.category}
            </span>
            {housing.furnished && (
              <span className="badge-success bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Logement Meublé 🛋️
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-4xl font-display font-extrabold text-foreground">{housing.title}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-emerald-400" /> {housing.address || `${housing.neighborhood}, ${housing.city}`}
          </p>
        </div>

        <div className="card-glass p-4 text-right bg-emerald-950/20 border-emerald-500/30">
          <p className="text-xs text-muted-foreground">Loyer demandé</p>
          <p className="text-2xl md:text-3xl font-black text-emerald-400">{formatPrice(housing.price)}</p>
          <p className="text-xs text-muted-foreground">par {housing.price_type === 'day' ? 'jour' : 'mois'}</p>
        </div>
      </div>

      {/* Photo Gallery Grid */}
      <div className="space-y-3">
        <div className="aspect-[16/9] md:aspect-[21/9] rounded-3xl overflow-hidden bg-muted border border-border shadow-xl relative">
          <img
            src={selectedImage || housing.image_url}
            alt={housing.title}
            className="w-full h-full object-cover"
          />
        </div>

        {imagesList.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {imagesList.map((img: string, idx: number) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={cn(
                  "w-24 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all",
                  selectedImage === img ? "border-emerald-500 scale-105 shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <img src={img} alt={`Aperçu ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Details vs Contact & Visit Widget */}
      <div className="grid md:grid-cols-3 gap-8">

        {/* Left Column (Details, Specs, Amenities, Map) */}
        <div className="md:col-span-2 space-y-8">

          {/* Quick Specs summary */}
          <div className="card-glass p-6 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
            <div className="space-y-1">
              <Maximize2 className="w-5 h-5 text-emerald-400 mx-auto" />
              <p className="text-xs text-muted-foreground">Surface</p>
              <p className="font-bold text-foreground text-sm">{housing.surface_sqm} m²</p>
            </div>
            <div className="space-y-1 border-x border-border">
              <BedDouble className="w-5 h-5 text-emerald-400 mx-auto" />
              <p className="text-xs text-muted-foreground">Chambres</p>
              <p className="font-bold text-foreground text-sm">{housing.bedrooms}</p>
            </div>
            <div className="space-y-1">
              <Bath className="w-5 h-5 text-emerald-400 mx-auto" />
              <p className="text-xs text-muted-foreground">SDB</p>
              <p className="font-bold text-foreground text-sm">{housing.bathrooms}</p>
            </div>
            <div className="space-y-1 border-x border-border">
              <Home className="w-5 h-5 text-emerald-400 mx-auto" />
              <p className="text-xs text-muted-foreground">Salons</p>
              <p className="font-bold text-foreground text-sm">{housing.living_rooms || 0}</p>
            </div>
            <div className="space-y-1">
              <UtensilsCrossed className="w-5 h-5 text-emerald-400 mx-auto" />
              <p className="text-xs text-muted-foreground">Cuisines</p>
              <p className="font-bold text-foreground text-sm">{housing.kitchens || 0}</p>
            </div>
            <div className="space-y-1">
              <Car className="w-5 h-5 text-emerald-400 mx-auto" />
              <p className="text-xs text-muted-foreground">Parking</p>
              <p className="font-bold text-foreground text-sm">{housing.parking_spaces || 0}</p>
            </div>
          </div>

          {/* Property Details */}
          <div className="card-glass p-6 space-y-3">
            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Détails du Bien
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div><span className="text-muted-foreground">Type:</span> <span className="font-semibold text-foreground capitalize">{housing.property_type}</span></div>
              <div><span className="text-muted-foreground">Statut juridique:</span> <span className="font-semibold text-foreground capitalize">{housing.legal_status?.replace('_', ' ')}</span></div>
              <div><span className="text-muted-foreground">Occupation:</span> <span className="font-semibold text-foreground capitalize">{housing.occupancy_status}</span></div>
              {housing.year_built && <div><span className="text-muted-foreground">Année:</span> <span className="font-semibold text-foreground">{housing.year_built}</span></div>}
              {housing.floor_number && <div><span className="text-muted-foreground">Étage:</span> <span className="font-semibold text-foreground">{housing.floor_number}</span></div>}
              {housing.lot_size_sqm && <div><span className="text-muted-foreground">Terrain:</span> <span className="font-semibold text-foreground">{housing.lot_size_sqm} m²</span></div>}
              <div><span className="text-muted-foreground">Balcons:</span> <span className="font-semibold text-foreground">{housing.balconies || 0}</span></div>
              <div><span className="text-muted-foreground">Rangements:</span> <span className="font-semibold text-foreground">{housing.storage_rooms || 0}</span></div>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="card-glass p-6 space-y-3">
            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Conditions Financières
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div><span className="text-muted-foreground">Loyer:</span> <span className="font-semibold text-foreground">{formatPrice(housing.price)}</span></div>
              {housing.deposit_amount > 0 && <div><span className="text-muted-foreground">Caution:</span> <span className="font-semibold text-foreground">{formatPrice(housing.deposit_amount)}</span></div>}
              <div><span className="text-muted-foreground">Fréquence:</span> <span className="font-semibold text-foreground capitalize">{housing.payment_frequency}</span></div>
              <div><span className="text-muted-foreground">Négociable:</span> <span className="font-semibold text-foreground">{housing.price_negotiable ? 'Oui' : 'Non'}</span></div>
            </div>
          </div>

          {/* Availability */}
          <div className="card-glass p-6 space-y-3">
            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Disponibilité
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              {housing.available_from && <div><span className="text-muted-foreground">Disponible à partir de:</span> <span className="font-semibold text-foreground">{new Date(housing.available_from).toLocaleDateString('fr-FR')}</span></div>}
              <div><span className="text-muted-foreground">Durée minimum:</span> <span className="font-semibold text-foreground">{housing.minimum_stay_months} mois</span></div>
              <div><span className="text-muted-foreground">Animaux:</span> <span className="font-semibold text-foreground">{housing.pets_allowed ? 'Autorisés' : 'Non autorisés'}</span></div>
              <div><span className="text-muted-foreground">Fumer:</span> <span className="font-semibold text-foreground">{housing.smoking_allowed ? 'Autorisé' : 'Interdit'}</span></div>
              {housing.viewing_times && <div><span className="text-muted-foreground">Visites:</span> <span className="font-semibold text-foreground">{housing.viewing_times}</span></div>}
            </div>
          </div>

          {/* Nearby */}
          {(housing.nearby_schools || housing.nearby_hospitals || housing.nearby_markets || housing.public_transport_access) && (
            <div className="card-glass p-6 space-y-3">
              <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Environnement
              </h3>
              <div className="flex flex-wrap gap-2">
                {housing.nearby_schools && <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">Écoles à proximité</span>}
                {housing.nearby_hospitals && <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">Hôpitaux à proximité</span>}
                {housing.nearby_markets && <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">Marchés à proximité</span>}
                {housing.public_transport_access && <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">Transport public</span>}
              </div>
            </div>
          )}

          {/* Media */}
          {(housing.video_url || housing.property_documents_url) && (
            <div className="card-glass p-6 space-y-3">
              <h3 className="font-bold text-foreground text-lg">Médias & Documents</h3>
              {housing.video_url && (
                <a href={housing.video_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  📹 Voir la vidéo du logement
                </a>
              )}
              {housing.property_documents_url && (
                <a href={housing.property_documents_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  📄 Documents du bien (titre foncier, permis...)
                </a>
              )}
            </div>
          )}

          {/* Description */}
          <div className="card-glass p-6 space-y-3">
            <h3 className="font-bold text-foreground text-lg">Description complète du logement</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{housing.description}</p>
          </div>

          {/* Amenities & Equipments */}
          <div className="card-glass p-6 space-y-4">
            <h3 className="font-bold text-foreground text-lg">Équipements & Confort inclus</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {housing.amenities.map((key: string) => {
                const item = AMENITY_ICONS[key] || { label: key, icon: CheckCircle2 }
                const IconComp = item.icon
                return (
                  <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-xs font-semibold text-foreground">
                    <IconComp className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Geolocation Map */}
          <div className="card-glass p-6 space-y-4">
            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" /> Emplacement sur la carte
            </h3>
            <LeafletMap markers={mapMarker} center={[housing.latitude, housing.longitude]} zoom={14} height="350px" />
          </div>
        </div>

        {/* Right Column: Owner info & Visit Booking widget */}
        <div className="space-y-6">
          <div className="card-glass p-6 space-y-6 sticky top-24 border-emerald-500/30 bg-emerald-950/10">

            <div className="space-y-3 pb-6 border-b border-border">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Contact Agent / Bailleur</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-lg border border-emerald-500/30">
                  {housing.owner_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">{housing.owner_name}</h4>
                  <p className="text-xs text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> Propriétaire Vérifié</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {approvedVisit ? (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs">
                    <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Visite validée par l'administration ✅
                    </p>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                      Les coordonnées directes du bailleur sont désormais débloquées pour vous.
                    </p>
                  </div>

                  {housing.whatsapp_number && (
                    <a
                      href={buildWhatsAppUrl(housing.whatsapp_number, `Bonjour ${housing.owner_name}, ma visite pour le logement "${housing.title}" (${formatPrice(housing.price)}) a été approuvée sur MarchéPlus. Pouvons-nous échanger ?`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
                    >
                      <MessageSquare className="w-4 h-4" /> Contacter le Bailleur (WhatsApp) 🟢
                    </a>
                  )}

                  {housing.owner_phone && (
                    <a
                      href={`tel:${housing.owner_phone}`}
                      className="w-full py-2.5 rounded-xl bg-card border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Phone className="w-4 h-4" /> Appeler le Bailleur : {housing.owner_phone}
                    </a>
                  )}

                  <Button
                    onClick={() => {
                      const pin = Math.floor(1000 + Math.random() * 9000).toString()
                      const order = OrderAPI.create({
                        shop_id: 'housing-owner',
                        shop_name: housing.owner_name,
                        product_name: housing.title,
                        product_price: housing.price,
                        total: housing.price,
                        customer_name: user?.name || 'Locataire',
                        customer_email: user?.email || '',
                        customer_phone: user?.mtn_number || user?.orange_number || '',
                        status: 'pending_payment',
                        pin_code: pin,
                      })

                      ChatAPI.create({
                        order_id: order.id,
                        sender_role: 'customer',
                        sender_name: user?.name || 'Locataire',
                        message: `Bonjour ${housing.owner_name}, je suis très intéressé(e) par la location du logement "${housing.title}" (${formatPrice(housing.price)}).`,
                      })

                      NotificationAPI.create({
                        shop_id: 'housing-owner',
                        title: `Demande de Location - ${housing.title}`,
                        message: `${user?.name || 'Un locataire'} souhaite discuter avec vous sur le chat interne.`,
                        type: 'chat',
                        read: false,
                      })

                      toastSuccess('Chat plateforme ouvert !', 'Le bailleur recevra une notification système.')
                      navigate(`/orders?chat=${order.id}`)
                    }}
                    variant="outline"
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-foreground border-border flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-primary" /> Chat Interne Plateforme
                  </Button>
                </div>
              ) : pendingVisit ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1.5">
                    <p className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" /> Demande de visite en attente ⏳
                    </p>
                    <p className="text-muted-foreground text-[11px]">
                      Votre demande ({pendingVisit.package_label}) est en cours de validation par nos administrateurs. Dès approbation, les boutons WhatsApp et téléphone du bailleur s'afficheront ici.
                    </p>
                    <Link to="/orders" className="text-primary font-bold text-[11px] hover:underline block pt-1">
                      Suivre dans mes demandes de visite →
                    </Link>
                  </div>

                  <Button
                    onClick={() => {
                      requireAuth(() => setShowPackageModal(true), {
                        title: 'Commander une autre visite',
                        description: 'Connectez-vous pour choisir un forfait et planifier votre créneau avec le bailleur.',
                      })
                    }}
                    variant="outline"
                    className="w-full justify-center py-2.5 text-xs font-semibold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Calendar className="w-4 h-4" /> Commander une autre visite
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      🔒 Coordonnées protégées
                    </p>
                    <p>Réservez un forfait de visite pour débloquer le contact direct avec le bailleur et sécuriser votre visite.</p>
                  </div>

                  <Button
                    onClick={() => {
                      requireAuth(() => setShowPackageModal(true), {
                        title: 'Demander une visite',
                        description: 'Connectez-vous à votre compte pour choisir un forfait de visite et contacter le bailleur.',
                      })
                    }}
                    className="w-full justify-center py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4" /> Demander une visite sur place
                  </Button>
                </div>
              )}
            </div>

            <div className="text-[11px] text-muted-foreground space-y-1.5 pt-2">
              <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Aucun frais d'agence caché</p>
              <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Visite accompagnée disponible</p>
            </div>
          </div>
        </div>
      </div>

      {/* Visit Packages Modal */}
      <VisitPackagesModal
        open={showPackageModal}
        onClose={() => { setShowPackageModal(false); setSelectedPackage(null) }}
        onSelect={(pkg) => {
          setSelectedPackage(pkg)
          setShowPackageModal(false)
          setShowPaymentForm(true)
        }}
      />

      {/* Visit Payment & Schedule Form */}
      {selectedPackage && (
        <VisitPaymentForm
          open={showPaymentForm}
          onClose={() => { setShowPaymentForm(false); setSelectedPackage(null) }}
          housingId={housing.id}
          housingTitle={housing.title}
          housingCity={housing.city}
          housingImage={housing.image_url}
          visitorName={user?.name || visitorName}
          visitorEmail={user?.email || visitorEmail || 'non-renseigne@client.cm'}
          visitorPhone={user?.mtn_number || user?.orange_number || visitorPhone}
          selectedPackage={selectedPackage}
          onSuccess={() => {
            setShowPaymentForm(false)
            setSelectedPackage(null)
          }}
        />
      )}

      {/* Legacy Visit Modal (kept for backward compatibility) */}
      <Modal open={showVisitModal} onClose={() => setShowVisitModal(false)} title="Planifier une visite du logement" size="md">
        <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-foreground">Votre nom complet *</label>
            <input
              type="text"
              required
              placeholder="ex: Dylan Fotso"
              value={visitorName}
              onChange={e => setVisitorName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Téléphone WhatsApp *</label>
              <input
                type="tel"
                required
                placeholder="677 00 00 00"
                value={visitorPhone}
                onChange={e => setVisitorPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Email (optionnel)</label>
              <input
                type="email"
                placeholder="client@email.cm"
                value={visitorEmail}
                onChange={e => setVisitorEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Date souhaitée *</label>
              <input
                type="date"
                required
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:border-emerald-500 focus:outline-none text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Heure *</label>
              <select
                value={visitTime}
                onChange={e => setVisitTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:border-emerald-500 focus:outline-none text-foreground"
              >
                <option value="09:00">09h00</option>
                <option value="11:00">11h00</option>
                <option value="14:00">14h00</option>
                <option value="16:00">16h00</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground">Message pour l'agent (optionnel)</label>
            <textarea
              rows={3}
              placeholder="Précisions sur vos attentes..."
              value={visitMessage}
              onChange={e => setVisitMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowVisitModal(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Confirmer ma réservation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Global Auth Barrier Modal for Unconnected Visitors */}
      <AuthRequiredModal
        open={authModalOpen}
        onClose={closeAuthModal}
        title={modalMeta.title}
        description={modalMeta.description}
        actionName={modalMeta.actionName}
      />
    </div>
  )
}
