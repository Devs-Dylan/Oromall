import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Home, MapPin, Phone, MessageSquare, ArrowLeft,
  BedDouble, Bath, Maximize2, ShieldCheck, CheckCircle2,
  Calendar, Clock, User, Wifi, Zap, Droplet, Car, Tv, Wind, Check, Star
} from 'lucide-react'
import { HousingAPI, VisitBookingAPI, OrderAPI, ChatAPI, NotificationAPI } from '@/lib/store'
import { formatPrice, buildWhatsAppUrl, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { toastSuccess } from '@/components/ui/Toast'
import LeafletMap, { MapMarkerItem } from '@/components/shared/LeafletMap'

const AMENITY_ICONS: Record<string, { label: string; icon: any }> = {
  wifi: { label: 'Wifi Haut Débit', icon: Wifi },
  eau_gratuite: { label: 'Eau de forrage gratuite', icon: Droplet },
  groupe_electrogene: { label: 'Groupe Électrogène', icon: Zap },
  gardien: { label: 'Gardien 24h/24', icon: ShieldCheck },
  parking: { label: 'Parking Sécurisé', icon: Car },
  climatisation: { label: 'Climatisation', icon: Wind },
  tv: { label: 'Smart TV', icon: Tv },
  piscine: { label: 'Piscine Privée', icon: SparkleIcon },
}

function SparkleIcon(props: any) {
  return <Star {...props} />
}

export default function HousingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const housing = HousingAPI.get(id || '')

  const [selectedImage, setSelectedImage] = useState<string>(housing?.image_url || '')
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
    <div className="min-h-screen pb-16 space-y-8 max-w-7xl mx-auto px-4 pt-6">

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
          <div className="card-glass p-6 grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <Maximize2 className="w-5 h-5 text-emerald-400 mx-auto" />
              <p className="text-xs text-muted-foreground">Superficie</p>
              <p className="font-bold text-foreground text-sm">{housing.surface_sqm} m²</p>
            </div>
            <div className="space-y-1 border-x border-border">
              <BedDouble className="w-5 h-5 text-emerald-400 mx-auto" />
              <p className="text-xs text-muted-foreground">Chambres</p>
              <p className="font-bold text-foreground text-sm">{housing.bedrooms} chambre(s)</p>
            </div>
            <div className="space-y-1">
              <Bath className="w-5 h-5 text-emerald-400 mx-auto" />
              <p className="text-xs text-muted-foreground">Salles de bain</p>
              <p className="font-bold text-foreground text-sm">{housing.bathrooms} douche(s)</p>
            </div>
          </div>

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
                    customer_email: user?.email || 'locataire@marcheplus.cm',
                    customer_phone: '680195221',
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
                    created_date: new Date().toISOString(),
                  })

                  toastSuccess('Chat plateforme ouvert !', 'Le bailleur recevra une notification système.')
                  navigate(`/orders?chat=${order.id}`)
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
              >
                <MessageSquare className="w-4 h-4" /> Contacter le Bailleur sur le Chat Interne 💬
              </Button>

              <Button
                onClick={() => setShowVisitModal(true)}
                variant="outline"
                className="w-full justify-center py-3 text-sm font-semibold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Calendar className="w-4 h-4" /> Demander une visite sur place
              </Button>
            </div>

            <div className="text-[11px] text-muted-foreground space-y-1.5 pt-2">
              <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Aucun frais de dossier caché</p>
              <p className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Visite accompagnée disponible</p>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Visit Modal */}
      {showVisitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card-glass max-w-lg w-full p-6 space-y-6 border-emerald-500/40 bg-card">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" /> Planifier une visite du logement
              </h3>
              <button onClick={() => setShowVisitModal(false)} className="text-muted-foreground hover:text-foreground font-bold text-lg">×</button>
            </div>

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
          </div>
        </div>
      )}
    </div>
  )
}
