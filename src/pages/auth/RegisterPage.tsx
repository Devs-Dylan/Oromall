import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  UserPlus, User, Store, ArrowRight, ArrowLeft, CheckCircle2,
  GraduationCap, Building2, Sparkles, Phone, ShieldCheck, Mail, Lock, Eye, EyeOff, Check, Zap, ShoppingBag, FileText
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { TermsModal } from '@/components/auth/TermsModal'
import type { AccountType } from '@/types'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  // Étape 1 : Choix du type de compte (Client / Étudiant OU Vendeur / Bailleur)
  // Étape 2 : Renseignement des informations du compte
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<AccountType>('client')

  // Champs du formulaire
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [mtnNumber, setMtnNumber] = useState('')
  const [orangeNumber, setOrangeNumber] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(true)
  const [termsModalOpen, setTermsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password) {
      toastError('Champs obligatoires', 'Veuillez remplir tous les champs obligatoires.')
      return
    }

    if (password.length < 6) {
      toastError('Mot de passe trop court', 'Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    if (!acceptTerms) {
      toastError('Conditions requises', 'Veuillez accepter les conditions d\'utilisation.')
      return
    }

    setLoading(true)
    try {
      await register(name.trim(), email.trim(), password, selectedRole, {
        phone: phone.trim() || undefined,
        mtn_number: mtnNumber.trim() || undefined,
        orange_number: orangeNumber.trim() || undefined,
      })

      if (selectedRole === 'seller') {
        toastSuccess('Compte créé !', 'Passons maintenant à la configuration de votre dossier Vendeur / Bailleur.')
        navigate('/seller/onboarding')
      } else {
        toastSuccess('Bienvenue sur OroMall !', 'Votre compte Client / Étudiant est prêt.')
        navigate('/')
      }
    } catch (err: any) {
      toastError('Erreur d\'inscription', err?.message || 'Une erreur est survenue lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      {/* Lumières décoratives d'arrière-plan */}
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="w-full max-w-5xl rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* ================= GAUCHE : BANDEAU IMMERSIF (Desktop uniquement) ================= */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/90 text-white p-8 sm:p-10 flex-col justify-between relative overflow-hidden border-r border-amber-500/20">
          
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-primary/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-amber-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* En-tête marque */}
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-primary text-black font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-300/40">
                OM
              </div>
              <div>
                <span className="font-display font-black text-xl tracking-tight text-white flex items-center gap-1.5">
                  OroMall
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-400/30">
                    GOLD
                  </span>
                </span>
                <p className="text-[11px] text-slate-400">Rejoignez la communauté n°1 au Cameroun</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-white leading-tight">
                Une seule inscription, une infinité d'opportunités
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Que vous soyez acheteur, étudiant en quête d'un logement ou commerçant souhaitant digitaliser son activité, OroMall est fait pour vous.
              </p>
            </div>
          </div>

          {/* Timeline étapes d'inscription */}
          <div className="space-y-4 my-8 relative z-10">
            <div className="flex items-start gap-3.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                step === 1 ? 'bg-primary text-black ring-4 ring-primary/20' : 'bg-emerald-500 text-white'
              }`}>
                {step === 2 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div>
                <p className={`text-xs font-bold ${step === 1 ? 'text-amber-400' : 'text-white'}`}>
                  Étape 1 : Choix de votre profil
                </p>
                <p className="text-[11px] text-slate-400">Client / Étudiant ou Vendeur / Bailleur</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                step === 2 ? 'bg-primary text-black ring-4 ring-primary/20' : 'bg-white/10 text-slate-400'
              }`}>
                2
              </div>
              <div>
                <p className={`text-xs font-bold ${step === 2 ? 'text-amber-400' : 'text-slate-400'}`}>
                  Étape 2 : Vos identifiants sécurisés
                </p>
                <p className="text-[11px] text-slate-400">Informations de contact et paiements MoMo</p>
              </div>
            </div>
          </div>

          {/* Pied de page gauche */}
          <div className="pt-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between relative z-10">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Données 100% Chiffrées
            </span>
            <span>Cameroun 🇨🇲</span>
          </div>

        </div>

        {/* ================= DROITE : CONTENU ÉTAPES ================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center space-y-6">
          
          {/* Logo compact visible uniquement sur mobile & tablette */}
          <div className="flex lg:hidden items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-primary text-black font-black text-base flex items-center justify-center shadow-md">
              OM
            </div>
            <div>
              <span className="font-display font-black text-base tracking-tight text-foreground">
                OroMall <span className="text-[10px] uppercase font-bold text-amber-500">GOLD</span>
              </span>
            </div>
          </div>
          
          {/* ================= ÉTAPE 1 : CHOIX DU PROFIL ================= */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="space-y-1.5">
                <span className="badge-primary text-[11px] px-2.5 py-0.5">
                  Étape 1 sur 2
                </span>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight">
                  Quel est votre profil ?
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Sélectionnez l'usage principal de votre compte. Vous pourrez toujours faire évoluer votre profil plus tard.
                </p>
              </div>

              {/* Cartes de sélection de profil */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. CARTE CLIENT / ÉTUDIANT */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('client')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between space-y-4 group ${
                    selectedRole === 'client'
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg ring-2 ring-blue-500/20'
                      : 'border-border/80 bg-card hover:border-border hover:bg-muted/50'
                  }`}
                >
                  {selectedRole === 'client' && (
                    <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                        Acheteur & Locataire
                      </span>
                      <h3 className="font-bold text-base text-foreground mt-1.5">
                        Client / Étudiant
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Pour faire des achats, commander des articles et trouver une chambre ou un studio.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <ShoppingBag className="w-3.5 h-3.5 text-blue-500" /> Achat & commande en ligne
                    </div>
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <Building2 className="w-3.5 h-3.5 text-blue-500" /> Visite de logements & cités
                    </div>
                  </div>
                </button>

                {/* 2. CARTE VENDEUR / BAILLEUR */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('seller')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between space-y-4 group ${
                    selectedRole === 'seller'
                      ? 'border-amber-500 bg-amber-500/10 shadow-lg ring-2 ring-amber-500/20'
                      : 'border-border/80 bg-card hover:border-border hover:bg-muted/50'
                  }`}
                >
                  {selectedRole === 'seller' && (
                    <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                        Professionnel
                      </span>
                      <h3 className="font-bold text-base text-foreground mt-1.5">
                        Vendeur / Bailleur
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Pour vendre vos produits ou louer vos chambres, studios et résidences.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/40 text-[11px] text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <Store className="w-3.5 h-3.5 text-amber-500" /> Vitrine & gestion de boutique
                    </div>
                    <div className="flex items-center gap-1.5 text-foreground font-medium">
                      <Building2 className="w-3.5 h-3.5 text-amber-500" /> Annonces & visites de logements
                    </div>
                  </div>
                </button>

              </div>

              {/* Bouton passer à l'étape 2 */}
              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full justify-center py-3.5 text-sm font-bold shadow-xl shadow-primary/25 bg-gradient-to-r from-amber-500 via-primary to-amber-600 hover:opacity-95 text-black rounded-xl transition-all"
                >
                  Continuer en tant que {selectedRole === 'seller' ? 'Vendeur / Bailleur' : 'Client / Étudiant'} <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

            </div>
          )}

          {/* ================= ÉTAPE 2 : FORMULAIRE D'INSCRIPTION ================= */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
              
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="badge-primary text-[11px] px-2.5 py-0.5">
                    Étape 2 sur 2
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Changer de profil
                  </button>
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-foreground tracking-tight">
                  Créez votre compte
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Profil choisi : <strong className={selectedRole === 'seller' ? 'text-amber-500' : 'text-blue-500'}>
                    {selectedRole === 'seller' ? '🏬 / 🏠 Vendeur & Bailleur' : '🎓 Client / Étudiant'}
                  </strong>
                </p>
              </div>

              <div className="space-y-3.5">
                
                {/* Nom complet */}
                <Input
                  label="Nom complet ou Pseudonyme *"
                  placeholder="Ex: Jean Nsangou, Dylan Devs..."
                  required
                  leftIcon={<User className="w-4 h-4" />}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  className="py-2.5 text-sm rounded-xl"
                />

                {/* Email */}
                <Input
                  label="Adresse Email *"
                  type="email"
                  placeholder="votre@email.cm"
                  required
                  leftIcon={<Mail className="w-4 h-4" />}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  className="py-2.5 text-sm rounded-xl"
                />

                {/* Mot de passe avec toggle */}
                <div className="form-group">
                  <label className="form-label">Mot de passe (min. 6 caractères) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoComplete="new-password"
                      className="input-field pl-10 pr-11 py-2.5 text-sm rounded-xl w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Téléphone / WhatsApp */}
                <Input
                  label="Numéro WhatsApp ou Téléphone"
                  placeholder="Ex: 699 00 00 00"
                  leftIcon={<Phone className="w-4 h-4" />}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="py-2.5 text-sm rounded-xl"
                />

                {/* Mobile Money (MTN & Orange) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <Input
                    label="MTN MoMo (optionnel)"
                    placeholder="6XX XXX XXX"
                    value={mtnNumber}
                    onChange={e => setMtnNumber(e.target.value)}
                    className="py-2.5 text-sm rounded-xl"
                  />
                  <Input
                    label="Orange Money (optionnel)"
                    placeholder="6XX XXX XXX"
                    value={orangeNumber}
                    onChange={e => setOrangeNumber(e.target.value)}
                    className="py-2.5 text-sm rounded-xl"
                  />
                </div>

              </div>

              {/* Conditions d'utilisation */}
              <div className="pt-1 space-y-1.5">
                <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={e => setAcceptTerms(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5 shrink-0"
                  />
                  <span>
                    J'ai lu et j'accepte les{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setTermsModalOpen(true)
                      }}
                      className="text-primary font-bold underline hover:opacity-80"
                    >
                      Conditions Générales d'Utilisation
                    </button>{' '}
                    et la{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setTermsModalOpen(true)
                      }}
                      className="text-primary font-bold underline hover:opacity-80"
                    >
                      Politique de Confidentialité
                    </button>{' '}
                    d'OroMall.
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setTermsModalOpen(true)}
                  className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 pl-6 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Consulter le règlement complet et la charte de sécurité →</span>
                </button>
              </div>

              {/* Bouton de soumission */}
              <div className="pt-2 space-y-2.5">
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full justify-center py-3.5 text-sm font-bold shadow-xl shadow-primary/25 bg-gradient-to-r from-amber-500 via-primary to-amber-600 hover:opacity-95 text-black rounded-xl transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  {selectedRole === 'seller'
                    ? 'Créer mon compte et configurer mon dossier Vendeur / Bailleur'
                    : 'Créer mon compte Client / Étudiant'
                  }
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-full justify-center py-2.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Revenir au choix du profil
                </Button>
              </div>

            </form>
          )}

          {/* Pied de page login */}
          <div className="text-center text-xs text-muted-foreground border-t border-border/70 pt-4">
            Vous possédez déjà un compte ?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Se connecter
            </Link>
          </div>

        </div>

      </div>

      {/* Modal de lecture des Conditions Générales et Confidentialité */}
      <TermsModal
        open={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        onAccept={() => {
          setAcceptTerms(true)
          toastSuccess('Conditions acceptées', 'Vous avez validé les CGU et la Politique de Confidentialité.')
        }}
      />
    </div>
  )
}
