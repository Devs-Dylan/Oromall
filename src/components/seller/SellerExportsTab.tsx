import { Download, FileSpreadsheet, Package, Home, ShoppingBag, CheckCircle } from 'lucide-react'
import type { Order, Product, Housing } from '@/types'
import { Button } from '@/components/ui/Button'
import { toastSuccess } from '@/components/ui/Toast'

interface SellerExportsTabProps {
  orders: Order[]
  products: Product[]
  housings: Housing[]
}

export function SellerExportsTab({ orders, products, housings }: SellerExportsTabProps) {
  
  const exportCSV = (filename: string, rows: (string | number)[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportOrders = () => {
    const rows = [
      ['ID Commande', 'Acheteur', 'Téléphone', 'Produit', 'Montant (FCFA)', 'Statut', 'Date'],
      ...orders.map(o => [
        o.id,
        o.customer_name,
        o.customer_phone || '',
        o.product_name,
        o.total,
        o.status,
        o.created_date
      ])
    ]
    exportCSV(`marcheplus_ventes_${new Date().toISOString().slice(0, 10)}.csv`, rows)
    toastSuccess('Rapport des commandes exporté au format CSV !')
  }

  const handleExportProducts = () => {
    const rows = [
      ['ID Produit', 'Nom Produit', 'Catégorie', 'Prix (FCFA)', 'Stock', 'État', 'Statut'],
      ...products.map(p => [
        p.id,
        p.name,
        p.category,
        p.price,
        p.stock,
        p.condition,
        p.status
      ])
    ]
    exportCSV(`marcheplus_catalogue_${new Date().toISOString().slice(0, 10)}.csv`, rows)
    toastSuccess('Catalogue produits exporté au format CSV !')
  }

  const handleExportHousings = () => {
    const rows = [
      ['ID Logement', 'Titre', 'Catégorie', 'Prix (FCFA)', 'Période', 'Ville', 'Quartier', 'Statut'],
      ...housings.map(h => [
        h.id,
        h.title,
        h.category,
        h.price,
        h.price_type,
        h.city,
        h.neighborhood,
        h.status
      ])
    ]
    exportCSV(`marcheplus_logements_${new Date().toISOString().slice(0, 10)}.csv`, rows)
    toastSuccess('Inventaire des logements exporté au format CSV !')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Exports CSV & Rapports Vendeur
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Téléchargez vos rapports d'activité, registres de comptabilité et catalogues en 1 clic.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Export Orders */}
        <div className="card-glass p-6 space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">Rapport des Ventes & Commandes</h3>
            <p className="text-xs text-muted-foreground">
              Exporter les détails de toutes les commandes reçues ({orders.length}), noms des clients, preuves de paiement MoMo et statuts.
            </p>
          </div>

          <Button onClick={handleExportOrders} variant="outline" className="w-full text-xs gap-1.5 border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
            <Download className="w-4 h-4" /> Exporter Ventes CSV
          </Button>
        </div>

        {/* Export Products */}
        <div className="card-glass p-6 space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">Catalogue Produits Shopify</h3>
            <p className="text-xs text-muted-foreground">
              Exporter la liste complète des articles du catalogue ({products.length}), leurs prix, niveaux de stock et état.
            </p>
          </div>

          <Button onClick={handleExportProducts} variant="outline" className="w-full text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10">
            <Download className="w-4 h-4" /> Exporter Produits CSV
          </Button>
        </div>

        {/* Export Housing */}
        <div className="card-glass p-6 space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Home className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-foreground">Portefeuille Immobilier</h3>
            <p className="text-xs text-muted-foreground">
              Exporter les offres locatives ({housings.length}), catégories (studios, villas...), loyers et état d'occupation.
            </p>
          </div>

          <Button onClick={handleExportHousings} variant="outline" className="w-full text-xs gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10">
            <Download className="w-4 h-4" /> Exporter Logements CSV
          </Button>
        </div>
      </div>
    </div>
  )
}
