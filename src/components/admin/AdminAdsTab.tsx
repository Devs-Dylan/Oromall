import React, { useState, useMemo } from 'react'
import {
  Megaphone, Plus, Edit3, Trash2, Eye, MousePointer,
  CheckCircle2, AlertCircle, Copy, Sparkles, Image as ImageIcon,
  ExternalLink, Calendar, Filter, BarChart3, ArrowUpRight, Play, Pause,
  MapPin, Phone, MessageSquare, Tag, DollarSign, Layers, Radio, RefreshCw
} from 'lucide-react'
import type { Advertisement, AdPosition, AdStatus } from '@/types'
import { CITIES_CAMEROON } from '@/types'
import { AdAPI } from '@/lib/store'
import { formatPrice, formatDate, cn, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { ImageUploadField } from '@/components/ui/ImageUploadField'
import { toastSuccess, toastError, toastInfo } from '@/components/ui/Toast'

interface AdminAdsTabProps {
  ads: Advertisement[]
  onRefresh: () => void
}

const POSITION_OPTIONS: { id: AdPosition; label: string; description: string; icon: string }[] = [
  { id: 'hero', label: 'Bannière Carrousel Hero (Accueil)', description: 'Grand format rotatif en haut de la page d\'accueil', icon: '⭐' },
  { id: 'top_banner', label: 'Barre d\'annonce Supérieure (Top Header)', description: 'Bandeau discret fixé tout en haut du site', icon: '📢' },
  { id: 'ticker', label: 'Bandeau Défilant Type TV (Flash Info 24/7)', description: 'Ligne animée continue avant le footer', icon: '🔴' },
  { id: 'marketplace_middle', label: 'Bannière Centrale Marketplace', description: 'Encart publicitaire entre les rayons de produits', icon: '🛍️' },
  { id: 'housing_page', label: 'Bannière Page Logements', description: 'En-tête sponsorisé sur le catalogue immobilier', icon: '🏠' },
  { id: 'sidebar', label: 'Barre Latérale / Widget', description: 'Format carré ou vertical pour colonnes', icon: '📌' },
  { id: 'popup', label: 'Modale Pop-up Promo', description: 'Fenêtre promotionnelle surgissante', icon: '✨' },
]

const BADGE_THEMES = [
  { id: 'gold', label: 'Or / Gold ⭐', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { id: 'emerald', label: 'Vert Émeraude 🏠', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { id: 'rose', label: 'Rouge Flash 🔥', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { id: 'blue', label: 'Bleu Sécurité 🔒', badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  { id: 'purple', label: 'Violet Royal 👑', badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { id: 'amber', label: 'Ambre / Solaire ⚡', badgeClass: 'bg-amber-600/20 text-amber-400 border-amber-600/40' },
]

export function AdminAdsTab({ ads, onRefresh }: AdminAdsTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [positionFilter, setPositionFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [cityFilter, setCityFilter] = useState<string>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [ctaText, setCtaText] = useState('Découvrir l\'offre')
  const [position, setPosition] = useState<AdPosition>('hero')
  const [status, setStatus] = useState<AdStatus>('active')
  const [badge, setBadge] = useState('PROMO GOLD ⭐')
  const [badgeColor, setBadgeColor] = useState('gold')
  const [targetCity, setTargetCity] = useState('Toutes')
  const [actionType, setActionType] = useState<'internal_link' | 'whatsapp' | 'call' | 'custom_url' | 'promo_code'>('internal_link')
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('')
  const [advertiserName, setAdvertiserName] = useState('')
  const [advertiserContact, setAdvertiserContact] = useState('')
  const [priority, setPriority] = useState('5')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // KPIs
  const totalImpressions = useMemo(() => ads.reduce((s, a) => s + (a.impressions_count || 0), 0), [ads])
  const totalClicks = useMemo(() => ads.reduce((s, a) => s + (a.clicks_count || 0), 0), [ads])
  const activeAdsCount = useMemo(() => ads.filter(a => a.status === 'active').length, [ads])
  const totalRevenue = useMemo(() => ads.reduce((s, a) => s + (a.budget_amount || 0), 0), [ads])
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0'

  const resetForm = () => {
    setEditingAd(null)
    setTitle('')
    setSubtitle('')
    setImageUrl('')
    setLinkUrl('/')
    setCtaText('Découvrir l\'offre')
    setPosition('hero')
    setStatus('active')
    setBadge('PROMO GOLD ⭐')
    setBadgeColor('gold')
    setTargetCity('Toutes')
    setActionType('internal_link')
    setWhatsappPhone('237680195221')
    setPromoCode('')
    setBudgetAmount('')
    setAdvertiserName('')
    setAdvertiserContact('')
    setPriority('5')
    setStartDate(new Date().toISOString().slice(0, 10))
    setEndDate('')
  }

  const openNewAdModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEditAdModal = (ad: Advertisement) => {
    setEditingAd(ad)
    setTitle(ad.title)
    setSubtitle(ad.subtitle || '')
    setImageUrl(ad.image_url)
    setLinkUrl(ad.link_url || '')
    setCtaText(ad.cta_text || 'Découvrir')
    setPosition(ad.position)
    setStatus(ad.status)
    setBadge(ad.badge || '')
    setBadgeColor(ad.badge_color || 'gold')
    setTargetCity(ad.target_city || 'Toutes')
    setActionType(ad.action_type || 'internal_link')
    setWhatsappPhone(ad.whatsapp_phone || '')
    setPromoCode(ad.promo_code || '')
    setBudgetAmount(ad.budget_amount ? String(ad.budget_amount) : '')
    setAdvertiserName(ad.advertiser_name || '')
    setAdvertiserContact(ad.advertiser_contact || '')
    setPriority(ad.priority ? String(ad.priority) : '5')
    setStartDate(ad.start_date || '')
    setEndDate(ad.end_date || '')
    setModalOpen(true)
  }

  const handleDuplicateAd = (ad: Advertisement) => {
    const { id, created_date, updated_date, ...rest } = ad
    AdAPI.create({
      ...rest,
      title: `${ad.title} (Copie)`,
      impressions_count: 0,
      clicks_count: 0,
    })
    toastSuccess('Campagne publicitaire dupliquée en 1 clic ! 📢')
    onRefresh()
  }

  const handleToggleStatus = (ad: Advertisement) => {
    const nextStatus: AdStatus = ad.status === 'active' ? 'paused' : 'active'
    AdAPI.update(ad.id, { status: nextStatus })
    toastSuccess(`Campagne ${nextStatus === 'active' ? 'activée 🟢' : 'mise en pause ⏸️'}`)
    onRefresh()
  }

  const handleSimulateClick = (ad: Advertisement, e: React.MouseEvent) => {
    e.stopPropagation()
    AdAPI.update(ad.id, {
      clicks_count: (ad.clicks_count || 0) + 1,
      impressions_count: (ad.impressions_count || 0) + 1
    })
    toastInfo(`+1 Clic enregistré sur la campagne "${ad.title.slice(0, 20)}..."`)
    onRefresh()
  }

  const handleResetStats = (ad: Advertisement, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Réinitialiser les statistiques de clics pour "${ad.title}" ?`)) return
    AdAPI.update(ad.id, {
      clicks_count: 0,
      impressions_count: 0
    })
    toastSuccess('Statistiques remises à zéro.')
    onRefresh()
  }

  const handleDeleteAd = (id: string) => {
    if (confirm('Supprimer définitivement cette campagne publicitaire ?')) {
      AdAPI.delete(id)
      toastSuccess('Publicité supprimée.')
      onRefresh()
    }
  }

  const handleSaveAd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !imageUrl.trim()) {
      toastError('Veuillez renseigner le titre et l\'image de la publicité.')
      return
    }

    let finalLink = linkUrl
    if (actionType === 'whatsapp' && whatsappPhone) {
      finalLink = buildWhatsAppUrl(whatsappPhone, `Bonjour, je suis intéressé par votre annonce : "${title}" sur OroMall.`)
    } else if (actionType === 'call' && whatsappPhone) {
      finalLink = `tel:${whatsappPhone}`
    } else if (actionType === 'promo_code' && promoCode) {
      finalLink = `/cart?promo=${promoCode.toUpperCase()}`
    }

    const payload: Partial<Advertisement> = {
      title,
      subtitle: subtitle || undefined,
      image_url: imageUrl,
      link_url: finalLink || '/',
      cta_text: ctaText || 'Découvrir',
      position,
      status,
      badge: badge || undefined,
      badge_color: badgeColor,
      target_city: targetCity,
      action_type: actionType,
      whatsapp_phone: whatsappPhone || undefined,
      promo_code: promoCode ? promoCode.toUpperCase() : undefined,
      budget_amount: budgetAmount ? Number(budgetAmount) : undefined,
      advertiser_name: advertiserName || undefined,
      advertiser_contact: advertiserContact || undefined,
      priority: Number(priority) || 5,
      start_date: startDate || new Date().toISOString().slice(0, 10),
      end_date: endDate || undefined,
      impressions_count: editingAd ? editingAd.impressions_count : 0,
      clicks_count: editingAd ? editingAd.clicks_count : 0,
      updated_date: new Date().toISOString(),
    }

    if (editingAd) {
      AdAPI.update(editingAd.id, payload)
      toastSuccess('Campagne publicitaire mise à jour ! ✨')
    } else {
      AdAPI.create({
        ...payload,
        created_date: new Date().toISOString(),
      } as Advertisement)
      toastSuccess('Nouvelle publicité lancée avec succès ! 🚀')
    }

    setModalOpen(false)
    resetForm()
    onRefresh()
  }

  // Filtered ads
  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      const matchesSearch = !searchQuery.trim() ||
        ad.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ad.subtitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (ad.advertiser_name || '').toLowerCase().includes(searchQuery.toLowerCase())

      const matchesPos = positionFilter === 'all' || ad.position === positionFilter
      const matchesStatus = statusFilter === 'all' || ad.status === statusFilter
      const matchesCity = cityFilter === 'all' || ad.target_city === cityFilter || !ad.target_city || ad.target_city === 'Toutes'

      return matchesSearch && matchesPos && matchesStatus && matchesCity
    })
  }, [ads, searchQuery, positionFilter, statusFilter, cityFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-primary" /> Gestion Publicités, Bannières & Sponsoring ({ads.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Diffusez des bannières carrousel, annonces en-tête, bandeaux défilants TV 24/7, popups et géolocalisez vos campagnes.
          </p>
        </div>

        <Button onClick={openNewAdModal} className="btn-primary text-xs flex items-center gap-2">
          <Plus className="w-4 h-4" /> Créer une Publicité / Bannière
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="card-glass p-4 border-l-4 border-l-primary space-y-1">
          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5 text-primary" /> Campagnes Actives
          </p>
          <p className="text-2xl font-black text-foreground">{activeAdsCount} <span className="text-xs font-normal text-muted-foreground">/ {ads.length}</span></p>
        </div>

        <div className="card-glass p-4 border-l-4 border-l-blue-500 space-y-1">
          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-blue-400" /> Impressions Totales
          </p>
          <p className="text-2xl font-black text-blue-400">{totalImpressions.toLocaleString()}</p>
        </div>

        <div className="card-glass p-4 border-l-4 border-l-emerald-500 space-y-1">
          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <MousePointer className="w-3.5 h-3.5 text-emerald-400" /> Clics & Conversions
          </p>
          <p className="text-2xl font-black text-emerald-400">{totalClicks.toLocaleString()} <span className="text-xs font-bold text-emerald-300">({avgCTR}% CTR)</span></p>
        </div>

        <div className="card-glass p-4 border-l-4 border-l-purple-500 space-y-1">
          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-purple-400" /> Revenu Sponsoring
          </p>
          <p className="text-xl font-black text-purple-400">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card-glass p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <Input
            placeholder="Rechercher une pub, un sponsor..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:w-60 text-xs py-1.5"
          />

          <Select
            value={positionFilter}
            onChange={e => setPositionFilter(e.target.value)}
            className="text-xs py-1.5"
            options={[
              { value: 'all', label: 'Tous les Emplacements' },
              ...POSITION_OPTIONS.map(p => ({ value: p.id, label: `${p.icon} ${p.label}` }))
            ]}
          />

          <Select
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            className="text-xs py-1.5"
            options={[
              { value: 'all', label: 'Toutes les Villes' },
              ...CITIES_CAMEROON.map(c => ({ value: c, label: `📍 ${c}` }))
            ]}
          />

          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs py-1.5"
            options={[
              { value: 'all', label: 'Tous les Statuts' },
              { value: 'active', label: '🟢 Actives uniquement' },
              { value: 'paused', label: '⏸️ En pause' },
              { value: 'scheduled', label: '📅 Planifiées' },
            ]}
          />
        </div>
      </div>

      {/* Ads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAds.length === 0 ? (
          <div className="col-span-full card-glass p-12 text-center space-y-3">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucune campagne publicitaire ne correspond à vos filtres.</p>
            <Button onClick={openNewAdModal} variant="outline" size="sm">Créer une campagne</Button>
          </div>
        ) : (
          filteredAds.map(ad => {
            const ctr = (ad.impressions_count && ad.impressions_count > 0)
              ? (((ad.clicks_count || 0) / ad.impressions_count) * 100).toFixed(1)
              : '0.0'

            const posConfig = POSITION_OPTIONS.find(p => p.id === ad.position)

            return (
              <div key={ad.id} className="card-glass overflow-hidden flex flex-col justify-between group hover:border-primary/50 transition-all">
                {/* Banner Thumbnail with Badge overlay */}
                <div className="relative h-40 bg-muted overflow-hidden">
                  <img
                    src={ad.image_url}
                    alt={ad.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Badges on banner */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                    {ad.badge && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-primary text-black shadow">
                        {ad.badge}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm border border-white/20">
                      {posConfig?.icon} {ad.position}
                    </span>
                  </div>

                  {/* Status indicator */}
                  <div className="absolute top-2.5 right-2.5">
                    <button
                      onClick={() => handleToggleStatus(ad)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors shadow-sm',
                        ad.status === 'active'
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : 'bg-slate-700 text-slate-300 border-slate-600'
                      )}
                      title="Cliquer pour changer l'état"
                    >
                      {ad.status === 'active' ? '● En cours' : '⏸️ Pause'}
                    </button>
                  </div>

                  {/* Bottom title preview on image */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5">
                    <h3 className="text-sm font-extrabold text-white line-clamp-1 drop-shadow-md">{ad.title}</h3>
                    {ad.subtitle && <p className="text-[11px] text-slate-200 line-clamp-1">{ad.subtitle}</p>}
                  </div>
                </div>

                {/* Details & Targetings */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2 text-xs">
                    {/* Targeting tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      <span className="bg-muted px-2 py-0.5 rounded flex items-center gap-1 font-semibold text-foreground">
                        <MapPin className="w-3 h-3 text-primary" /> {ad.target_city || 'Toutes villes'}
                      </span>
                      {ad.advertiser_name && (
                        <span className="bg-muted px-2 py-0.5 rounded font-semibold text-foreground truncate max-w-[140px]">
                          👤 {ad.advertiser_name}
                        </span>
                      )}
                      {ad.budget_amount && (
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/20">
                          {formatPrice(ad.budget_amount)}
                        </span>
                      )}
                      <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                        Priorité: <strong>{ad.priority || 5}</strong>/10
                      </span>
                    </div>

                    {/* Destination action */}
                    <div className="p-2 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between text-[11px]">
                      <div className="truncate pr-2">
                        <span className="text-muted-foreground">Bouton CTA : </span>
                        <strong className="text-primary">{ad.cta_text || 'Découvrir'}</strong>
                        <p className="text-muted-foreground truncate font-mono text-[10px]">{ad.link_url}</p>
                      </div>
                      <a href={ad.link_url} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3 bg-card p-2 rounded-xl border border-border/40">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold">Impressions</p>
                        <p className="font-extrabold text-foreground">{ad.impressions_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold">Clics</p>
                        <p className="font-extrabold text-emerald-400">{ad.clicks_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-semibold">Taux (CTR)</p>
                        <p className="font-extrabold text-primary">{ctr}%</p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleSimulateClick(ad, e)}
                          className="h-7 text-[10px] px-2 text-emerald-400 hover:bg-emerald-500/10"
                          title="Tester +1 Clic"
                        >
                          <MousePointer className="w-3 h-3" /> +1 Clic
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleResetStats(ad, e)}
                          className="h-7 text-[10px] px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
                          title="Remettre à zéro"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicateAd(ad)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Dupliquer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditAdModal(ad)}
                          className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                          title="Modifier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteAd(ad.id)}
                          className="h-7 w-7 p-0 text-red-400 hover:bg-red-500/10"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* CREATE / EDIT AD MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAd ? 'Modifier la Campagne Publicitaire' : 'Créer une Nouvelle Publicité / Bannière'}
        size="lg"
      >
        <form onSubmit={handleSaveAd} className="space-y-4 text-xs max-h-[80vh] overflow-y-auto pr-1">
          {/* SECTION 1: Emplacement & Titre */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-card border border-border">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> 1. Format & Emplacement d'Affichage
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Emplacement d'affichage *"
                value={position}
                onChange={e => setPosition(e.target.value as AdPosition)}
                options={POSITION_OPTIONS.map(p => ({
                  value: p.id,
                  label: `${p.icon} ${p.label}`
                }))}
                required
              />

              <Select
                label="Ville cible / Géolocalisation"
                value={targetCity}
                onChange={e => setTargetCity(e.target.value)}
                options={[
                  { value: 'Toutes', label: 'Toutes les villes (National)' },
                  ...CITIES_CAMEROON.map(c => ({ value: c, label: `📍 ${c}` }))
                ]}
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Titre principal de l'annonce *</label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Soldes Rentrée Universitaire - Jusqu'à -40%"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-foreground">Sous-titre / Message descriptif</label>
              <Textarea
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="Ex: Valable sur les ordinateurs et téléphones dans toutes nos boutiques partenaires..."
                rows={2}
              />
            </div>
          </div>

          {/* SECTION 2: Visuel & Badging */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-card border border-border">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-400" /> 2. Visuel & Badge Accrocheur
            </h3>

            <ImageUploadField
              label="Image / Bannière de la publicité *"
              value={imageUrl}
              onChange={setImageUrl}
              aspectRatio="16:9"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Texte du Badge d'Accroche"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder="Ex: PROMO GOLD ⭐, FLASH INFO ⚡, EXCLUSIF 🔥"
              />

              <Select
                label="Thème / Couleur du Badge"
                value={badgeColor}
                onChange={e => setBadgeColor(e.target.value)}
                options={BADGE_THEMES.map(t => ({
                  value: t.id,
                  label: t.label
                }))}
              />
            </div>
          </div>

          {/* SECTION 3: Action & Redirection */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-card border border-border">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-400" /> 3. Destination & Appel à l'Action (CTA)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Type d'action au clic"
                value={actionType}
                onChange={e => setActionType(e.target.value as any)}
                options={[
                  { value: 'internal_link', label: '🔗 Page interne du site' },
                  { value: 'whatsapp', label: '💬 Chat WhatsApp direct' },
                  { value: 'call', label: '📞 Appel téléphonique direct' },
                  { value: 'promo_code', label: '🏷️ Code Promo appliqué au panier' },
                  { value: 'custom_url', label: '🌐 Lien URL externe' },
                ]}
              />

              <Input
                label="Texte du bouton CTA"
                value={ctaText}
                onChange={e => setCtaText(e.target.value)}
                placeholder="Ex: Voir les offres, Discuter, Commander..."
              />
            </div>

            {actionType === 'internal_link' && (
              <Input
                label="Chemin URL interne"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="Ex: /housing, /?cat=Électronique, /seller/onboarding"
              />
            )}

            {(actionType === 'whatsapp' || actionType === 'call') && (
              <Input
                label="Numéro de Téléphone / WhatsApp"
                value={whatsappPhone}
                onChange={e => setWhatsappPhone(e.target.value)}
                placeholder="Ex: 237680195221"
              />
            )}

            {actionType === 'promo_code' && (
              <Input
                label="Code Promo à injecter"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Ex: RENTREE2026, GOLD10"
              />
            )}

            {actionType === 'custom_url' && (
              <Input
                label="URL externe (avec https://)"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://monsite.com/landing"
              />
            )}
          </div>

          {/* SECTION 4: Sponsor, Budget & Priorité */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-card border border-border">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-400" /> 4. Sponsor, Facturation & Priorité
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Nom de l'Annonceur / Marque"
                value={advertiserName}
                onChange={e => setAdvertiserName(e.target.value)}
                placeholder="Ex: Boutique TechPlus"
              />

              <Input
                label="Contact de l'Annonceur"
                value={advertiserContact}
                onChange={e => setAdvertiserContact(e.target.value)}
                placeholder="Ex: contact@techplus.cm"
              />

              <Input
                label="Montant Facturé (FCFA)"
                type="number"
                value={budgetAmount}
                onChange={e => setBudgetAmount(e.target.value)}
                placeholder="Ex: 50000"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Priorité d'affichage"
                value={priority}
                onChange={e => setPriority(e.target.value)}
                options={[
                  { value: '10', label: '10 - Maximale (Toujours en tête)' },
                  { value: '8', label: '8 - Élevée' },
                  { value: '5', label: '5 - Normale' },
                  { value: '2', label: '2 - Faible' },
                ]}
              />

              <Input
                label="Date de début"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />

              <Input
                label="Date d'expiration"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" className="bg-primary text-white font-bold">
              {editingAd ? 'Enregistrer les modifications' : 'Lancer la campagne 🚀'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
