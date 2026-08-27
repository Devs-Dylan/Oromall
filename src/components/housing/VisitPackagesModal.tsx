import { useState } from 'react'
import { X, CheckCircle, Star } from 'lucide-react'
import type { VisitPackage } from '@/types'
import { VISIT_PACKAGES } from '@/types'
import { Button } from '@/components/ui/Button'

interface VisitPackagesModalProps {
  open: boolean
  onClose: () => void
  onSelect: (pkg: VisitPackage) => void
}

export function VisitPackagesModal({ open, onClose, onSelect }: VisitPackagesModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="card-glass p-6 md:p-8 max-w-lg w-full space-y-6 animate-in fade-in duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display text-foreground">Forfaits de Visite</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Choisissez le forfait qui vous convient pour visiter ce logement.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {VISIT_PACKAGES.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => onSelect(pkg.id)}
              className="p-5 rounded-2xl border-2 border-border hover:border-primary bg-card hover:bg-muted/50 transition-all text-left group"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {pkg.id === 'premium' && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">{pkg.label}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{pkg.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {pkg.visits} visite{pkg.visits > 1 ? 's' : ''} • {pkg.price.toLocaleString()} FCFA
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-foreground">{pkg.price.toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground block">FCFA</span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <CheckCircle className="w-3.5 h-3.5" /> Choisir ce forfait
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
