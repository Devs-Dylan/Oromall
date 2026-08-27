import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Store, Package, Users, Tag, DollarSign, Home,
  Sliders, ShieldAlert, Megaphone, FileText, LayoutDashboard, CreditCard, UserCheck, Calendar
} from 'lucide-react'
import {
  ShopAPI, ProductAPI, HousingAPI, OrderAPI, UserAPI, ActivationAPI,
  PromoAPI, ReportAPI, VisitBookingAPI, ReferralAPI, AuditLogAPI,
  AvailabilityRequestAPI, CommissionAPI, DisputeAPI, SubscriptionAPI, P2PAPI, VisitRequestAPI, AdAPI
} from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

import { AdminKpiTab } from '@/components/admin/AdminKpiTab'
import { AdminCatalogTab } from '@/components/admin/AdminCatalogTab'
import { AdminUsersTab } from '@/components/admin/AdminUsersTab'
import { AdminFinancialTab } from '@/components/admin/AdminFinancialTab'
import { AdminIssuesTab } from '@/components/admin/AdminIssuesTab'
import { AdminCommsTab } from '@/components/admin/AdminCommsTab'
import { AdminAuditInspectTab } from '@/components/admin/AdminAuditInspectTab'
import { AdminSettingsTab } from '@/components/admin/AdminSettingsTab'
import { AdminVisitRequestsTab } from '@/components/admin/AdminVisitRequestsTab'
import { AdminPowerHubTab } from '@/components/admin/AdminPowerHubTab'
import { AdminAdsTab } from '@/components/admin/AdminAdsTab'
import { AdminUiCustomizerTab, DEFAULT_TABS, type NavTabCustomization } from '@/components/admin/AdminUiCustomizerTab'

export default function AdminDashboard() {
  const [, forceUpdate] = useState(0)

  const [activeTab, setActiveTab] = useState<string>('kpis')

  const [customTabs, setCustomTabs] = useState<NavTabCustomization[]>(() => {
    try {
      const saved = localStorage.getItem('mp_custom_admin_tabs')
      if (saved) {
        const parsed: NavTabCustomization[] = JSON.parse(saved)
        // Ensure all DEFAULT_TABS are included
        const map = new Map(parsed.map(t => [t.id, t]))
        return DEFAULT_TABS.map(d => map.get(d.id) || d)
      }
      return DEFAULT_TABS
    } catch {
      return DEFAULT_TABS
    }
  })

  const refreshData = () => {
    try {
      const saved = localStorage.getItem('mp_custom_admin_tabs')
      if (saved) {
        const parsed: NavTabCustomization[] = JSON.parse(saved)
        const map = new Map(parsed.map(t => [t.id, t]))
        setCustomTabs(DEFAULT_TABS.map(d => map.get(d.id) || d))
      }
    } catch {}
    forceUpdate(n => n + 1)
  }

  const shops = ShopAPI.list() || []
  const products = ProductAPI.list() || []
  const housings = HousingAPI.list() || []
  const orders = OrderAPI.list() || []
  const users = UserAPI.list() || []
  const promos = PromoAPI.list() || []
  const reports = ReportAPI.list() || []
  const referrals = ReferralAPI.list() || []
  const auditLogs = AuditLogAPI.list() || []
  const availabilityRequests = AvailabilityRequestAPI.list() || []
  const commissions = CommissionAPI.list() || []
  const disputes = DisputeAPI.list() || []
  const subscriptions = SubscriptionAPI.list() || []
  const p2pAccounts = P2PAPI.list() || []
  const visitRequests = VisitRequestAPI.list() || []
  const ads = AdAPI.list() || []

  const totalGMV = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders])

  return (
    <ErrorBoundary fallbackTitle="Erreur dans la Console d'Administration">
      <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8 animate-in fade-in duration-200">
        {/* Super-Admin Header */}
        <div className="card-glass p-6 md:p-8 bg-gradient-to-r from-slate-900 via-card to-background border-primary/30 rounded-3xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-display font-extrabold text-foreground">Console Administrateur</h1>
                <span className="badge-primary bg-primary/20 text-primary border border-primary/30">Gestion Globale OroMall</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Contrôle total sur l'ensemble des boutiques, produits, logements, utilisateurs, publicités et transactions Mobile Money.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Link to="/seller" className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow flex items-center justify-center gap-1.5 transition-all">
                Inspecter Dashboards Vendeurs 🏬
              </Link>
              <span className="px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-bold text-emerald-400 text-center">
                Commissions perçues : {formatPrice(commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center gap-1.5 border-b border-border pb-2 overflow-x-auto scrollbar-none">
          {customTabs.filter(t => t.visible).map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5',
                activeTab === t.id
                  ? 'bg-primary text-black shadow-md shadow-primary/20 scale-105'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('uicustomizer')}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border border-purple-500/40',
              activeTab === 'uicustomizer'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-purple-400 hover:bg-purple-500/10'
            )}
          >
            🎨 Personnaliser Onglets & Boutons
          </button>
        </div>

        {/* Tab Contents Wrapped in Error Boundaries */}
        <div className="min-h-[400px]">
          {activeTab === 'kpis' && (
            <ErrorBoundary fallbackTitle="Erreur dans l'onglet KPI">
              <AdminKpiTab orders={orders} shops={shops} users={users} products={products} commissionRate={5} />
            </ErrorBoundary>
          )}

          {activeTab === 'ads' && (
            <ErrorBoundary fallbackTitle="Erreur dans l'onglet Publicités">
              <AdminAdsTab ads={ads} onRefresh={refreshData} />
            </ErrorBoundary>
          )}

          {activeTab === 'catalog' && (
            <ErrorBoundary fallbackTitle="Erreur dans l'onglet Catalogue">
              <AdminCatalogTab onRefresh={refreshData} />
            </ErrorBoundary>
          )}

          {activeTab === 'users' && (
            <ErrorBoundary fallbackTitle="Erreur dans l'onglet Utilisateurs">
              <AdminUsersTab users={users} onRefresh={refreshData} />
            </ErrorBoundary>
          )}

          {activeTab === 'commissions' && (
            <ErrorBoundary fallbackTitle="Erreur dans l'onglet Commissions">
              <AdminFinancialTab orders={orders} commissions={commissions} subscriptions={subscriptions} p2pAccounts={p2pAccounts} initialView="commissions" onRefresh={refreshData} />
            </ErrorBoundary>
          )}

          {activeTab === 'subscriptions' && (
            <ErrorBoundary fallbackTitle="Erreur dans l'onglet Abonnements">
              <AdminFinancialTab orders={orders} commissions={commissions} subscriptions={subscriptions} p2pAccounts={p2pAccounts} initialView="subscriptions" onRefresh={refreshData} />
            </ErrorBoundary>
          )}

          {activeTab === 'financial' && (
            <ErrorBoundary fallbackTitle="Erreur dans l'onglet Finances">
              <AdminFinancialTab orders={orders} commissions={commissions} subscriptions={subscriptions} p2pAccounts={p2pAccounts} onRefresh={refreshData} />
            </ErrorBoundary>
          )}

          {activeTab === 'issues' && (
            <ErrorBoundary fallbackTitle="Erreur dans l'onglet Litiges">
              <AdminIssuesTab reports={reports} disputes={disputes} onRefresh={refreshData} />
            </ErrorBoundary>
          )}

          {activeTab === 'comms' && (
            <ErrorBoundary fallbackTitle="Erreur dans l'onglet Communication">
              <AdminCommsTab promos={promos} referrals={referrals} onRefresh={refreshData} />
            </ErrorBoundary>
          )}

          {activeTab === 'auditInspect' && (
            <ErrorBoundary fallbackTitle="Erreur dans l'onglet Audit">
              <AdminAuditInspectTab auditLogs={auditLogs} shops={shops.map(s => ({ id: s.id, name: s.name, city: s.city, status: s.status }))} />
            </ErrorBoundary>
          )}

          {activeTab === 'settings' && (
            <ErrorBoundary fallbackTitle="Erreur dans l'onglet Configuration">
              <AdminSettingsTab commissionRate={5} onUpdateCommission={() => {}} />
            </ErrorBoundary>
          )}

          {activeTab === 'visits' && (
            <ErrorBoundary fallbackTitle="Erreur dans l'onglet Visites">
              <AdminVisitRequestsTab onRefresh={refreshData} />
            </ErrorBoundary>
          )}

          {activeTab === 'powerhub' && (
            <ErrorBoundary fallbackTitle="Erreur dans le PowerHub">
              <AdminPowerHubTab onRefresh={refreshData} />
            </ErrorBoundary>
          )}

          {activeTab === 'uicustomizer' && (
            <ErrorBoundary fallbackTitle="Erreur dans le Personnalisateur UI">
              <AdminUiCustomizerTab onSave={refreshData} />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </ErrorBoundary>
  )
}
