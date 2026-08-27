import { useState } from 'react'
import {
  Sliders, Shield, AlertTriangle, Lock, Check, Store, Palette, Globe,
  Truck, CreditCard, RefreshCw, Trash2, Database, Bell, DollarSign, FileText, ToggleLeft, ToggleRight
} from 'lucide-react'
import { AuditLogAPI, ShopAPI, ProductAPI, HousingAPI, OrderAPI, UserAPI } from '@/lib/store'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface AdminSettingsTabProps {
  commissionRate: number
  onUpdateCommission: (rate: number) => void
  adminName?: string
}

export function AdminSettingsTab({ commissionRate, onUpdateCommission, adminName = 'SuperAdmin' }: AdminSettingsTabProps) {
  // 1. Commission & Maintenance
  const [rateInput, setRateInput] = useState(String(commissionRate))
  const [housingVisitFee, setHousingVisitFee] = useState(() => localStorage.getItem('mp_visit_fee') || '2000')
  const [maintenanceMode, setMaintenanceMode] = useState(() => localStorage.getItem('mp_maintenance_mode') === '1')
  const [maintenanceMessage, setMaintenanceMessage] = useState(() => localStorage.getItem('mp_maintenance_msg') || 'OroMall est en maintenance programmée. Nous revenons très vite !')

  // 2. Paramètres de la Plateforme (Titre, Contact, Devise)
  const [siteName, setSiteName] = useState(() => localStorage.getItem('mp_site_name') || 'OroMall Cameroun')
  const [supportWhatsApp, setSupportWhatsApp] = useState(() => localStorage.getItem('mp_support_whatsapp') || '237680195221')
  const [supportEmail, setSupportEmail] = useState(() => localStorage.getItem('mp_support_email') || 'contact@oromall.cm')
  const [currencySymbol, setCurrencySymbol] = useState(() => localStorage.getItem('mp_currency') || 'FCFA')

  // 3. Paiements & Comptes Mobile Money de Réception
  const [momoMTN, setMomoMTN] = useState(() => localStorage.getItem('mp_admin_mtn') || '680195221')
  const [momoOrange, setMomoOrange] = useState(() => localStorage.getItem('mp_admin_orange') || '691576677')
  const [minWithdrawal, setMinWithdrawal] = useState(() => localStorage.getItem('mp_min_withdrawal') || '5000')

  // 4. Règles de Livraison & Logistique Globale
  const [defaultShippingFee, setDefaultShippingFee] = useState(() => localStorage.getItem('mp_default_shipping') || '1500')
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(() => localStorage.getItem('mp_free_shipping_min') || '50000')

  // 5. Bannière d'Annonce Globale
  const [announcementText, setAnnouncementText] = useState(() => localStorage.getItem('mp_announcement') || '🔥 Offres spéciales rentrée académique : Jusqu\'à -20% sur la catégorie Électronique !')
  const [announcementActive, setAnnouncementActive] = useState(() => localStorage.getItem('mp_announcement_enabled') !== '0')

  const handleSaveAllSettings = (e: React.FormEvent) => {
    e.preventDefault()
    const newRate = Number(rateInput)
    onUpdateCommission(newRate)

    // Stockage persistant des paramètres généraux
    localStorage.setItem('mp_maintenance_mode', maintenanceMode ? '1' : '0')
    localStorage.setItem('mp_maintenance_msg', maintenanceMessage)
    localStorage.setItem('mp_visit_fee', housingVisitFee)
    localStorage.setItem('mp_site_name', siteName)
    localStorage.setItem('mp_support_whatsapp', supportWhatsApp)
    localStorage.setItem('mp_support_email', supportEmail)
    localStorage.setItem('mp_currency', currencySymbol)
    localStorage.setItem('mp_admin_mtn', momoMTN)
    localStorage.setItem('mp_admin_orange', momoOrange)
    localStorage.setItem('mp_min_withdrawal', minWithdrawal)
    localStorage.setItem('mp_default_shipping', defaultShippingFee)
    localStorage.setItem('mp_free_shipping_min', freeShippingThreshold)
    localStorage.setItem('mp_announcement', announcementText)
    localStorage.setItem('mp_announcement_enabled', announcementActive ? '1' : '0')

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Mise à jour Intégrale des Paramètres Plateforme',
      details: `Commission: ${newRate}% - Maintenance: ${maintenanceMode ? 'ACTIVE' : 'INACTIVE'} - MTN: ${momoMTN} - Orange: ${momoOrange}`,
      severity: maintenanceMode ? 'danger' : 'info'
    })

    toastSuccess('Tous les paramètres et configurations ont été enregistrés avec succès !')
  }

  const handlePurgeCache = () => {
    if (!confirm('Voulez-vous purger le cache temporaire et recharger les données du système ?')) return
    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Purge du Cache Système 🧹',
      details: 'Purge mémoire et rechargement',
      severity: 'warning'
    })
    toastSuccess('Cache système purgé avec succès !')
    setTimeout(() => window.location.reload(), 600)
  }

  const handleResetFactoryData = () => {
    const confirmation = prompt('ATTENTION : Pour réinitialiser le catalogue de test, tapez "RESET" :')
    if (confirmation !== 'RESET') return

    localStorage.removeItem('mp_products')
    localStorage.removeItem('mp_housing')
    localStorage.removeItem('mp_orders')

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Réinitialisation Catalogue Usine ⚠️',
      details: 'Purge complète du catalogue produits/logements',
      severity: 'danger'
    })

    toastSuccess('Données catalogue réinitialisées !')
    setTimeout(() => window.location.reload(), 600)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Sliders className="w-5 h-5 text-primary" /> Configuration Globale & Contrôle Système
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Éditez, personnalisez et modifiez l'intégralité des paramètres, tarifs, paiements et règles du site.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handlePurgeCache} className="text-xs gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Purger le Cache
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleResetFactoryData} className="text-xs gap-1.5 text-red-400 hover:bg-red-500/10">
            <Trash2 className="w-3.5 h-3.5" /> Reset Usine
          </Button>
        </div>
      </div>

      <form onSubmit={handleSaveAllSettings} className="space-y-6">
        {/* Grille 2 Colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECTION 1 : Identité & Contact */}
          <div className="card-glass p-5 space-y-4 border-l-4 border-l-primary">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> 1. Identité du Site & Support Client
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Nom de la Plateforme *</label>
                <Input value={siteName} onChange={e => setSiteName(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">WhatsApp Officiel Support (sans +) *</label>
                <Input value={supportWhatsApp} onChange={e => setSupportWhatsApp(e.target.value)} placeholder="237680195221" required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Email Contact Support *</label>
                <Input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Symbole Monétaire</label>
                <Input value={currencySymbol} onChange={e => setCurrencySymbol(e.target.value)} placeholder="FCFA" />
              </div>
            </div>
          </div>

          {/* SECTION 2 : Tarification, Commissions & Forfaits Logements */}
          <div className="card-glass p-5 space-y-4 border-l-4 border-l-emerald-500">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> 2. Commissions & Frais de Visite
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Taux de Commission Plateforme (%) *</label>
                <Input type="number" min="0" max="100" value={rateInput} onChange={e => setRateInput(e.target.value)} required />
                <p className="text-[11px] text-muted-foreground">Prélevé sur les ventes des boutiques partenaires.</p>
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Tarif Visite Logement Simple (FCFA) *</label>
                <Input type="number" value={housingVisitFee} onChange={e => setHousingVisitFee(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Seuil Minimum Retrait Vendeur (FCFA)</label>
                <Input type="number" value={minWithdrawal} onChange={e => setMinWithdrawal(e.target.value)} />
              </div>
            </div>
          </div>

          {/* SECTION 3 : Comptes Mobile Money Récepteurs Admin */}
          <div className="card-glass p-5 space-y-4 border-l-4 border-l-amber-500">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" /> 3. Comptes Mobile Money OroMall (Réception des Paiements)
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Numéro Compte Marchand MTN MoMo *</label>
                <Input value={momoMTN} onChange={e => setMomoMTN(e.target.value)} placeholder="680195221" required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Numéro Compte Marchand Orange Money *</label>
                <Input value={momoOrange} onChange={e => setMomoOrange(e.target.value)} placeholder="691576677" required />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Ces numéros sont affichés aux clients pour le règlement des commandes et des forfaits de visite de logements.
              </p>
            </div>
          </div>

          {/* SECTION 4 : Logistique & Frais de Port */}
          <div className="card-glass p-5 space-y-4 border-l-4 border-l-blue-500">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400" /> 4. Logistique & Frais de Livraison
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Frais de Livraison Standard (FCFA) *</label>
                <Input type="number" value={defaultShippingFee} onChange={e => setDefaultShippingFee(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Livraison Gratuite à partir de (FCFA)</label>
                <Input type="number" value={freeShippingThreshold} onChange={e => setFreeShippingThreshold(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5 : Bannière d'Annonce & Mode Maintenance */}
        <div className="card-glass p-6 space-y-5 border border-border">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> 5. Bannière d'Annonce Globale & Mode Maintenance d'Urgence
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Bannière Header */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Bannière promotionnelle en haut du site</span>
                <button
                  type="button"
                  onClick={() => setAnnouncementActive(!announcementActive)}
                  className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all ${announcementActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground'}`}
                >
                  {announcementActive ? 'Active 🟢' : 'Désactivée ⚪'}
                </button>
              </div>
              <Textarea
                rows={2}
                value={announcementText}
                onChange={e => setAnnouncementText(e.target.value)}
                placeholder="Texte de l'annonce affichée en haut de toutes les pages..."
              />
            </div>

            {/* Mode Maintenance */}
            <div className={`p-4 rounded-xl border space-y-3 transition-all ${maintenanceMode ? 'bg-red-500/10 border-red-500/30' : 'bg-card border-border'}`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" /> Mode Maintenance Plateforme
                </span>
                <button
                  type="button"
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition-all ${maintenanceMode ? 'bg-red-500 text-white shadow' : 'bg-muted text-muted-foreground'}`}
                >
                  {maintenanceMode ? 'ACTIVÉ 🔴' : 'Désactivé 🟢'}
                </button>
              </div>
              <Textarea
                rows={2}
                value={maintenanceMessage}
                onChange={e => setMaintenanceMessage(e.target.value)}
                placeholder="Message affiché aux utilisateurs pendant la maintenance..."
              />
            </div>
          </div>
        </div>

        {/* Bouton de Sauvegarde Général */}
        <div className="flex justify-end pt-2">
          <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-lg shadow-primary/20">
            <Check className="w-4 h-4 mr-2" /> Enregistrer Tous les Paramètres Système
          </Button>
        </div>
      </form>
    </div>
  )
}
