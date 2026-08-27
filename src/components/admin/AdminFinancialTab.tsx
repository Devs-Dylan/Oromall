import { useState, useMemo } from 'react'
import { DollarSign, CreditCard, ShieldCheck, AlertTriangle, CheckCircle, XCircle, Search, Download, TrendingUp, Wallet, Users, Phone, RefreshCw, Key, FileText, Printer, Trash2, Edit3, Eye } from 'lucide-react'
import type { Order, Commission, Subscription, P2PAccount } from '@/types'
import { OrderAPI, CommissionAPI, SubscriptionAPI, NotificationAPI, AuditLogAPI, P2PAPI, ShopAPI } from '@/lib/store'
import { formatPrice, formatDate, cn, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { toastSuccess, toastError } from '@/components/ui/Toast'

interface AdminFinancialTabProps {
  orders: Order[]
  commissions: Commission[]
  subscriptions: Subscription[]
  p2pAccounts: P2PAccount[]
  adminName?: string
  initialView?: FinancialView
  onRefresh: () => void
}

type FinancialView = 'kpis' | 'orders' | 'commissions' | 'subscriptions' | 'withdrawals' | 'p2p'

export function AdminFinancialTab({ orders, commissions, subscriptions, p2pAccounts, adminName = 'SuperAdmin', initialView, onRefresh }: AdminFinancialTabProps) {
  const [view, setView] = useState<FinancialView>(initialView || 'kpis')

  const [commissionFilter, setCommissionFilter] = useState<'all' | 'pending' | 'paid' | 'cancelled'>('all')
  const [commissionSearch, setCommissionSearch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<string>('all')

  const [orderFilter, setOrderFilter] = useState<'all' | 'pending_payment' | 'payment_uploaded' | 'payment_verified' | 'completed'>('all')
  const [orderSearch, setOrderSearch] = useState('')
  const [inspectOrder, setInspectOrder] = useState<Order | null>(null)

  const [subFilter, setSubFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'suspended'>('all')
  const [subSearch, setSubSearch] = useState('')

  const [withdrawalFilter, setWithdrawalFilter] = useState<'all' | 'pending' | 'verified' | 'completed'>('all')
  const [withdrawalSearch, setWithdrawalSearch] = useState('')

  const [p2pFilter, setP2pFilter] = useState<'all' | 'pending' | 'active' | 'expired'>('all')
  const [p2pSearch, setP2pSearch] = useState('')

  const pendingCommissions = useMemo(() => commissions.filter(c => c.status === 'pending'), [commissions])
  const paidCommissions = useMemo(() => commissions.filter(c => c.status === 'paid'), [commissions])
  const cancelledCommissions = useMemo(() => commissions.filter(c => c.status === 'cancelled'), [commissions])
  const totalPending = useMemo(() => pendingCommissions.reduce((s, c) => s + c.amount, 0), [pendingCommissions])
  const totalPaid = useMemo(() => paidCommissions.reduce((s, c) => s + c.amount, 0), [paidCommissions])
  const totalCancelled = useMemo(() => cancelledCommissions.reduce((s, c) => s + c.amount, 0), [cancelledCommissions])

  const totalGMV = useMemo(() => orders.reduce((sum, o) => sum + o.total, 0), [orders])
  const platformRevenue = useMemo(() => totalPaid, [totalPaid])
  const avgOrderValue = useMemo(() => orders.length ? totalGMV / orders.length : 0, [orders, totalGMV])

  const totalWithdrawalPending = useMemo(() => orders.filter(o => o.withdrawal_status === 'pending').reduce((s, o) => s + (o.total || 0), 0), [orders])
  const totalWithdrawalVerified = useMemo(() => orders.filter(o => o.withdrawal_status === 'verified').reduce((s, o) => s + (o.total || 0), 0), [orders])
  const totalWithdrawalCompleted = useMemo(() => orders.filter(o => o.withdrawal_status === 'completed').reduce((s, o) => s + (o.total || 0), 0), [orders])

  const totalP2PFees = useMemo(() => p2pAccounts.reduce((s, p) => s + (p.activation_fee || 0), 0), [p2pAccounts])
  const activeP2P = useMemo(() => p2pAccounts.filter(p => p.status === 'active'), [p2pAccounts])
  const pendingP2P = useMemo(() => p2pAccounts.filter(p => p.status === 'pending'), [p2pAccounts])

  const commissionsByVendor = useMemo(() => {
    const map = new Map<string, { vendor_email: string; vendor_name: string; shop_name: string; shop_id: string; salesVolume: number; total: number; pending: number; paid: number; cancelled: number; count: number }>()
    commissions.forEach(c => {
      const key = c.vendor_email || c.shop_name || c.shop_id || 'vendeur_inconnu'
      if (!map.has(key)) map.set(key, { vendor_email: c.vendor_email, vendor_name: c.vendor_name || c.shop_name, shop_name: c.shop_name, shop_id: c.shop_id, salesVolume: 0, total: 0, pending: 0, paid: 0, cancelled: 0, count: 0 })
      const entry = map.get(key)!
      entry.salesVolume += (c.order_total || 0)
      entry.total += c.amount
      entry.count += 1
      if (c.status === 'pending') entry.pending += c.amount
      else if (c.status === 'paid') entry.paid += c.amount
      else if (c.status === 'cancelled') entry.cancelled += c.amount
    })
    return Array.from(map.values())
  }, [commissions])

  const handlePayVendorCommissions = (vendorKey: string, shopName: string) => {
    const pendingList = commissions.filter(c => ((c.vendor_email && c.vendor_email === vendorKey) || c.shop_name === shopName) && c.status === 'pending')
    if (pendingList.length === 0) {
      toastError('Aucune commission en attente pour ce vendeur')
      return
    }
    const totalAmount = pendingList.reduce((s, c) => s + c.amount, 0)
    if (!confirm(`Confirmer le règlement de ${formatPrice(totalAmount)} de commissions pour "${shopName}" ?`)) return
    pendingList.forEach(c => CommissionAPI.update(c.id, { status: 'paid', paid_at: new Date().toISOString() }))
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Règlement Commission Vendeur', details: `Règlement de ${formatPrice(totalAmount)} pour ${shopName}`, severity: 'info' })
    toastSuccess(`Commissions de ${shopName} marquées comme réglées (${formatPrice(totalAmount)})`)
    onRefresh()
  }

  const handleWhatsAppVendorReminder = (vendorName: string, shopName: string, pendingAmount: number, salesVolume: number) => {
    const shop = ShopAPI.filter(s => s.name === shopName || s.owner_name === vendorName)[0]
    const phone = shop?.whatsapp_number || shop?.mtn_number || shop?.orange_number
    if (!phone) {
      toastError(`Numéro WhatsApp introuvable pour ${shopName}`)
      return
    }
    const message = `Bonjour ${vendorName} (${shopName}),\n\nSur la plateforme OroMall, le volume total de vos produits vendus s'élève à ${formatPrice(salesVolume)}.\nLa commission de 2% due s'élève actuellement à : *${formatPrice(pendingAmount)}*.\n\nMerci d'effectuer le versement afin de régulariser votre compte.`
    const url = buildWhatsAppUrl(phone, message)
    window.open(url, '_blank')
  }

  const filteredCommissions = useMemo(() => {
    return commissions.filter(c => {
      if (commissionFilter !== 'all' && c.status !== commissionFilter) return false
      if (selectedVendor !== 'all' && c.vendor_email !== selectedVendor) return false
      if (commissionSearch && !c.shop_name.toLowerCase().includes(commissionSearch.toLowerCase()) && !c.vendor_name.toLowerCase().includes(commissionSearch.toLowerCase()) && !c.order_id.toLowerCase().includes(commissionSearch.toLowerCase())) return false
      return true
    })
  }, [commissions, commissionFilter, selectedVendor, commissionSearch])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (orderFilter !== 'all' && o.status !== orderFilter) return false
      if (orderSearch && !o.customer_name.toLowerCase().includes(orderSearch.toLowerCase()) && !o.shop_name.toLowerCase().includes(orderSearch.toLowerCase())) return false
      return true
    })
  }, [orders, orderFilter, orderSearch])

  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter(s => {
      if (subFilter !== 'all' && s.status !== subFilter) return false
      if (subSearch && !s.shop_name.toLowerCase().includes(subSearch.toLowerCase()) && !s.owner_name.toLowerCase().includes(subSearch.toLowerCase())) return false
      return true
    })
  }, [subscriptions, subFilter, subSearch])

  const filteredWithdrawals = useMemo(() => {
    return orders.filter(o => {
      if (!o.withdrawal_status) return false
      if (withdrawalFilter !== 'all' && o.withdrawal_status !== withdrawalFilter) return false
      if (withdrawalSearch && !o.customer_name.toLowerCase().includes(withdrawalSearch.toLowerCase()) && !o.shop_name.toLowerCase().includes(withdrawalSearch.toLowerCase())) return false
      return true
    })
  }, [orders, withdrawalFilter, withdrawalSearch])

  const filteredP2P = useMemo(() => {
    return p2pAccounts.filter(p => {
      if (p2pFilter !== 'all' && p.status !== p2pFilter) return false
      if (p2pSearch && !p.user_name.toLowerCase().includes(p2pSearch.toLowerCase()) && !p.user_email.toLowerCase().includes(p2pSearch.toLowerCase())) return false
      return true
    })
  }, [p2pAccounts, p2pFilter, p2pSearch])

  const handleMarkCommissionPaid = async (id: string) => {
    CommissionAPI.update(id, { status: 'paid', paid_at: new Date().toISOString() })
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Paiement Commission', details: `Commission ${id} marquée payée`, severity: 'info' })
    toastSuccess('Commission marquée comme payée')
    onRefresh()
  }

  const handleCancelCommission = async (id: string) => {
    CommissionAPI.update(id, { status: 'cancelled' })
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Annulation Commission', details: `Commission ${id} annulée`, severity: 'warning' })
    toastSuccess('Commission annulée')
    onRefresh()
  }

  const handleBulkPayCommissions = async () => {
    const pending = commissions.filter(c => c.status === 'pending')
    if (pending.length === 0) { toastError('Aucune commission en attente'); return }
    if (!confirm(`Marquer ${pending.length} commission(s) comme payées ?`)) return
    pending.forEach(c => CommissionAPI.update(c.id, { status: 'paid', paid_at: new Date().toISOString() }))
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Paiement Bulk Commissions', details: `${pending.length} commissions marquées payées`, severity: 'info' })
    toastSuccess(`${pending.length} commissions payées`)
    onRefresh()
  }

  const handleVerifyPayment = async (orderId: string) => {
    OrderAPI.update(orderId, { status: 'payment_verified' })
    const order = orders.find(o => o.id === orderId)
    if (order) NotificationAPI.create({ user_email: order.customer_email, title: 'Paiement vérifié', message: `Votre paiement pour la commande #${orderId.slice(0, 8)} a été vérifié.`, type: 'system', read: false })
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Vérification Paiement', details: `Commande ${orderId} vérifiée`, severity: 'info' })
    toastSuccess('Paiement vérifié')
    onRefresh()
  }

  const handleContactCustomer = (order: Order) => {
    if (!order.customer_phone) return
    const url = buildWhatsAppUrl(order.customer_phone, `Bonjour ${order.customer_name}, concernant votre commande #${order.id.slice(0, 8)} d'un montant de ${formatPrice(order.total)}.`)
    window.open(url, '_blank')
  }

  const handleValidateSubscription = async (sub: Subscription) => {
    const newEndDate = new Date()
    newEndDate.setDate(newEndDate.getDate() + 30)
    SubscriptionAPI.update(sub.id, { status: 'active', start_date: new Date().toISOString(), end_date: newEndDate.toISOString(), days_remaining: 30, updated_date: new Date().toISOString() })
    NotificationAPI.create({ user_email: sub.owner_email, title: 'Abonnement activé !', message: `Votre abonnement pour "${sub.shop_name}" est maintenant actif pour 30 jours.`, type: 'system', read: false })
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Validation Abonnement', details: `Abonnement ${sub.id} activé (30 jours)`, severity: 'info' })
    toastSuccess('Abonnement activé pour 30 jours')
    onRefresh()
  }

  const handleRejectSubscription = async (sub: Subscription) => {
    SubscriptionAPI.update(sub.id, { status: 'expired', updated_date: new Date().toISOString() })
    NotificationAPI.create({ user_email: sub.owner_email, title: "Paiement d'abonnement refusé", message: `Votre preuve de paiement pour "${sub.shop_name}" n'a pas pu être validée.`, type: 'system', read: false })
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Refus Abonnement', details: `Abonnement ${sub.id} refusé`, severity: 'warning' })
    toastSuccess('Paiement refusé')
    onRefresh()
  }

  const handleSuspendSubscription = async (sub: Subscription) => {
    SubscriptionAPI.update(sub.id, { status: 'suspended', updated_date: new Date().toISOString() })
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Suspension Abonnement', details: `Abonnement ${sub.id} suspendu`, severity: 'danger' })
    toastSuccess('Abonnement suspendu')
    onRefresh()
  }

  const handleReactivateSubscription = async (sub: Subscription) => {
    SubscriptionAPI.update(sub.id, { status: 'active', days_remaining: 30, updated_date: new Date().toISOString() })
    NotificationAPI.create({ user_email: sub.owner_email, title: 'Abonnement réactivé', message: `Votre abonnement pour "${sub.shop_name}" a été réactivé pour 30 jours.`, type: 'system', read: false })
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Réactivation Abonnement', details: `Abonnement ${sub.id} réactivé`, severity: 'info' })
    toastSuccess('Abonnement réactivé pour 30 jours')
    onRefresh()
  }

  const handleRenewSubscription = async (sub: Subscription) => {
    const newEndDate = new Date()
    newEndDate.setDate(newEndDate.getDate() + 30)
    SubscriptionAPI.update(sub.id, { status: 'active', start_date: new Date().toISOString(), end_date: newEndDate.toISOString(), days_remaining: 30, updated_date: new Date().toISOString() })
    NotificationAPI.create({ user_email: sub.owner_email, title: 'Abonnement renouvelé !', message: `Votre abonnement pour "${sub.shop_name}" a été renouvelé pour 30 jours supplémentaires.`, type: 'system', read: false })
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Renouvellement Abonnement', details: `Abonnement ${sub.id} renouvelé 30j`, severity: 'info' })
    toastSuccess('Abonnement renouvelé pour 30 jours')
    onRefresh()
  }

  const handleWithdrawAction = async (orderId: string, action: 'verify' | 'complete' | 'reject') => {
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    if (action === 'verify') {
      if (!order.withdrawal_pin) { toastError('PIN de retrait manquant'); return }
      OrderAPI.update(orderId, { withdrawal_status: 'verified', withdrawal_pin: order.withdrawal_pin })
      NotificationAPI.create({ user_email: order.customer_email, title: 'PIN de retrait vérifié', message: `Votre PIN pour la commande #${orderId.slice(0, 8)} a été vérifié. Procédez au retrait.`, type: 'system', read: false })
      AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Vérification PIN Retrait', details: `Commande ${orderId} PIN vérifié`, severity: 'info' })
      toastSuccess('PIN vérifié, retrait autorisé')
    } else if (action === 'complete') {
      OrderAPI.update(orderId, { withdrawal_status: 'completed' })
      NotificationAPI.create({ user_email: order.customer_email, title: 'Retrait effectué', message: `Votre retrait pour la commande #${orderId.slice(0, 8)} a été effectué avec succès.`, type: 'system', read: false })
      AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Retrait Complété', details: `Commande ${orderId} retrait effectué`, severity: 'info' })
      toastSuccess('Retrait marqué comme effectué')
    } else {
      OrderAPI.update(orderId, { withdrawal_status: 'pending' })
      NotificationAPI.create({ user_email: order.customer_email, title: 'PIN de retrait refusé', message: `Votre PIN pour la commande #${orderId.slice(0, 8)} a été refusé. Veuillez réessayer.`, type: 'system', read: false })
      AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Refus PIN Retrait', details: `Commande ${orderId} PIN refusé`, severity: 'warning' })
      toastSuccess('Retrait refusé')
    }
    onRefresh()
  }

  const handleActivateP2P = async (account: P2PAccount) => {
    P2PAPI.update(account.id, { status: 'active', activated_at: new Date().toISOString() })
    NotificationAPI.create({ user_email: account.user_email, title: 'Compte P2P activé !', message: 'Votre compte P2P est maintenant actif.', type: 'system', read: false })
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Activation P2P', details: `Compte P2P ${account.id} activé`, severity: 'info' })
    toastSuccess('Compte P2P activé')
    onRefresh()
  }

  const handleRejectP2P = async (account: P2PAccount) => {
    P2PAPI.update(account.id, { status: 'expired' })
    NotificationAPI.create({ user_email: account.user_email, title: 'Compte P2P refusé', message: 'Votre demande de compte P2P n\'a pas pu être validée.', type: 'system', read: false })
    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Refus P2P', details: `Compte P2P ${account.id} refusé`, severity: 'warning' })
    toastSuccess('Compte P2P refusé')
    onRefresh()
  }

  const handleExportCommissionsCSV = () => {
    const rows: string[][] = [['ID', 'Boutique', 'Vendeur', 'Commande', 'Total Vente', 'Taux', 'Commission', 'Statut', 'Date']]
    filteredCommissions.forEach(c => rows.push([c.id, c.shop_name, c.vendor_name, c.order_id.slice(0, 8), c.order_total.toString(), c.rate + '%', c.amount.toString(), c.status, c.created_date]))
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csv))
    link.setAttribute('download', `commissions_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toastSuccess('Commissions exportées en CSV')
  }

  const handleExportOrdersCSV = () => {
    const rows: string[][] = [['ID', 'Client', 'Boutique', 'Montant', 'Statut', 'Date']]
    filteredOrders.forEach(o => rows.push([o.id, o.customer_name, o.shop_name, o.total.toString(), o.status, o.created_date]))
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csv))
    link.setAttribute('download', `commandes_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toastSuccess('Commandes exportées en CSV')
  }

  const handleExportWithdrawalsCSV = () => {
    const rows: string[][] = [['ID', 'Client', 'Boutique', 'Montant', 'Statut Retrait', 'PIN', 'Date']]
    filteredWithdrawals.forEach(o => rows.push([o.id, o.customer_name, o.shop_name, o.total.toString(), o.withdrawal_status || '-', o.withdrawal_pin || '-', o.created_date]))
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csv))
    link.setAttribute('download', `retraits_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toastSuccess('Retraits exportés en CSV')
  }

  const handleExportP2PCSV = () => {
    const rows: string[][] = [['ID', 'Utilisateur', 'Email', 'Statut', 'Frais activation', 'Date']]
    filteredP2P.forEach(p => rows.push([p.id, p.user_name, p.user_email, p.status, (p.activation_fee || 0).toString(), p.created_date]))
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const link = document.createElement('a')
    link.setAttribute('href', encodeURI(csv))
    link.setAttribute('download', `p2p_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toastSuccess('P2P exporté en CSV')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            💰 Finances & Paiements
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Le centre de revenu de la plateforme : commissions, escrow, abonnements, retraits, P2P.</p>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-1.5 border-b border-border pb-2 overflow-x-auto">
        {[
          { id: 'kpis', label: '📊 KPIs', icon: TrendingUp },
          { id: 'orders', label: `💸 Commandes (${orders.length})`, icon: DollarSign },
          { id: 'commissions', label: `💸 Commissions (${formatPrice(totalPaid + totalPending)})`, icon: CreditCard },
          { id: 'subscriptions', label: `💳 Abonnements (${subscriptions.length})`, icon: ShieldCheck },
          { id: 'withdrawals', label: `🏦 Retraits (${formatPrice(totalWithdrawalPending + totalWithdrawalVerified + totalWithdrawalCompleted)})`, icon: Wallet },
          { id: 'p2p', label: `🤝 P2P (${p2pAccounts.length})`, icon: Users },
        ].map(t => {
          const Icon = t.icon
          return (
            <button key={t.id} onClick={() => setView(t.id as FinancialView)} className={cn('px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5', view === t.id ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          )
        })}
      </div>

      {/* KPIs View */}
      {view === 'kpis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-glass p-5 border border-emerald-500/30">
              <p className="text-xs text-muted-foreground font-semibold">GMV Total</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{formatPrice(totalGMV)}</p>
              <p className="text-xs text-muted-foreground">{orders.length} commandes</p>
            </div>
            <div className="card-glass p-5 border border-primary/30">
              <p className="text-xs text-muted-foreground font-semibold">Revenus Plateforme</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{formatPrice(platformRevenue)}</p>
              <p className="text-xs text-muted-foreground">Commissions payées</p>
            </div>
            <div className="card-glass p-5 border border-amber-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Commissions en attente</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{formatPrice(totalPending)}</p>
              <p className="text-xs text-muted-foreground">{pendingCommissions.length} en attente</p>
            </div>
            <div className="card-glass p-5 border border-blue-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Panier Moyen</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{formatPrice(Math.round(avgOrderValue))}</p>
              <p className="text-xs text-muted-foreground">Par commande</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-glass p-5 border border-emerald-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Retraits Complétés</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{formatPrice(totalWithdrawalCompleted)}</p>
              <p className="text-xs text-muted-foreground">{orders.filter(o => o.withdrawal_status === 'completed').length} retraits</p>
            </div>
            <div className="card-glass p-5 border border-amber-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Retraits en attente PIN</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{formatPrice(totalWithdrawalPending)}</p>
              <p className="text-xs text-muted-foreground">{orders.filter(o => o.withdrawal_status === 'pending').length} en attente</p>
            </div>
            <div className="card-glass p-5 border border-blue-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Frais P2P Collectés</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{formatPrice(totalP2PFees)}</p>
              <p className="text-xs text-muted-foreground">{activeP2P.length} comptes actifs</p>
            </div>
            <div className="card-glass p-5 border border-primary/30">
              <p className="text-xs text-muted-foreground font-semibold">Abonnements Actifs</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{subscriptions.filter(s => s.status === 'active').length}</p>
              <p className="text-xs text-muted-foreground">{formatPrice(subscriptions.filter(s => s.status === 'active').reduce((s, x) => s + x.amount, 0))} / mois</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-glass p-5 border border-emerald-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Abonnements en attente</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{subscriptions.filter(s => s.status === 'expiring').length}</p>
              <p className="text-xs text-muted-foreground">Validation requise</p>
            </div>
            <div className="card-glass p-5 border border-red-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Abonnements expirés/suspendus</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{subscriptions.filter(s => s.status === 'expired' || s.status === 'suspended').length}</p>
              <p className="text-xs text-muted-foreground">Action requise</p>
            </div>
            <div className="card-glass p-5 border border-primary/30">
              <p className="text-xs text-muted-foreground font-semibold">Total Plateforme</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{formatPrice(platformRevenue + totalP2PFees + subscriptions.filter(s => s.status === 'active').reduce((s, x) => s + x.amount, 0))}</p>
              <p className="text-xs text-muted-foreground">Revenus mensuels estimés</p>
            </div>
          </div>
          <div className="card-glass p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Commissions par Vendeur (Top 10)</h3>
            <div className="space-y-2">
              {commissionsByVendor.length === 0 ? (
                <p className="text-xs text-muted-foreground">Aucune commission enregistrée.</p>
              ) : (
                commissionsByVendor.slice(0, 10).map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/40">
                    <div>
                      <p className="text-xs font-bold text-foreground">{v.vendor_name} <span className="text-muted-foreground">({v.shop_name})</span></p>
                      <p className="text-[10px] text-muted-foreground">{v.count} commande(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-foreground">{formatPrice(v.total)}</p>
                      <p className="text-[10px] text-muted-foreground">Payé: {formatPrice(v.paid)} • En attente: {formatPrice(v.pending)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders View */}
      {view === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Rechercher client, boutique..." className="pl-9 text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <select value={orderFilter} onChange={e => setOrderFilter(e.target.value as any)} className="bg-card text-foreground text-xs font-bold px-3 py-2 rounded-xl border border-border">
                <option value="all">Tous les statuts</option>
                <option value="pending_payment">En attente</option>
                <option value="payment_uploaded">Preuve envoyée</option>
                <option value="payment_verified">Vérifiée</option>
                <option value="completed">Complétée</option>
              </select>
              <Button onClick={handleExportOrdersCSV} variant="outline" className="text-xs gap-1.5"><Download className="w-4 h-4" /> CSV</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card-glass p-4 border border-amber-500/30">
              <p className="text-xs text-muted-foreground font-semibold">En attente paiement</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{orders.filter(o => o.status === 'pending_payment').length}</p>
            </div>
            <div className="card-glass p-4 border border-blue-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Preuve envoyée</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{orders.filter(o => o.status === 'payment_uploaded').length}</p>
            </div>
            <div className="card-glass p-4 border border-emerald-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Vérifiées</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{orders.filter(o => o.status === 'payment_verified').length}</p>
            </div>
            <div className="card-glass p-4 border border-primary/30">
              <p className="text-xs text-muted-foreground font-semibold">Complétées</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{orders.filter(o => o.status === 'completed').length}</p>
            </div>
          </div>
          <div className="card-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-bold border-b border-border/40">
                  <tr>
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Client</th>
                    <th className="p-3.5">Contact</th>
                    <th className="p-3.5">Boutique</th>
                    <th className="p-3.5">Montant</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5">Retrait</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredOrders.length === 0 ? (
                    <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Aucune commande.</td></tr>
                  ) : filteredOrders.map(order => (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-muted-foreground">#{order.id.slice(0, 8)}</td>
                      <td className="p-3.5 font-bold text-foreground">{order.customer_name}</td>
                      <td className="p-3.5">
                        {order.customer_phone ? (
                          <a href={buildWhatsAppUrl(order.customer_phone, '')} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {order.customer_phone}
                          </a>
                        ) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="p-3.5 text-muted-foreground">{order.shop_name}</td>
                      <td className="p-3.5 font-bold text-foreground">{formatPrice(order.total)}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', order.status === 'pending_payment' ? 'bg-amber-500/10 text-amber-400' : order.status === 'payment_uploaded' ? 'bg-blue-500/10 text-blue-400' : order.status === 'payment_verified' ? 'bg-emerald-500/10 text-emerald-400' : order.status === 'completed' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {order.withdrawal_status ? (
                          <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', order.withdrawal_status === 'pending' ? 'badge-warning' : order.withdrawal_status === 'verified' ? 'badge-info' : 'badge-success')}>
                            {order.withdrawal_status}
                          </span>
                        ) : <span className="text-muted-foreground">-</span>}
                      </td>
                      <td className="p-3.5 text-muted-foreground">{formatDate(order.created_date)}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button size="sm" onClick={() => setInspectOrder(order)} className="h-7 text-xs bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 font-bold gap-1 px-2.5 shadow-sm" title="Inspecter commande & facture complète">
                            <Eye className="w-3.5 h-3.5" /> Plus de détails
                          </Button>
                          {(order.status === 'payment_uploaded' || order.status === 'pending_payment') && (
                            <Button size="sm" variant="ghost" onClick={() => handleVerifyPayment(order.id)} className="h-7 text-emerald-400 hover:bg-emerald-500/10" title="Vérifier paiement">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleContactCustomer(order)} className="h-7 text-blue-400 hover:bg-blue-500/10" title="Contacter client">
                            <Phone className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => {
                            if (!confirm(`Supprimer la commande #${order.id.slice(0, 8)} ?`)) return
                            OrderAPI.delete(order.id)
                            AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Suppression Commande', details: `Commande ${order.id} supprimée`, severity: 'danger' })
                            toastSuccess('Commande supprimée')
                            onRefresh()
                          }} className="h-7 text-red-400 hover:bg-red-500/10" title="Supprimer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Commissions View */}
      {view === 'commissions' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input value={commissionSearch} onChange={e => setCommissionSearch(e.target.value)} placeholder="Rechercher boutique, vendeur..." className="pl-9 text-xs" />
              </div>
              <select value={selectedVendor} onChange={e => setSelectedVendor(e.target.value)} className="bg-card text-foreground text-xs font-bold px-3 py-2 rounded-xl border border-border">
                <option value="all">Tous les vendeurs</option>
                {commissionsByVendor.map(v => <option key={v.vendor_email} value={v.vendor_email}>{v.vendor_name} ({v.shop_name})</option>)}
              </select>
              <select value={commissionFilter} onChange={e => setCommissionFilter(e.target.value as any)} className="bg-card text-foreground text-xs font-bold px-3 py-2 rounded-xl border border-border">
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="paid">Payées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleBulkPayCommissions} disabled={pendingCommissions.length === 0} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5">
                <CheckCircle className="w-4 h-4" /> Payer tout ({pendingCommissions.length})
              </Button>
              <Button onClick={handleExportCommissionsCSV} variant="outline" className="text-xs gap-1.5"><Download className="w-4 h-4" /> CSV</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card-glass p-4 border border-amber-500/30">
              <p className="text-xs text-muted-foreground font-semibold">En attente</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{formatPrice(totalPending)}</p>
              <p className="text-xs text-muted-foreground">{pendingCommissions.length} commission(s)</p>
            </div>
            <div className="card-glass p-4 border border-emerald-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Payées</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{formatPrice(totalPaid)}</p>
              <p className="text-xs text-muted-foreground">{paidCommissions.length} commission(s)</p>
            </div>
            <div className="card-glass p-4 border border-red-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Annulées</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{formatPrice(totalCancelled)}</p>
              <p className="text-xs text-muted-foreground">{cancelledCommissions.length} commission(s)</p>
            </div>
            <div className="card-glass p-4 border border-primary/30">
              <p className="text-xs text-muted-foreground font-semibold">Total</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{formatPrice(totalPending + totalPaid + totalCancelled)}</p>
              <p className="text-xs text-muted-foreground">{commissions.length} commission(s)</p>
            </div>
          </div>
          <div className="card-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-bold border-b border-border/40">
                  <tr>
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Boutique</th>
                    <th className="p-3.5">Vendeur</th>
                    <th className="p-3.5">Commande</th>
                    <th className="p-3.5">Vente</th>
                    <th className="p-3.5">Taux</th>
                    <th className="p-3.5">Commission</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredCommissions.length === 0 ? (
                    <tr><td colSpan={10} className="p-8 text-center text-muted-foreground">Aucune commission trouvée.</td></tr>
                  ) : filteredCommissions.map(comm => (
                    <tr key={comm.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-muted-foreground">#{comm.id.slice(0, 8)}</td>
                      <td className="p-3.5 font-bold text-foreground">{comm.shop_name}</td>
                      <td className="p-3.5 text-muted-foreground">{comm.vendor_name}</td>
                      <td className="p-3.5 font-mono text-[11px] text-muted-foreground">#{comm.order_id.slice(0, 8)}</td>
                      <td className="p-3.5 text-foreground">{formatPrice(comm.order_total)}</td>
                      <td className="p-3.5 text-muted-foreground">{comm.rate}%</td>
                      <td className="p-3.5 font-bold text-primary">{formatPrice(comm.amount)}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', comm.status === 'pending' ? 'badge-warning' : comm.status === 'paid' ? 'badge-success' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
                          {comm.status === 'pending' ? 'En attente' : comm.status === 'paid' ? 'Payée' : 'Annulée'}
                        </span>
                      </td>
                      <td className="p-3.5 text-muted-foreground">{formatDate(comm.created_date)}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1">
                          {comm.status === 'pending' && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleMarkCommissionPaid(comm.id)} className="h-7 text-emerald-400 hover:bg-emerald-500/10" title="Marquer payée"><CheckCircle className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleCancelCommission(comm.id)} className="h-7 text-red-400 hover:bg-red-500/10" title="Annuler"><XCircle className="w-3.5 h-3.5" /></Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-glass p-6 space-y-4 border border-primary/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-primary" /> Tableau des Commissions 2% par Vendeur (Solde Dû par Boutique)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Calcul automatique : 2% sur la somme de tous les articles vendus. Indique exactement le montant que chaque vendeur doit à la plateforme.
                </p>
              </div>
              <span className="badge-primary bg-primary/10 text-primary border border-primary/30 text-xs px-3 py-1 self-start sm:self-auto">
                Taux Contractuel : 2.0%
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] tracking-wider font-bold border-b border-border/40">
                  <tr>
                    <th className="p-3">Vendeur & Boutique</th>
                    <th className="p-3">Somme Ventes (FCFA)</th>
                    <th className="p-3">Taux</th>
                    <th className="p-3 text-amber-400">Montant Dû (2%)</th>
                    <th className="p-3 text-emerald-400">Déjà Réglé</th>
                    <th className="p-3">Commandes</th>
                    <th className="p-3 text-right">Actions Règlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {commissionsByVendor.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-muted-foreground">Aucun vendeur enregistré avec des commissions.</td>
                    </tr>
                  ) : commissionsByVendor.map((v, i) => (
                    <tr key={i} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <p className="font-bold text-foreground">{v.vendor_name}</p>
                        <p className="text-[10px] text-muted-foreground">{v.shop_name} {v.vendor_email ? `• ${v.vendor_email}` : ''}</p>
                      </td>
                      <td className="p-3 font-semibold text-foreground">
                        {formatPrice(v.salesVolume)}
                      </td>
                      <td className="p-3 text-muted-foreground font-mono">
                        2%
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        {v.pending > 0 ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                            {formatPrice(v.pending)} dû
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Réglé (0 FCFA)
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-emerald-400">
                        {formatPrice(v.paid)}
                      </td>
                      <td className="p-3 font-mono text-muted-foreground">
                        {v.count} vente(s)
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {v.pending > 0 && (
                            <Button
                              size="sm"
                              onClick={() => handlePayVendorCommissions(v.vendor_email, v.shop_name)}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                              title="Marquer toutes les commissions de ce vendeur comme réglées"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Régler ({formatPrice(v.pending)})
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleWhatsAppVendorReminder(v.vendor_name, v.shop_name, v.pending, v.salesVolume)}
                            className="h-7 text-xs text-emerald-400 hover:bg-emerald-500/10 gap-1"
                            title="Relancer le vendeur sur WhatsApp"
                          >
                            <Phone className="w-3.5 h-3.5" /> WhatsApp
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions View */}
      {view === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input value={subSearch} onChange={e => setSubSearch(e.target.value)} placeholder="Rechercher boutique, propriétaire..." className="pl-9 text-xs" />
            </div>
            <select value={subFilter} onChange={e => setSubFilter(e.target.value as any)} className="bg-card text-foreground text-xs font-bold px-3 py-2 rounded-xl border border-border">
              <option value="all">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="expiring">En attente</option>
              <option value="expired">Expirées</option>
              <option value="suspended">Suspendues</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card-glass p-4 border border-emerald-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Actives</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{subscriptions.filter(s => s.status === 'active').length}</p>
            </div>
            <div className="card-glass p-4 border border-amber-500/30">
              <p className="text-xs text-muted-foreground font-semibold">En attente</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{subscriptions.filter(s => s.status === 'expiring').length}</p>
            </div>
            <div className="card-glass p-4 border border-red-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Expirées</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{subscriptions.filter(s => s.status === 'expired').length}</p>
            </div>
            <div className="card-glass p-4 border border-primary/30">
              <p className="text-xs text-muted-foreground font-semibold">Suspendues</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{subscriptions.filter(s => s.status === 'suspended').length}</p>
            </div>
          </div>
          <div className="card-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-bold border-b border-border/40">
                  <tr>
                    <th className="p-3.5">Boutique</th>
                    <th className="p-3.5">Propriétaire</th>
                    <th className="p-3.5">Montant</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5">Jours restants</th>
                    <th className="p-3.5">Date fin</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredSubscriptions.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Aucun abonnement trouvé.</td></tr>
                  ) : filteredSubscriptions.map(sub => {
                    const endDate = sub.end_date ? new Date(sub.end_date) : new Date(Date.now() + (sub.days_remaining || 0) * 86400000)
                    const daysRemaining = sub.days_remaining || Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000))
                    const isExpiringSoon = daysRemaining <= 7 && daysRemaining >= 0
                    return (
                      <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5 font-bold text-foreground">{sub.shop_name}</td>
                        <td className="p-3.5 text-muted-foreground">{sub.owner_name}<br/><span className="text-[10px]">{sub.owner_email}</span></td>
                        <td className="p-3.5 text-foreground">{formatPrice(sub.amount)}</td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', sub.status === 'active' ? 'badge-success' : sub.status === 'expiring' ? 'badge-warning' : sub.status === 'expired' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'badge-destructive')}>
                            {sub.status === 'active' ? 'Active' : sub.status === 'expiring' ? 'En attente' : sub.status === 'expired' ? 'Expirée' : 'Suspendue'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={cn('font-bold', isExpiringSoon ? 'text-amber-400' : 'text-foreground')}>{daysRemaining}</span>
                          <span className="text-[10px] text-muted-foreground"> jours</span>
                        </td>
                        <td className="p-3.5 text-muted-foreground">{formatDate(sub.end_date || sub.start_date)}</td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap items-center gap-1">
                            {sub.status === 'expiring' && (
                              <>
                                <Button size="sm" onClick={() => handleValidateSubscription(sub)} className="h-7 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px]"><CheckCircle className="w-3 h-3" /> Valider</Button>
                                <Button size="sm" variant="outline" onClick={() => handleRejectSubscription(sub)} className="h-7 text-destructive text-[10px]"><XCircle className="w-3 h-3" /> Refuser</Button>
                              </>
                            )}
                            {(sub.status === 'expired' || sub.status === 'suspended') && (
                              <Button size="sm" onClick={() => handleReactivateSubscription(sub)} className="h-7 bg-primary text-white text-[10px]"><CheckCircle className="w-3 h-3" /> Réactiver</Button>
                            )}
                            {sub.status === 'active' && (
                              <Button size="sm" variant="outline" onClick={() => handleRenewSubscription(sub)} className="h-7 text-primary text-[10px]"><RefreshCw className="w-3 h-3" /> Renouveler</Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawals View */}
      {view === 'withdrawals' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input value={withdrawalSearch} onChange={e => setWithdrawalSearch(e.target.value)} placeholder="Rechercher client, boutique..." className="pl-9 text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <select value={withdrawalFilter} onChange={e => setWithdrawalFilter(e.target.value as any)} className="bg-card text-foreground text-xs font-bold px-3 py-2 rounded-xl border border-border">
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="verified">PIN vérifié</option>
                <option value="completed">Complété</option>
              </select>
              <Button onClick={handleExportWithdrawalsCSV} variant="outline" className="text-xs gap-1.5"><Download className="w-4 h-4" /> CSV</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-glass p-4 border border-amber-500/30">
              <p className="text-xs text-muted-foreground font-semibold">En attente PIN</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{orders.filter(o => o.withdrawal_status === 'pending').length}</p>
              <p className="text-xs text-muted-foreground">{formatPrice(totalWithdrawalPending)}</p>
            </div>
            <div className="card-glass p-4 border border-blue-500/30">
              <p className="text-xs text-muted-foreground font-semibold">PIN vérifié</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{orders.filter(o => o.withdrawal_status === 'verified').length}</p>
              <p className="text-xs text-muted-foreground">{formatPrice(totalWithdrawalVerified)}</p>
            </div>
            <div className="card-glass p-4 border border-emerald-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Complétés</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{orders.filter(o => o.withdrawal_status === 'completed').length}</p>
              <p className="text-xs text-muted-foreground">{formatPrice(totalWithdrawalCompleted)}</p>
            </div>
          </div>
          <div className="card-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-bold border-b border-border/40">
                  <tr>
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Client</th>
                    <th className="p-3.5">Boutique</th>
                    <th className="p-3.5">Montant</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5">PIN</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredWithdrawals.length === 0 ? (
                    <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Aucun retrait trouvé.</td></tr>
                  ) : filteredWithdrawals.map(order => (
                    <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-muted-foreground">#{order.id.slice(0, 8)}</td>
                      <td className="p-3.5 font-bold text-foreground">{order.customer_name}</td>
                      <td className="p-3.5 text-muted-foreground">{order.shop_name}</td>
                      <td className="p-3.5 font-bold text-foreground">{formatPrice(order.total)}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', order.withdrawal_status === 'pending' ? 'badge-warning' : order.withdrawal_status === 'verified' ? 'badge-info' : 'badge-success')}>
                          {order.withdrawal_status}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-muted-foreground">{order.withdrawal_pin || '-'}</td>
                      <td className="p-3.5 text-muted-foreground">{formatDate(order.created_date)}</td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap items-center gap-1">
                          {order.withdrawal_status === 'pending' && (
                            <Button size="sm" variant="ghost" onClick={() => handleWithdrawAction(order.id, 'verify')} className="h-7 text-emerald-400 hover:bg-emerald-500/10" title="Vérifier PIN"><Key className="w-3.5 h-3.5" /></Button>
                          )}
                          {order.withdrawal_status === 'verified' && (
                            <Button size="sm" variant="ghost" onClick={() => handleWithdrawAction(order.id, 'complete')} className="h-7 text-primary hover:bg-primary/10" title="Marquer complété"><CheckCircle className="w-3.5 h-3.5" /></Button>
                          )}
                          {order.withdrawal_status === 'pending' && (
                            <Button size="sm" variant="ghost" onClick={() => handleWithdrawAction(order.id, 'reject')} className="h-7 text-red-400 hover:bg-red-500/10" title="Refuser"><XCircle className="w-3.5 h-3.5" /></Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* P2P View */}
      {view === 'p2p' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input value={p2pSearch} onChange={e => setP2pSearch(e.target.value)} placeholder="Rechercher utilisateur..." className="pl-9 text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <select value={p2pFilter} onChange={e => setP2pFilter(e.target.value as any)} className="bg-card text-foreground text-xs font-bold px-3 py-2 rounded-xl border border-border">
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="active">Actifs</option>
                <option value="expired">Expirés</option>
              </select>
              <Button onClick={handleExportP2PCSV} variant="outline" className="text-xs gap-1.5"><Download className="w-4 h-4" /> CSV</Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-glass p-4 border border-emerald-500/30">
              <p className="text-xs text-muted-foreground font-semibold">Actifs</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{activeP2P.length}</p>
              <p className="text-xs text-muted-foreground">{formatPrice(totalP2PFees)} frais collectés</p>
            </div>
            <div className="card-glass p-4 border border-amber-500/30">
              <p className="text-xs text-muted-foreground font-semibold">En attente</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{pendingP2P.length}</p>
              <p className="text-xs text-muted-foreground">Validation requise</p>
            </div>
            <div className="card-glass p-4 border border-primary/30">
              <p className="text-xs text-muted-foreground font-semibold">Total comptes</p>
              <p className="text-2xl font-extrabold text-foreground mt-1">{p2pAccounts.length}</p>
              <p className="text-xs text-muted-foreground">Frais activation: {formatPrice(totalP2PFees)}</p>
            </div>
          </div>
          <div className="card-glass overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] tracking-wider font-bold border-b border-border/40">
                  <tr>
                    <th className="p-3.5">ID</th>
                    <th className="p-3.5">Utilisateur</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Statut</th>
                    <th className="p-3.5">Frais activation</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredP2P.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Aucun compte P2P trouvé.</td></tr>
                  ) : filteredP2P.map(p => (
                    <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 font-mono text-[11px] text-muted-foreground">#{p.id.slice(0, 8)}</td>
                      <td className="p-3.5 font-bold text-foreground">{p.user_name}</td>
                      <td className="p-3.5 text-muted-foreground">{p.user_email}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase', p.status === 'pending' ? 'badge-warning' : p.status === 'active' ? 'badge-success' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-foreground">{formatPrice(p.activation_fee || 0)}</td>
                      <td className="p-3.5 text-muted-foreground">{formatDate(p.created_date)}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1">
                          {p.status === 'pending' && (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleActivateP2P(p)} className="h-7 text-emerald-400 hover:bg-emerald-500/10" title="Activer"><CheckCircle className="w-3.5 h-3.5" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleRejectP2P(p)} className="h-7 text-red-400 hover:bg-red-500/10" title="Refuser"><XCircle className="w-3.5 h-3.5" /></Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INSPECTION FACTURE & COMMANDE DÉTAILLÉE (ADMIN) */}
      {inspectOrder && (
        <Modal open={!!inspectOrder} onClose={() => setInspectOrder(null)} title={`Facture & Commande #${inspectOrder.id.slice(0, 8)}`} size="lg">
          <div className="space-y-6 text-xs text-foreground">
            {/* Header Facture */}
            <div className="p-4 bg-muted/40 rounded-2xl border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase block">MarchéPlus Cameroun</span>
                <h3 className="text-base font-extrabold text-foreground mt-0.5">Facture Officielle N° FAC-{inspectOrder.id.slice(0, 8).toUpperCase()}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Date : {formatDate(inspectOrder.created_date)}</p>
              </div>
              <div className="text-right sm:text-right">
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-extrabold uppercase', inspectOrder.status === 'completed' || inspectOrder.status === 'payment_verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20')}>
                  Statut : {inspectOrder.status}
                </span>
                <p className="text-lg font-black text-primary mt-1">{formatPrice(inspectOrder.total)}</p>
              </div>
            </div>

            {/* Coordonnées Client & Vendeur */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-primary flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Client Facturé</p>
                  {inspectOrder.customer_phone && (
                    <a
                      href={buildWhatsAppUrl(inspectOrder.customer_phone, `Bonjour ${inspectOrder.customer_name}, concernant votre commande #${inspectOrder.id.slice(0, 8)} sur MarchéPlus.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[11px] font-bold flex items-center gap-1 border border-emerald-500/20"
                    >
                      <Phone className="w-3 h-3" /> WhatsApp
                    </a>
                  )}
                </div>
                <p className="font-bold text-foreground">{inspectOrder.customer_name}</p>
                <p className="text-muted-foreground">{inspectOrder.customer_email || 'Email non spécifié'}</p>
                <p className="text-muted-foreground">Téléphone : {inspectOrder.customer_phone || 'N/A'}</p>
                {inspectOrder.shipping_address && <p className="text-muted-foreground">Ville/Quartier : {(inspectOrder.shipping_address as any).city || (inspectOrder.shipping_address as any).neighborhood || 'Cameroun'}</p>}
                {inspectOrder.message && <p className="text-muted-foreground bg-muted/40 p-2 rounded-lg italic">"{inspectOrder.message}"</p>}
              </div>

              <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
                <p className="font-bold text-emerald-400 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> Boutique & Paiement Mobile Money</p>
                <p className="font-bold text-foreground">Boutique : {inspectOrder.shop_name}</p>
                <p className="text-muted-foreground">Méthode : <span className="font-bold text-primary uppercase">{inspectOrder.payment_method || 'Mobile Money'}</span></p>
                {inspectOrder.payment_reference && (
                  <p className="text-muted-foreground">Réf Transaction : <code className="bg-muted px-1.5 py-0.5 rounded font-mono font-bold text-foreground">{inspectOrder.payment_reference}</code></p>
                )}
                <p className="text-muted-foreground">Statut Retrait Vendeur : <strong className="text-foreground">{inspectOrder.withdrawal_status || 'N/A'}</strong></p>
                {inspectOrder.withdrawal_pin && <p className="text-muted-foreground">Code PIN Retrait : <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary font-bold">{inspectOrder.withdrawal_pin}</code></p>}
              </div>
            </div>

            {/* Preuve de Paiement Mobile Money (si téléversée) */}
            {inspectOrder.payment_proof_url && (
              <div className="p-3.5 rounded-xl bg-card border border-border space-y-2">
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" /> Preuve de Paiement (Capture / Reçu Mobile Money)
                </p>
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  <img
                    src={inspectOrder.payment_proof_url}
                    alt="Preuve de paiement"
                    className="max-h-48 rounded-xl border border-border object-contain bg-black/40"
                  />
                  <div className="space-y-2 text-xs">
                    <p className="text-muted-foreground">Capture fournie par le client pour attester du transfert MTN/Orange.</p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          OrderAPI.update(inspectOrder.id, { payment_verified: true, status: 'payment_verified' })
                          AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Vérification Paiement', details: `Paiement vérifié pour commande ${inspectOrder.id}`, severity: 'info' })
                          toastSuccess('Paiement vérifié avec succès !')
                          setInspectOrder({ ...inspectOrder, payment_verified: true, status: 'payment_verified' })
                          onRefresh()
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Valider Paiement
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Articles de la Facture */}
            <div className="space-y-2">
              <p className="font-bold text-foreground flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-primary" /> Détail des Lignes Facturées</p>
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted text-muted-foreground text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2.5">Article / Description</th>
                      <th className="p-2.5 text-center">Quantité</th>
                      <th className="p-2.5 text-right">Prix Unitaire</th>
                      <th className="p-2.5 text-right">Sous-total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {inspectOrder.items && inspectOrder.items.length > 0 ? (
                      inspectOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-foreground">{item.name || (item as any).product_title || (item as any).title || 'Article commande'}</td>
                          <td className="p-2.5 text-center text-muted-foreground">{item.quantity || 1}</td>
                          <td className="p-2.5 text-right text-muted-foreground">{formatPrice(item.price || 0)}</td>
                          <td className="p-2.5 text-right font-bold text-foreground">{formatPrice((item.price || 0) * (item.quantity || 1))}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-2.5 font-medium text-foreground">Commande MarchéPlus Global</td>
                        <td className="p-2.5 text-center text-muted-foreground">1</td>
                        <td className="p-2.5 text-right text-muted-foreground">{formatPrice(inspectOrder.total)}</td>
                        <td className="p-2.5 text-right font-bold text-foreground">{formatPrice(inspectOrder.total)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions Administrateur sur la Commande & Facture */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => window.print()} className="gap-1.5 text-xs">
                  <Printer className="w-3.5 h-3.5" /> Imprimer Facture
                </Button>
                {inspectOrder.status !== 'completed' && (
                  <Button size="sm" onClick={() => {
                    OrderAPI.update(inspectOrder.id, { status: 'completed', payment_verified: true })
                    AuditLogAPI.create({ timestamp: new Date().toISOString(), admin_name: adminName, action: 'Validation Complète Commande', details: `Commande ${inspectOrder.id} validée et complétée`, severity: 'info' })
                    toastSuccess('Commande marquée comme complétée')
                    setInspectOrder(null)
                    onRefresh()
                  }} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs">
                    <CheckCircle className="w-3.5 h-3.5" /> Valider & Clôturer
                  </Button>
                )}
              </div>
              <Button size="sm" variant="ghost" onClick={() => setInspectOrder(null)}>
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
