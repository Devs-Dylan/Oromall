import { useState } from 'react'
import { Megaphone, Check, Sparkles, Eye, AlertCircle } from 'lucide-react'
import { AuditLogAPI } from '@/lib/store'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

interface AdminAnnouncementTabProps {
  adminName?: string
}

export function AdminAnnouncementTab({ adminName = 'SuperAdmin' }: AdminAnnouncementTabProps) {
  const [announcementText, setAnnouncementText] = useState(() => {
    return localStorage.getItem('mp_announcement') || '🔥 Offres spéciales rentrée académique : Jusqu\'à -20% sur la catégorie Électronique !'
  })
  const [enabled, setEnabled] = useState(() => localStorage.getItem('mp_announcement_enabled') !== '0')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('mp_announcement', announcementText)
    localStorage.setItem('mp_announcement_enabled', enabled ? '1' : '0')

    AuditLogAPI.create({
      timestamp: new Date().toISOString(),
      admin_name: adminName,
      action: 'Mise à jour Bannière d\'Annonce Globale',
      details: `Texte: "${announcementText}" (${enabled ? 'Actif' : 'Masqué'})`,
      severity: 'info'
    })

    toastSuccess('Bannière d\'annonce globale mise à jour sur tout le site !')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-amber-400" /> Bannière d'Annonce Globale du Site
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Diffusez une annonce importante ou un flash promotionnel visible immédiatement en haut de toutes les pages.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <form onSubmit={handleSave} className="lg:col-span-2 card-glass p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-sm font-bold text-foreground">Éditeur de la Bannière Flash</h3>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span>Afficher la bannière sur le site</span>
            </label>
          </div>

          <Textarea
            label="Texte de l'annonce flash"
            value={announcementText}
            onChange={(e) => setAnnouncementText(e.target.value)}
            placeholder="Entrez le message d'annonce d'urgence ou de promotion..."
            rows={4}
            required
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" className="gap-1.5 shadow-lg shadow-primary/20">
              <Check className="w-4 h-4" /> Publier l'Annonce
            </Button>
          </div>
        </form>

        {/* Live Preview */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Eye className="w-4 h-4 text-primary" /> Aperçu Visuel
          </h3>

          <div className="card-glass p-4 space-y-3">
            <p className="text-xs text-muted-foreground">La bannière apparaîtra ainsi en haut de l'écran :</p>

            {enabled ? (
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary via-purple-600 to-amber-500 text-white text-xs font-bold shadow-lg animate-pulse">
                {announcementText}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-muted text-muted-foreground text-xs text-center border border-dashed border-border">
                La bannière est actuellement désactivée.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
