import { useState } from 'react'
import {
  Sparkles, Palette, Type, MousePointerClick, ToggleLeft, ToggleRight,
  Eye, Check, RotateCcw, Layout, Sliders, Menu, Shield, Save
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'
import { AuditLogAPI } from '@/lib/store'

export interface NavTabCustomization {
  id: string
  label: string
  visible: boolean
}

export interface ButtonCustomization {
  id: string
  label: string
  color: string
}

export const DEFAULT_TABS: NavTabCustomization[] = [
  { id: 'kpis', label: '📊 Super-Vision', visible: true },
  { id: 'commissions', label: '💵 Commissions Vendeurs (2%)', visible: true },
  { id: 'subscriptions', label: '💳 Abonnements Boutiques', visible: true },
  { id: 'ads', label: '📣 Régie Publicités', visible: true },
  { id: 'catalog', label: '📦 Catalogue Global', visible: true },
  { id: 'users', label: '👥 Utilisateurs & Rôles', visible: true },
  { id: 'financial', label: '💰 Finances & MoMo', visible: true },
  { id: 'issues', label: '⚠️ Litiges & Problèmes', visible: true },
  { id: 'comms', label: '📢 Comms & Promos', visible: true },
  { id: 'auditInspect', label: '📜 Audit & Inspect', visible: true },
  { id: 'settings', label: '⚙️ Configuration', visible: true },
  { id: 'visits', label: '📅 Visites Logements', visible: true },
  { id: 'powerhub', label: '⚡ PowerHub Stratégique', visible: true },
]

export const DEFAULT_BUTTONS: ButtonCustomization[] = [
  { id: 'btn_add_product', label: '+ Ajouter un produit', color: '#f97316' },
  { id: 'btn_add_housing', label: '+ Ajouter un logement', color: '#10b981' },
  { id: 'btn_visit_request', label: 'Demander une visite', color: '#10b981' },
  { id: 'btn_order_now', label: 'Acheter maintenant (MoMo)', color: '#f97316' },
  { id: 'btn_contact_whatsapp', label: 'Contacter sur WhatsApp', color: '#22c55e' },
  { id: 'btn_seller_export', label: 'Exporter Rapport CSV', color: '#6366f1' },
]

export function AdminUiCustomizerTab({ onSave }: { onSave?: () => void }) {
  const [tabs, setTabs] = useState<NavTabCustomization[]>(() => {
    try {
      const saved = localStorage.getItem('mp_custom_admin_tabs')
      return saved ? JSON.parse(saved) : DEFAULT_TABS
    } catch {
      return DEFAULT_TABS
    }
  })

  const [buttons, setButtons] = useState<ButtonCustomization[]>(() => {
    try {
      const saved = localStorage.getItem('mp_custom_buttons')
      return saved ? JSON.parse(saved) : DEFAULT_BUTTONS
    } catch {
      return DEFAULT_BUTTONS
    }
  })

  const [primaryBrandColor, setPrimaryBrandColor] = useState(() => localStorage.getItem('mp_brand_primary') || '#f97316')
  const [customHeaderTitle, setCustomHeaderTitle] = useState(() => localStorage.getItem('mp_brand_title') || 'MarchéPlus Cameroun')

  const handleTabLabelChange = (id: string, newLabel: string) => {
    setTabs(tabs.map(t => t.id === id ? { ...t, label: newLabel } : t))
  }

  const handleTabToggleVisibility = (id: string) => {
    setTabs(tabs.map(t => t.id === id ? { ...t, visible: !t.visible } : t))
  }

  const handleButtonLabelChange = (id: string, newLabel: string) => {
    setButtons(buttons.map(b => b.id === id ? { ...b, label: newLabel } : b))
  }

  const handleButtonColorChange = (id: string, newColor: string) => {
    setButtons(buttons.map(b => b.id === id ? { ...b, color: newColor } : b))
  }

  const handleSaveAllUiChanges = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('mp_custom_admin_tabs', JSON.stringify(tabs))
    localStorage.setItem('mp_custom_buttons', JSON.stringify(buttons))
    localStorage.setItem('mp_brand_primary', primaryBrandColor)
    localStorage.setItem('mp_brand_title', customHeaderTitle)

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: 'SuperAdmin',
      action: 'Personnalisation Interface & Boutons 🎨',
      details: `Modification des intitulés d'onglets, couleurs et libellés de boutons`,
      severity: 'info'
    })

    toastSuccess('Interface et libellés personnalisés enregistrés avec succès !')
    onSave?.()
  }

  const handleResetToDefaults = () => {
    if (!confirm('Réinitialiser tous les onglets et boutons aux valeurs par défaut ?')) return
    setTabs(DEFAULT_TABS)
    setButtons(DEFAULT_BUTTONS)
    setPrimaryBrandColor('#f97316')
    setCustomHeaderTitle('MarchéPlus Cameroun')
    localStorage.removeItem('mp_custom_admin_tabs')
    localStorage.removeItem('mp_custom_buttons')
    localStorage.removeItem('mp_brand_primary')
    localStorage.removeItem('mp_brand_title')
    toastSuccess('Interface réinitialisée aux paramètres par défaut.')
    onSave?.()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Éditeur Global d'Onglets, Boutons & UI du Site
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prenez le contrôle total : modifiez le texte de chaque bouton, renommez ou masquez n'importe quel onglet du site.
          </p>
        </div>

        <Button type="button" variant="outline" size="sm" onClick={handleResetToDefaults} className="text-xs gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Rétablir par Défaut
        </Button>
      </div>

      <form onSubmit={handleSaveAllUiChanges} className="space-y-6">
        {/* 1. ÉDITION DE CHAQUE ONGLET DE NAVIGATION */}
        <div className="card-glass p-5 space-y-4 border-l-4 border-l-primary">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Layout className="w-4 h-4 text-primary" /> 1. Personnalisation de Chaque Onglet du Dashboard Admin
          </h3>
          <p className="text-xs text-muted-foreground">
            Renommez les intitulés de navigation et activez/masquez les onglets selon vos besoins stratégiques.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tabs.map((tab) => (
              <div key={tab.id} className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
                <button
                  type="button"
                  onClick={() => handleTabToggleVisibility(tab.id)}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${tab.visible ? 'text-emerald-400 bg-emerald-500/10' : 'text-muted-foreground bg-muted'}`}
                  title={tab.visible ? 'Onglet Visible (Cliquez pour masquer)' : 'Onglet Masqué (Cliquez pour afficher)'}
                >
                  {tab.visible ? 'Visible 👁️' : 'Caché 🚫'}
                </button>
                <div className="flex-1">
                  <Input
                    value={tab.label}
                    onChange={e => handleTabLabelChange(tab.id, e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. ÉDITION DE CHAQUE BOUTON MAJEUR DU SITE */}
        <div className="card-glass p-5 space-y-4 border-l-4 border-l-emerald-500">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-emerald-400" /> 2. Personnalisation du Texte & Couleur des Boutons
          </h3>
          <p className="text-xs text-muted-foreground">
            Changez le libellé d'appel à l'action (Call To Action) et la couleur de chaque bouton du site pour maximiser les conversions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buttons.map((btn) => (
              <div key={btn.id} className="p-4 rounded-xl bg-card border border-border space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                  <span>ID : <code className="font-mono text-foreground">{btn.id}</code></span>
                  <span className="flex items-center gap-1.5">
                    Couleur :
                    <input
                      type="color"
                      value={btn.color}
                      onChange={e => handleButtonColorChange(btn.id, e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </span>
                </div>
                <Input
                  value={btn.label}
                  onChange={e => handleButtonLabelChange(btn.id, e.target.value)}
                  className="text-xs"
                />
                {/* Aperçu en direct du bouton */}
                <div className="pt-1">
                  <button
                    type="button"
                    style={{ backgroundColor: btn.color }}
                    className="px-3.5 py-1.5 rounded-lg text-white font-bold text-xs shadow-sm"
                  >
                    Aperçu : {btn.label}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. COULEUR DE MARQUE GLOBALE */}
        <div className="card-glass p-5 space-y-4 border-l-4 border-l-purple-500">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-400" /> 3. Identité Visuelle & Couleur Maîtresse
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Titre de Marque Principal</label>
              <Input
                value={customHeaderTitle}
                onChange={e => setCustomHeaderTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground">Code Couleur Primaire Hex</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryBrandColor}
                  onChange={e => setPrimaryBrandColor(e.target.value)}
                  className="w-9 h-9 rounded cursor-pointer border border-border"
                />
                <Input
                  value={primaryBrandColor}
                  onChange={e => setPrimaryBrandColor(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bouton d'enregistrement */}
        <div className="flex justify-end pt-2">
          <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-lg shadow-primary/20">
            <Save className="w-4 h-4 mr-2" /> Appliquer & Sauvegarder les Nouveaux Libellés
          </Button>
        </div>
      </form>
    </div>
  )
}
