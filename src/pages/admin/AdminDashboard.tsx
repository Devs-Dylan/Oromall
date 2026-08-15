import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Store, Package, Users, Tag, AlertTriangle, DollarSign, Home,
  Sliders, ShieldAlert, Megaphone, FileText
} from 'lucide-react'
import {
  ShopAPI, ProductAPI, HousingAPI, OrderAPI, UserAPI, ActivationAPI,
  PromoAPI, ReportAPI, VisitBookingAPI, ReferralAPI, AuditLogAPI
} from '@/lib/store'
import { formatPrice, cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

// Import 11 Superpower Admin Tabs
import { AdminKpiTab } from '@/components/admin/AdminKpiTab'
import { AdminShopsTab } from '@/components/admin/AdminShopsTab'
import { AdminProductsTab } from '@/components/admin/AdminProductsTab'
import { AdminHousingTab } from '@/components/admin/AdminHousingTab'
import { AdminUsersTab } from '@/components/admin/AdminUsersTab'
import { AdminEscrowTab } from '@/components/admin/AdminEscrowTab'
import { AdminPromosTab } from '@/components/admin/AdminPromosTab'
import { AdminReportsTab } from '@/components/admin/AdminReportsTab'
import { AdminAnnouncementTab } from '@/components/admin/AdminAnnouncementTab'
import { AdminAuditLogTab } from '@/components/admin/AdminAuditLogTab'
import { AdminSettingsTab } from '@/components/admin/AdminSettingsTab'

export default function AdminDashboard() {
  const [, forceUpdate] = useState(0)

  // 11 Superpower Tabs State
  const [activeTab, setActiveTab] = useState<
    'kpis' | 'shops' | 'products' | 'housing' | 'users' | 'payments' | 'promos' | 'reports' | 'announcements' | 'audit' | 'settings'
  >('kpis')

  const [commissionRate, setCommissionRate] = useState(5)

  const refreshData = () => forceUpdate(n => n + 1)

  const shops = ShopAPI.list()
  const products = ProductAPI.list()
  const housings = HousingAPI.list()
  const orders = OrderAPI.list()
  const users = UserAPI.list()
  const promos = PromoAPI.list()
  const reports = ReportAPI.list()
  const referrals = ReferralAPI.list()
  const auditLogs = AuditLogAPI.list()

  const totalGMV = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders])
  const platformRevenue = useMemo(() => Math.round(totalGMV * (commissionRate / 100)), [totalGMV, commissionRate])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Super-Admin Header */}
      <div className="card-glass p-6 md:p-8 bg-gradient-to-r from-slate-900 via-card to-background border-primary/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-display font-extrabold text-foreground">Console Super-Admin</h1>
              <span className="badge-primary bg-primary/20 text-primary border border-primary/30">11 Superpouvoirs Actifs ⚡</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Contrôle total sur l'ensemble des boutiques, produits, logements, utilisateurs, litiges et transactions Mobile Money.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Link to="/seller" className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow flex items-center justify-center gap-1.5 transition-all">
              Inspecter Dashboards Vendeurs 🏬
            </Link>
            <span className="px-3.5 py-2 rounded-xl bg-card border border-border text-xs font-bold text-emerald-400 text-center">
              Commissions perçues : {formatPrice(platformRevenue)}
            </span>
          </div>
        </div>
      </div>

      {/* 11 Superpower Navigation Bar */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'kpis', label: '📊 Super-Vision', icon: Shield },
          { id: 'shops', label: `🏪 Boutiques (${shops.length})`, icon: Store },
          { id: 'products', label: `🛒 Produits (${products.length})`, icon: Package },
          { id: 'housing', label: `🏠 Logements (${housings.length})`, icon: Home },
          { id: 'users', label: `👥 Utilisateurs (${users.length})`, icon: Users },
          { id: 'payments', label: `💸 MoMo Escrow (${orders.length})`, icon: DollarSign },
          { id: 'promos', label: `🎟️ Coupons (${promos.length})`, icon: Tag },
          { id: 'reports', label: `⚠️ Litiges (${reports.filter(r => r.status === 'pending').length})`, icon: ShieldAlert },
          { id: 'announcements', label: '📢 Bannière Globale', icon: Megaphone },
          { id: 'audit', label: `📜 Journal Audit (${auditLogs.length})`, icon: FileText },
          { id: 'settings', label: '⚙️ Configuration', icon: Sliders },
        ].map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn(
                'px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5',
                activeTab === t.id
                  ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'kpis' && (
        <AdminKpiTab orders={orders} shops={shops} users={users} products={products} commissionRate={commissionRate} />
      )}

      {activeTab === 'shops' && (
        <AdminShopsTab shops={shops} onRefresh={refreshData} />
      )}

      {activeTab === 'products' && (
        <AdminProductsTab products={products} onRefresh={refreshData} />
      )}

      {activeTab === 'housing' && (
        <AdminHousingTab housings={housings} onRefresh={refreshData} />
      )}

      {activeTab === 'users' && (
        <AdminUsersTab users={users} onRefresh={refreshData} />
      )}

      {activeTab === 'payments' && (
        <AdminEscrowTab orders={orders} commissionRate={commissionRate} onRefresh={refreshData} />
      )}

      {activeTab === 'promos' && (
        <AdminPromosTab promos={promos} referrals={referrals} onRefresh={refreshData} />
      )}

      {activeTab === 'reports' && (
        <AdminReportsTab reports={reports} onRefresh={refreshData} />
      )}

      {activeTab === 'announcements' && (
        <AdminAnnouncementTab />
      )}

      {activeTab === 'audit' && (
        <AdminAuditLogTab auditLogs={auditLogs} />
      )}

      {activeTab === 'settings' && (
        <AdminSettingsTab commissionRate={commissionRate} onUpdateCommission={setCommissionRate} />
      )}
    </div>
  )
}
