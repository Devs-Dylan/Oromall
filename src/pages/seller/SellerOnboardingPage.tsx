import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Store, ShieldCheck, CheckCircle2, ArrowRight, User, Image,
  MapPin, Navigation, Building2, Clock, AlertCircle, Phone, MessageSquare, Sparkles, Check
} from 'lucide-react'
import { ShopAPI, ActivationAPI } from '@/lib/store'
import { CITIES_CAMEROON, CATEGORIES } from '@/types'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { ImageUploadField } from '@/components/ui/ImageUploadField'
import { useAuth } from '@/hooks/useAuth'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { getSmartGeolocation, CAMEROON_CITY_COORDS } from '@/lib/geolocation'

export default function SellerOnboardingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Vérifier si une demande est déjà en attente pour cet utilisateur
  const existingActivation = useMemo(() => {
    if (!user) return null
    return ActivationAPI.filter(a => a.user_email === user.email || (a.user_id && a.user_id === user.id))[0] || null
  }, [user])

  const existingShop = useMemo(() => {
    if (!user) return null
    return ShopAPI.filter(s => s.owner_email === user.email || s.owner_id === user.id)[0] || null
  }, [user])

  const [activityType, setActivityType] = useState<'seller' | 'bailleur' | 'both'>('seller')
  const [shopName, setShopName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Électronique')
  const [city, setCity] = useState('Yaoundé')
  const [whatsapp, setWhatsapp] = useState(user?.phone || user?.mtn_number || user?.orange_number || '')
  const [mtnNumber, setMtnNumber] = useState(user?.mtn_number || '')
  const [orangeNumber, setOrangeNumber] = useState(user?.orange_number || '')
  const [paymentMethod, setPaymentMethod] = useState<'mtn' | 'orange'>('mtn')
  const [profileImage, setProfileImage] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false)

  // Mettre à jour la catégorie par défaut quand le type d'activité change
  const handleActivityTypeChange = (type: 'seller' | 'bailleur' | 'both') => {
    setActivityType(type)
    if (type === 'bailleur') {
      setCategory('Logement Étudiant')
    } else if (type === 'seller') {
      setCategory('Électronique')
    } else {
      setCategory('Commerce Général & Logements')
    }
  }

  const handleGeolocate = async () => {
    toastSuccess('Recherche de localisation...', 'Tentative de détection GPS et réseau...')
    try {
      const result = await getSmartGeolocation(city)
      setLatitude(result.latitude.toString())
      setLongitude(result.longitude.toString())
      toastSuccess('Localisation réussie ! 📍', result.message)
    } catch (err: any) {
      toastError('Erreur de localisation', err?.message || 'Impossible de récupérer la position.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toastError('Vous devez être connecté pour soumettre ce formulaire.')
      navigate('/login')
      return
    }
    if (!shopName.trim() || !whatsapp.trim()) {
      toastError('Veuillez renseigner le nom et le numéro WhatsApp.')
      return
    }

    setLoading(true)
    await new Promise(r => setTimeout(r, 700))

    // 1. Création de la boutique ou de l'agence immobilière en statut "pending"
    const newShop = ShopAPI.create({
      name: shopName.trim(),
      description: description.trim() || (activityType === 'bailleur' ? 'Agence / Bailleur immobilier certifié' : 'Boutique certifiée sur OroMall.'),
      owner_name: user.name || (activityType === 'bailleur' ? 'Bailleur' : 'Vendeur'),
      owner_email: user.email,
      owner_id: user.id,
      shop_type: 'individual',
      status: 'pending', // Validation manuelle admin requise
      category,
      city,
      address: city,
      whatsapp_number: whatsapp.trim(),
      mtn_number: mtnNumber.trim() || undefined,
      orange_number: orangeNumber.trim() || undefined,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      profile_image: profileImage || undefined,
      cover_image: coverImage || undefined,
    })

    // 2. Création de la demande d'adhésion officielle
    ActivationAPI.create({
      user_id: user.id,
      user_name: user.name || (activityType === 'bailleur' ? 'Bailleur' : 'Vendeur'),
      user_email: user.email,
      shop_name: shopName.trim(),
      shop_id: newShop.id,
      shop_type: 'individual',
      activity_type: activityType,
      category,
      city,
      whatsapp_number: whatsapp.trim(),
      mtn_number: mtnNumber.trim() || undefined,
      orange_number: orangeNumber.trim() || undefined,
      description: description.trim(),
      payment_method: paymentMethod,
      amount: 1000,
      status: 'pending', // En attente de validation par l'administrateur
    })

    setLoading(false)
    setIsSubmittedSuccess(true)
    toastSuccess(
      'Formulaire soumis avec succès !',
      activityType === 'bailleur'
        ? 'Votre dossier de Bailleur est en cours de révision par l\'administration.'
        : 'Votre dossier de Vendeur est en cours de révision par l\'administration.'
    )
  }

  // Écran : Demande déjà validée / Boutique déjà active
  if (user?.account_type === 'seller' && existingShop?.status === 'active') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Votre espace professionnel est actif !</h1>
          <p className="text-sm text-muted-foreground">
            Votre établissement <strong>"{existingShop.name}"</strong> est validé et opérationnel sur OroMall.
          </p>
        </div>
        <div className="pt-4 flex justify-center gap-4">
          <Link to="/seller" className="px-6 py-3 rounded-xl bg-primary text-black font-bold text-sm shadow hover:bg-primary/90 transition-all">
            Accéder à mon Dashboard →
          </Link>
        </div>
      </div>
    )
  }

  // Écran : Demande en cours d'examen (suite à soumission ou historique)
  if (isSubmittedSuccess || (existingActivation && existingActivation.status === 'pending')) {
    const act = existingActivation || {
      shop_name: shopName,
      city,
      whatsapp_number: whatsapp,
      activity_type: activityType,
      created_date: new Date().toISOString(),
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="card-glass p-8 md:p-10 space-y-6 text-center shadow-2xl border-amber-500/30">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="badge-primary bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs px-3 py-1">
              Dossier soumis • Examen en cours
            </span>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-foreground">
              Demande d'adhésion en cours de validation
            </h1>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Votre dossier pour <strong>"{act.shop_name}"</strong> a bien été transmis aux administrateurs OroMall.
              Chaque candidature de {act.activity_type === 'bailleur' ? 'bailleur' : 'vendeur'} fait l'objet d'une vérification manuelle pour la sécurité de nos utilisateurs.
            </p>
          </div>

          <div className="card-glass p-5 rounded-2xl bg-card/60 text-left space-y-2.5 text-xs text-muted-foreground border border-border">
            <div className="flex justify-between border-b border-border/40 pb-2">
              <span className="font-medium">Demandeur :</span>
              <span className="font-bold text-foreground">{user?.name} ({user?.email})</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-2">
              <span className="font-medium">
                {act.activity_type === 'bailleur' ? 'Résidence / Agence :' : 'Boutique / Enseigne :'}
              </span>
              <span className="font-bold text-foreground">{act.shop_name}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-2">
              <span className="font-medium">Profil demandé :</span>
              <span className="font-bold text-amber-500 uppercase">
                {act.activity_type === 'bailleur' ? '🏠 Bailleur (Immobilier & Chambres)' : act.activity_type === 'both' ? '🌟 Mixte (Boutique & Logements)' : '🛍️ Vendeur (Boutique Marchandise)'}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-2">
              <span className="font-medium">Ville de base :</span>
              <span className="font-bold text-foreground">{act.city || city}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">WhatsApp professionnel :</span>
              <span className="font-bold text-foreground">{act.whatsapp_number || whatsapp}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 space-y-1 text-left">
            <p className="font-bold flex items-center gap-1.5 text-blue-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> Délai moyen de traitement
            </p>
            <p>Nos administrateurs valident les demandes sous 2 à 24 heures. Dès validation, votre console et vos droits de publication seront automatiquement activés.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <a
              href={`https://wa.me/237680195221?text=${encodeURIComponent(`Bonjour, j'ai soumis ma demande d'adhésion ${act.activity_type === 'bailleur' ? 'Bailleur' : 'Vendeur'} pour "${act.shop_name}" sur OroMall et je souhaite un suivi.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> Contacter l'administration sur WhatsApp
            </a>
            <Link
              to="/"
              className="px-5 py-3 rounded-xl bg-card border border-border text-foreground font-bold text-xs hover:bg-muted flex items-center justify-center transition-colors"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Écran : Formulaire d'adhésion avec adaptation dynamique
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-200">
      
      {/* Header dynamique */}
      <div className="text-center space-y-3">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-lg ${
          activityType === 'bailleur'
            ? 'bg-blue-500 text-white shadow-blue-500/20'
            : activityType === 'both'
            ? 'bg-purple-600 text-white shadow-purple-500/20'
            : 'bg-gradient-to-tr from-amber-500 to-amber-400 text-black shadow-amber-500/20'
        }`}>
          {activityType === 'bailleur' ? <Building2 className="w-7 h-7" /> : activityType === 'both' ? <Sparkles className="w-7 h-7" /> : <Store className="w-7 h-7" />}
        </div>

        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-foreground">
          {activityType === 'bailleur'
            ? "Formulaire d'adhésion Bailleur (Immobilier)"
            : activityType === 'both'
            ? "Formulaire d'adhésion Vendeur & Bailleur (Mixte)"
            : "Formulaire d'adhésion Vendeur (Boutique)"
          }
        </h1>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
          {activityType === 'bailleur'
            ? "Remplissez ce dossier pour enregistrer votre profil de bailleur et publier vos logements, studios et chambres d'étudiants."
            : activityType === 'both'
            ? "Remplissez ce dossier pour ouvrir votre boutique et publier simultanément vos offres de logements."
            : "Remplissez ce dossier pour ouvrir votre vitrine en ligne et vendre vos articles et fournitures sur OroMall."
          }
        </p>
      </div>

      <div className="card-glass p-6 md:p-8 space-y-6 shadow-xl border border-border">
        
        {/* Choix du type d'activité (Boutons interactifs) */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-foreground">
            1. Sélectionnez votre domaine d'activité <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Option Vendeur */}
            <button
              type="button"
              onClick={() => handleActivityTypeChange('seller')}
              className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between space-y-2 ${
                activityType === 'seller'
                  ? 'border-amber-500 bg-amber-500/10 shadow-md ring-1 ring-amber-500/30'
                  : 'border-border/80 bg-card hover:bg-muted'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-foreground">Vendeur uniquement</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Boutique de produits, marchandises & fournitures</p>
              </div>
            </button>

            {/* Option Bailleur */}
            <button
              type="button"
              onClick={() => handleActivityTypeChange('bailleur')}
              className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between space-y-2 ${
                activityType === 'bailleur'
                  ? 'border-blue-500 bg-blue-500/10 shadow-md ring-1 ring-blue-500/30'
                  : 'border-border/80 bg-card hover:bg-muted'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-foreground">Bailleur uniquement</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Location de chambres, studios & logements</p>
              </div>
            </button>

            {/* Option Mixte */}
            <button
              type="button"
              onClick={() => handleActivityTypeChange('both')}
              className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between space-y-2 ${
                activityType === 'both'
                  ? 'border-purple-500 bg-purple-500/10 shadow-md ring-1 ring-purple-500/30'
                  : 'border-border/80 bg-card hover:bg-muted'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-500 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-xs text-foreground">Vendeur & Bailleur</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Vente de produits ET gestion de logements</p>
              </div>
            </button>

          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          
          {/* Nom de la structure */}
          <Input
            label={
              activityType === 'bailleur'
                ? "Nom de la Résidence, Immeuble ou Agence Immobilière *"
                : activityType === 'both'
                ? "Nom commercial de votre établissement (Boutique & Immobilier) *"
                : "Nom de votre boutique / enseigne commerciale *"
            }
            placeholder={
              activityType === 'bailleur'
                ? "Ex: Résidences Universitaires Ngoa-Ekellé, SCI Prestige..."
                : activityType === 'both'
                ? "Ex: Groupe Horizon (Fournitures & Chambres)..."
                : "Ex: TechHub Informatique, Mode & Style..."
            }
            required
            value={shopName}
            onChange={e => setShopName(e.target.value)}
          />

          {/* Catégorie & Ville */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={
                activityType === 'bailleur'
                  ? "Type de biens immobiliers proposés *"
                  : activityType === 'both'
                  ? "Secteur principal *"
                  : "Catégorie principale de produits *"
              }
              value={category}
              onChange={e => setCategory(e.target.value)}
              options={
                activityType === 'bailleur'
                  ? [
                      { value: 'Logement Étudiant', label: 'Logement Étudiant' },
                      { value: 'Studio Moderne', label: 'Studio Moderne' },
                      { value: 'Chambre Meublée', label: 'Chambre Meublée' },
                      { value: 'Cité Universitaire', label: 'Cité Universitaire' },
                      { value: 'Appartement', label: 'Appartement' },
                      { value: 'Autre Immobilier', label: 'Autre Immobilier' },
                    ]
                  : activityType === 'both'
                  ? [
                      { value: 'Commerce Général & Logements', label: 'Commerce Général & Logements' },
                      { value: 'Informatique & Chambres Étudiantes', label: 'Informatique & Chambres Étudiantes' },
                      { value: 'Multi-activités', label: 'Multi-activités' },
                    ]
                  : CATEGORIES.filter(c => c !== 'Toutes').map(c => ({ value: c, label: c }))
              }
            />
            <Select
              label="Ville de localisation *"
              value={city}
              onChange={e => setCity(e.target.value)}
              options={CITIES_CAMEROON.map(c => ({ value: c, label: c }))}
            />
          </div>

          {/* Localisation GPS avec repli */}
          <div className="card-glass p-4 space-y-3 border border-primary/20">
            <p className="text-xs font-bold text-primary flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {activityType === 'bailleur'
                ? "Localisation précise de la résidence sur la carte"
                : "Localisation précise de la boutique sur la carte"
              }
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Latitude (optionnel)"
                type="number"
                step="any"
                placeholder="Ex: 3.868"
                value={latitude}
                onChange={e => setLatitude(e.target.value)}
              />
              <Input
                label="Longitude (optionnel)"
                type="number"
                step="any"
                placeholder="Ex: 11.521"
                value={longitude}
                onChange={e => setLongitude(e.target.value)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGeolocate}
              className="w-full text-xs gap-1.5"
            >
              <Navigation className="w-4 h-4" /> Me géolocaliser automatiquement
            </Button>
          </div>

          {/* WhatsApp Professionnel */}
          <Input
            label={
              activityType === 'bailleur'
                ? "Numéro WhatsApp du Bailleur / Propriétaire (Requis pour contacts de visite) *"
                : activityType === 'both'
                ? "Numéro WhatsApp Professionnel (Commandes & Visites) *"
                : "Numéro WhatsApp Vendeur (Requis pour alertes commandes & chat client) *"
            }
            placeholder="Ex: 680195221"
            required
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
          />

          {/* Numéros de paiement Mobile Money */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={
                activityType === 'bailleur'
                  ? "Numéro MTN MoMo (perception loyers / forfaits)"
                  : "Numéro MTN MoMo (encaissement des ventes)"
              }
              placeholder="Ex: 680195221"
              value={mtnNumber}
              onChange={e => setMtnNumber(e.target.value)}
            />
            <Input
              label={
                activityType === 'bailleur'
                  ? "Numéro Orange Money (perception loyers / forfaits)"
                  : "Numéro Orange Money (encaissement des ventes)"
              }
              placeholder="Ex: 691576677"
              value={orangeNumber}
              onChange={e => setOrangeNumber(e.target.value)}
            />
          </div>

          {/* Description adaptée */}
          <Textarea
            label={
              activityType === 'bailleur'
                ? "Description de vos logements / résidences"
                : activityType === 'both'
                ? "Description de vos activités (Boutique & Logements)"
                : "Description de votre boutique & de vos produits"
            }
            rows={3}
            placeholder={
              activityType === 'bailleur'
                ? "Décrivez les types de chambres ou studios proposés, commodités (forage, gardien 24h, compteur individuel, proximité du campus)..."
                : activityType === 'both'
                ? "Présentez ce que vous vendez et vos offres de logements..."
                : "Présentez vos types d'articles, marques, garanties, modalités de livraison..."
            }
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          {/* Photos adaptées dynamiquement (Devanture Résidence vs Devanture Boutique) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ImageUploadField
              label={
                activityType === 'bailleur'
                  ? "Photo de profil du Bailleur ou Logo de l'Agence"
                  : activityType === 'both'
                  ? "Photo de profil ou Logo de l'enseigne"
                  : "Logo de la boutique ou photo du propriétaire"
              }
              value={profileImage}
              onChange={setProfileImage}
            />
            <ImageUploadField
              label={
                activityType === 'bailleur'
                  ? "Photo de la devanture / façade de la résidence *"
                  : activityType === 'both'
                  ? "Photo de la devanture (boutique ou résidence) *"
                  : "Photo de la devanture de la boutique / du comptoir *"
              }
              value={coverImage}
              onChange={setCoverImage}
            />
          </div>

          {/* Alerte explicative */}
          <div className={`p-4 rounded-xl text-xs space-y-1 border ${
            activityType === 'bailleur'
              ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
          }`}>
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              {activityType === 'bailleur'
                ? "Vérification des informations de Bailleur"
                : "Processus de vérification OroMall"
              }
            </p>
            <p>
              {activityType === 'bailleur'
                ? "Nos équipes vérifient les coordonnées du bailleur et l'authenticité de la résidence avant activation pour garantir des visites sécurisées aux locataires."
                : "Après soumission, votre candidature sera examinée par nos administrateurs. Votre boutique et vos droits de publication seront activés dès validation."
              }
            </p>
          </div>

          {/* Bouton de soumission adapté */}
          <Button
            type="submit"
            loading={loading}
            className={`w-full justify-center py-3.5 text-sm font-bold shadow-lg ${
              activityType === 'bailleur'
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            {activityType === 'bailleur'
              ? "Soumettre mon dossier Bailleur (Immobilier)"
              : activityType === 'both'
              ? "Soumettre mon dossier Vendeur & Bailleur"
              : "Soumettre mon dossier Vendeur (Boutique)"
            }
          </Button>

        </form>
      </div>
    </div>
  )
}
