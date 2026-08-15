import { BookOpen, Layers, Code, CheckCircle, Database, Shield } from 'lucide-react'

export default function ProjectExplorer() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
      <div className="flex items-center gap-3 border-b border-border pb-6">
        <BookOpen className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Explorateur d'Architecture Projet</h1>
          <p className="text-sm text-muted-foreground">Vue d'ensemble technique et état de la marketplace MarchéPlus.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card-glass p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Layers className="w-5 h-5" /> Stack Technique
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> React 18 + TypeScript</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Vite 5 (Bundler ultra-rapide)</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Tailwind CSS (Styling moderne & Dark Mode)</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Lucide React (Icônes vectorielles)</li>
            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> React Router v6 (Routage SPA)</li>
          </ul>
        </div>

        <div className="card-glass p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-500 font-bold text-lg">
            <Database className="w-5 h-5" /> Persistance des données
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Store unifié en <strong>localStorage</strong> simulant les API backend Base44, incluant seed automatique de boutiques et produits de démo au premier démarrage.
          </p>
        </div>
      </div>
    </div>
  )
}
