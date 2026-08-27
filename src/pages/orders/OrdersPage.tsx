import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ShoppingBag, CheckCircle, Clock, Upload, Key,
  MessageSquare, Store, AlertCircle, FileText, Printer, ShieldCheck, Send, Sparkles, Phone,
  Home, Calendar, MapPin, CheckCircle2, XCircle, CreditCard, MessageCircle, Eye, Trash2
} from 'lucide-react'
import { OrderAPI, ChatAPI, NotificationAPI, VisitRequestAPI, HousingAPI } from '@/lib/store'
import { ORDER_STATUS_LABELS, VISIT_STATUS_LABELS, type Order, type VisitRequest } from '@/types'
import { formatPrice, formatDate, getStatusColor, cn, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { toastSuccess, toastError } from '@/components/ui/Toast'
import { LoyaltyPointsWidget } from '@/components/customer/LoyaltyPointsWidget'

export default function OrdersPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [, forceUpdate] = useState(0)

  // Sub-navigation: Produits vs Logements (Visites)
  const [mainTab, setMainTab] = useState<'products' | 'housing'>('products')
  
  // Status filter for products
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'pending' | 'verified' | 'completed' | 'cancelled'>('all')
  
  // Status filter for housing visits
  const [visitStatusFilter, setVisitStatusFilter] = useState<'all' | 'pending' | 'approved' | 'completed'>('all')

  // Data
  const orders = useMemo(() => {
    return user ? OrderAPI.filter(o => o.customer_email === user.email) : OrderAPI.list()
  }, [user])

  const visitRequests = useMemo(() => {
    return user
      ? VisitRequestAPI.filter(v => v.visitor_email === user.email || Boolean(user.phone && v.visitor_phone === user.phone))
      : VisitRequestAPI.list()
  }, [user])

  // Modals state for Products
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const [proofModalOpen, setProofModalOpen] = useState(false)
  const [proofUrl, setProofUrl] = useState('')
  const [chatModalOpen, setChatModalOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [proofImageUrl, setProofImageUrl] = useState('')
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatManuallyClosedRef = useRef(false)

  // Modal state for Housing Visits Inspection
  const [inspectVisit, setInspectVisit] = useState<VisitRequest | null>(null)

  const openFilePicker = () => fileInputRef.current?.click()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toastSuccess('Veuillez sélectionner un fichier image')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setUploadedImage(reader.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Auto-open Chat Modal if ?chat=ORDER_ID is present in URL
  useEffect(() => {
    if (chatManuallyClosedRef.current) return
    const chatOrderId = searchParams.get('chat')
    if (chatOrderId) {
      const targetOrder = OrderAPI.get(chatOrderId) || orders.find(o => o.id === chatOrderId)
      if (targetOrder) {
        setActiveOrder(targetOrder)
        setChatModalOpen(true)
      }
    }
  }, [searchParams])

  const handleCloseChat = () => {
    chatManuallyClosedRef.current = true
    setChatModalOpen(false)
  }

  const handleSendImageMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOrder || !chatMessage.trim() && !uploadedImage && !proofImageUrl.trim()) return
    ChatAPI.create({
      order_id: activeOrder.id,
      sender_role: 'customer',
      sender_name: user?.name || activeOrder.customer_name || 'Client',
      message: chatMessage,
      image_url: uploadedImage || proofImageUrl.trim() || undefined,
    })

    NotificationAPI.create({
      shop_id: activeOrder.shop_id,
      title: `Nouveau Message Client - Commande #${activeOrder.id.slice(0, 8)}`,
      message: `${user?.name || activeOrder.customer_name}: "${chatMessage.slice(0, 50)}..."`,
      type: 'chat',
      read: false,
    })

    setChatMessage('')
    setUploadedImage(null)
    setProofImageUrl('')
    toastSuccess('Message transmis au vendeur !')
  }

  const handleSendProof = () => {
    if (!activeOrder || !uploadedImage && !proofImageUrl.trim()) return
    ChatAPI.create({
      order_id: activeOrder.id,
      sender_role: 'customer',
      sender_name: user?.name || activeOrder.customer_name || 'Client',
      message: 'Preuve de paiement:',
      image_url: uploadedImage || proofImageUrl.trim(),
    })

    OrderAPI.update(activeOrder.id, {
      status: 'payment_uploaded',
      payment_proof_url: uploadedImage || proofImageUrl.trim(),
    })

    setUploadedImage(null)
    setProofImageUrl('')
    toastSuccess('Preuve de paiement envoyée !')
  }

  const handleUploadProof = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeOrder || !proofUrl.trim()) return
    OrderAPI.update(activeOrder.id, {
      status: 'payment_uploaded',
      payment_proof_url: proofUrl.trim(),
    })

    ChatAPI.create({
      order_id: activeOrder.id,
      sender_role: 'customer',
      sender_name: user?.name || activeOrder.customer_name || 'Client',
      message: `Preuve de paiement envoyée : ${proofUrl.trim()}`,
    })

    NotificationAPI.create({
      shop_id: activeOrder.shop_id,
      title: `Preuve de Paiement - Commande #${activeOrder.id.slice(0, 8)}`,
      message: `${user?.name || activeOrder.customer_name} a envoyé sa preuve de paiement.`,
      type: 'payment',
      read: false,
    })

    setProofModalOpen(false)
    setProofUrl('')
    toastSuccess('Preuve transmise !', 'Le vendeur a été notifié sur la plateforme.')
    forceUpdate(n => n + 1)
  }

  const handleDeleteOrder = (orderId: string) => {
    if (!confirm('Supprimer cette commande de votre historique ?')) return
    OrderAPI.delete(orderId)
    toastSuccess('Commande supprimée de votre historique.')
    forceUpdate(n => n + 1)
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  // Filtered lists
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (productStatusFilter === 'pending') return o.status === 'pending_payment' || o.status === 'payment_uploaded'
      if (productStatusFilter === 'verified') return o.status === 'payment_verified' || o.status === 'approved_by_seller' || o.status === 'ready_for_pickup'
      if (productStatusFilter === 'completed') return o.status === 'completed' || o.status === 'sold'
      if (productStatusFilter === 'cancelled') return o.status === 'cancelled'
      return true
    })
  }, [orders, productStatusFilter])

  const filteredVisits = useMemo(() => {
    return visitRequests.filter(v => {
      if (visitStatusFilter === 'pending') return v.status === 'pending'
      if (visitStatusFilter === 'approved') return v.status === 'approved'
      if (visitStatusFilter === 'completed') return v.status === 'completed'
      return true
    })
  }, [visitRequests, visitStatusFilter])

  return (
    <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Mes Commandes & Demandes de Visites</h1>
            <p className="text-sm text-muted-foreground">Suivez vos achats de produits et vos réservations de visites de logements.</p>
            <LoyaltyPointsWidget />
          </div>
        </div>

        {/* Sub-division Onglets : Produits vs Logements */}
        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-2xl border border-border">
          <button
            onClick={() => setMainTab('products')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
              mainTab === 'products'
                ? 'bg-primary text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <ShoppingBag className="w-4 h-4" /> Achats Produits ({orders.length})
          </button>
          <button
            onClick={() => setMainTab('housing')}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2',
              mainTab === 'housing'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Home className="w-4 h-4" /> Visites Logements ({visitRequests.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SOUS-ONGLET PRODUITS & BOUTIQUE */}
      {/* ========================================================================= */}
      {mainTab === 'products' && (
        <div className="space-y-6">
          {/* Status filter bar */}
          <div className="card-glass p-3 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="font-bold text-muted-foreground mr-1">Filtrer par état :</span>
            {[
              { id: 'all', label: `Toutes (${orders.length})` },
              { id: 'pending', label: `En attente MoMo (${orders.filter(o => o.status === 'pending_payment' || o.status === 'payment_uploaded').length})` },
              { id: 'verified', label: `Paiement Validé (${orders.filter(o => o.status === 'payment_verified' || o.status === 'approved_by_seller').length})` },
              { id: 'completed', label: `Complétées (${orders.filter(o => o.status === 'completed' || o.status === 'sold').length})` },
              { id: 'cancelled', label: `Refusées / Annulées (${orders.filter(o => o.status === 'cancelled').length})` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setProductStatusFilter(f.id as any)}
                className={cn(
                  'px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap',
                  productStatusFilter === f.id
                    ? 'bg-primary text-white font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 card-glass">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">Aucune commande de produit trouvée</h3>
              <p className="text-sm text-muted-foreground">Vos commandes apparaîtront ici dès que vous aurez effectué un achat.</p>
              <Link to="/" className="btn-primary inline-flex mt-6"><Store className="w-4 h-4" /> Explorer la boutique</Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map(order => {
                const chatLogs = ChatAPI.filter(c => c.order_id === order.id)

                return (
                  <div key={order.id} className={cn(
                    'card-glass p-6 space-y-4 border-l-4',
                    order.status === 'cancelled' ? 'border-l-rose-500' :
                    order.status === 'completed' ? 'border-l-emerald-500' :
                    order.status === 'payment_verified' || order.status === 'approved_by_seller' ? 'border-l-blue-500' :
                    'border-l-primary'
                  )}>
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-base">Commande #{order.id.slice(0, 8)}</span>
                          <span className={cn('badge', getStatusColor(order.status))}>
                            {ORDER_STATUS_LABELS[order.status] || order.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Date: {formatDate(order.created_date)} • Boutique: <strong className="text-foreground">{order.shop_name}</strong></p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold gradient-text">{formatPrice(order.total)}</span>
                      </div>
                    </div>

                    {/* Items preview */}
                    <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-xl">
                      <div className="w-12 h-12 rounded-lg bg-card flex items-center justify-center font-bold text-primary border border-border">
                        <ShoppingBag className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm line-clamp-1">{order.product_name || 'Commande multi-articles'}</p>
                        {order.pin_code && order.status !== 'cancelled' && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                            <Key className="w-3.5 h-3.5" /> PIN de livraison: <span className="bg-emerald-500/10 px-2 py-0.5 rounded font-mono">{order.pin_code}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Cancellation reason if order was refused */}
                    {order.status === 'cancelled' && order.cancellation_reason && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 space-y-0.5">
                        <p className="font-bold">Commande refusée / annulée :</p>
                        <p className="text-slate-300">Motif : {order.cancellation_reason}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {order.status === 'pending_payment' && (
                        <Button
                          size="sm"
                          onClick={() => { setActiveOrder(order); setProofModalOpen(true) }}
                        >
                          <Upload className="w-4 h-4" /> Envoyer preuve MoMo
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setActiveOrder(order); setInvoiceModalOpen(true) }}
                      >
                        <FileText className="w-4 h-4 text-emerald-400" /> Reçu / Facture
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setActiveOrder(order); setChatModalOpen(true) }}
                      >
                        <MessageSquare className="w-4 h-4" /> Discuter ({chatLogs.length})
                      </Button>

                      {(order.status === 'cancelled' || order.status === 'completed') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-xs text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Supprimer de l'historique
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SOUS-ONGLET LOGEMENTS & VISITES PROGRAMMÉES */}
      {/* ========================================================================= */}
      {mainTab === 'housing' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="card-glass p-3 flex items-center gap-2 overflow-x-auto text-xs">
            <span className="font-bold text-muted-foreground mr-1">Statut Visite :</span>
            {[
              { id: 'all', label: `Toutes (${visitRequests.length})` },
              { id: 'pending', label: `En attente validation (${visitRequests.filter(v => v.status === 'pending').length})` },
              { id: 'approved', label: `Visites Confirmées (${visitRequests.filter(v => v.status === 'approved').length})` },
              { id: 'completed', label: `Effectuées (${visitRequests.filter(v => v.status === 'completed').length})` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setVisitStatusFilter(f.id as any)}
                className={cn(
                  'px-3 py-1.5 rounded-xl font-semibold transition-colors whitespace-nowrap',
                  visitStatusFilter === f.id
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredVisits.length === 0 ? (
            <div className="text-center py-16 card-glass">
              <Home className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">Aucune demande de visite de logement</h3>
              <p className="text-sm text-muted-foreground">Trouvez un studio ou une chambre universitaire et planifiez votre visite.</p>
              <Link to="/housing" className="btn-primary inline-flex mt-6 bg-emerald-600 hover:bg-emerald-500 text-white">
                <Home className="w-4 h-4 mr-2" /> Voir les logements étudiants
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVisits.map(visit => {
                const housingObj = HousingAPI.get(visit.housing_id)
                const whatsappMessage = `Bonjour OroMall ! Je vous contacte au sujet de ma demande de visite pour "${visit.housing_title}" (${visit.housing_city}) prévue le ${visit.visit_date} à ${visit.visit_time}.`
                const isApproved = visit.status === 'approved' || visit.status === 'completed'

                return (
                  <div key={visit.id} className="card-glass p-6 space-y-4 border-l-4 border-l-emerald-500 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Demande de Visite</span>
                          <h3 className="font-bold text-foreground text-base line-clamp-1">{visit.housing_title}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {visit.housing_city}
                          </p>
                        </div>
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-bold uppercase',
                          visit.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          visit.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          visit.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-red-500/10 text-red-400'
                        )}>
                          {VISIT_STATUS_LABELS[visit.status] || visit.status}
                        </span>
                      </div>

                      {/* Info Bloc */}
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Date & Heure :
                          </span>
                          <strong className="text-foreground">{visit.visit_date} à {visit.visit_time}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Forfait :
                          </span>
                          <span className="font-bold text-foreground">{visit.package_label} ({formatPrice(visit.amount)})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp notifié :
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">{visit.visitor_phone}</span>
                        </div>
                        {visit.payment_reference && (
                          <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                            <span className="text-muted-foreground">Réf MoMo :</span>
                            <code className="font-mono text-foreground">{visit.payment_reference}</code>
                          </div>
                        )}
                      </div>

                      {/* Unlocked Landlord Contact Banner (If Approved) */}
                      {isApproved && housingObj && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
                          <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" /> Coordonnées du Bailleur Débloquées ✅
                          </p>
                          <p className="text-foreground font-semibold">
                            Bailleur : {housingObj.owner_name}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            {housingObj.whatsapp_number && (
                              <a
                                href={buildWhatsAppUrl(housingObj.whatsapp_number, `Bonjour ${housingObj.owner_name}, ma visite pour "${visit.housing_title}" a été approuvée sur MarchéPlus. Pouvons-nous échanger ?`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> Contacter Bailleur (WhatsApp) 🟢
                              </a>
                            )}
                            {housingObj.owner_phone && (
                              <a
                                href={`tel:${housingObj.owner_phone}`}
                                className="px-3 py-1.5 rounded-lg bg-card border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold text-xs flex items-center gap-1"
                              >
                                <Phone className="w-3.5 h-3.5" /> Appeler : {housingObj.owner_phone}
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pending Warning */}
                      {visit.status === 'pending' && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                          <p className="font-bold text-amber-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> En cours de validation par l'administration
                          </p>
                          <p className="text-muted-foreground text-[11px]">
                            Dès que l'administrateur valide le paiement du forfait, les boutons de contact direct du bailleur apparaîtront automatiquement ici et sur l'annonce du logement.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setInspectVisit(visit)}
                          className="text-xs gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" /> Plus de détails
                        </Button>
                        <Link
                          to={`/housing/${visit.housing_id}`}
                          className="text-xs text-muted-foreground hover:text-foreground font-semibold underline"
                        >
                          Voir l'annonce
                        </Link>
                      </div>

                      <a
                        href={buildWhatsAppUrl('237680195221', whatsappMessage)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-bold text-xs transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> Support Admin
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal Détail Visite Logement */}
      {inspectVisit && (
        <Modal open={!!inspectVisit} onClose={() => setInspectVisit(null)} title={`Détail Visite - ${inspectVisit.housing_title}`} size="md">
          <div className="space-y-5 text-xs text-foreground">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Visite Immobilière Étudiante</span>
              <h3 className="text-base font-extrabold text-foreground">{inspectVisit.housing_title}</h3>
              <p className="text-muted-foreground">{inspectVisit.housing_city} • Forfait : {inspectVisit.package_label}</p>
            </div>

            <div className="space-y-2 border border-border p-3.5 rounded-xl bg-card">
              <p><span className="text-muted-foreground">Nom du visiteur :</span> <strong>{inspectVisit.visitor_name}</strong></p>
              <p><span className="text-muted-foreground">Téléphone WhatsApp :</span> <strong className="text-emerald-400">{inspectVisit.visitor_phone}</strong></p>
              <p><span className="text-muted-foreground">Email :</span> {inspectVisit.visitor_email}</p>
              <p><span className="text-muted-foreground">Montant Forfait :</span> <strong>{formatPrice(inspectVisit.amount)} ({inspectVisit.payment_method?.toUpperCase()})</strong></p>
              <p><span className="text-muted-foreground">Date programmée :</span> <strong>{inspectVisit.visit_date} à {inspectVisit.visit_time}</strong></p>
              {inspectVisit.notes && <p className="text-muted-foreground pt-1 border-t border-border/50"><strong>Note :</strong> {inspectVisit.notes}</p>}
            </div>

            {/* If approved, show landlord contact in modal */}
            {inspectVisit.status === 'approved' && (() => {
              const h = HousingAPI.get(inspectVisit.housing_id)
              if (!h) return null
              return (
                <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 space-y-2">
                  <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> Coordonnées du Bailleur Débloquées
                  </p>
                  <p className="text-foreground"><strong>Bailleur :</strong> {h.owner_name}</p>
                  {h.owner_phone && <p className="text-muted-foreground"><strong>Téléphone :</strong> {h.owner_phone}</p>}
                  <div className="flex gap-2 pt-1">
                    {h.whatsapp_number && (
                      <a
                        href={buildWhatsAppUrl(h.whatsapp_number, `Bonjour ${h.owner_name}, ma visite pour "${h.title}" est confirmée.`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Bailleur
                      </a>
                    )}
                    {h.owner_phone && (
                      <a
                        href={`tel:${h.owner_phone}`}
                        className="px-3 py-1.5 rounded-lg bg-card border border-border text-foreground font-bold text-xs flex items-center gap-1"
                      >
                        <Phone className="w-3.5 h-3.5" /> Appeler
                      </a>
                    )}
                  </div>
                </div>
              )
            })()}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setInspectVisit(null)}>Fermer</Button>
              <Button onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5">
                <Printer className="w-3.5 h-3.5" /> Imprimer Bon de Visite
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Official Receipt / Invoice Modal */}
      {activeOrder && (
        <Modal open={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} title={`Reçu Officiel - Commande #${activeOrder.id.slice(0, 8)}`}>
          <div className="space-y-6 text-foreground print:p-0">
            <div className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
              <div className="flex justify-between items-start border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-black text-xs font-black">OM</div>
                    <span className="font-display font-bold text-lg text-foreground">OroMall <span className="text-primary text-xs font-black">GOLD</span></span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Plateforme Marketplace & Logements Cameroun</p>
                </div>
                <div className="text-right">
                  <span className="badge-success bg-emerald-500/20 text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" /> Reçu Vérifié
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(activeOrder.created_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground font-semibold">Acheteur :</p>
                  <p className="font-bold text-foreground">{activeOrder.customer_name}</p>
                  <p className="text-muted-foreground">{activeOrder.customer_email}</p>
                  {activeOrder.customer_phone && <p className="text-muted-foreground">{activeOrder.customer_phone}</p>}
                </div>
                <div>
                  <p className="text-muted-foreground font-semibold">Vendeur / Boutique :</p>
                  <p className="font-bold text-foreground">{activeOrder.shop_name}</p>
                  <p className="text-muted-foreground">Mode de paiement : MTN MoMo / Orange Money</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between text-xs font-bold text-foreground">
                  <span>Désignation de l'article</span>
                  <span>Prix</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground py-1 border-b border-border/50">
                  <span>{activeOrder.product_name}</span>
                  <span className="font-mono">{formatPrice(activeOrder.total)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-foreground pt-2">
                  <span>Total payé</span>
                  <span className="text-emerald-400 font-mono">{formatPrice(activeOrder.total)}</span>
                </div>
              </div>

              {activeOrder.payment_proof_url && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  <strong>ID Preuve MoMo :</strong> {activeOrder.payment_proof_url}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 print:hidden">
              <Button variant="outline" onClick={() => setInvoiceModalOpen(false)}>Fermer</Button>
              <Button onClick={handlePrintReceipt} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                <Printer className="w-4 h-4" /> Imprimer / Télécharger le reçu
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Proof upload Modal */}
      <Modal open={proofModalOpen} onClose={() => setProofModalOpen(false)} title="Uploader une preuve de paiement">
        <form onSubmit={handleUploadProof} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Entrez l'URL de votre capture d'écran d'envoi Mobile Money ou l'ID de transaction (ex: 23894829384).
          </p>
          <Input label="ID de transaction / Lien de l'image" placeholder="Ex: TXN1294829048" required value={proofUrl} onChange={e => setProofUrl(e.target.value)} />
          <div className="pt-3 flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => setProofModalOpen(false)}>Annuler</Button>
            <Button type="submit">Valider la preuve</Button>
          </div>
        </form>
      </Modal>

      {/* Chat Modal */}
      <Modal open={chatModalOpen} onClose={handleCloseChat} title={`Chat Plateforme${activeOrder ? ' - Commande #' + activeOrder.id.slice(0, 8) : ''}`}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleCloseChat}>Fermer</Button>
          </div>
        }>
        <div className="space-y-4">
          <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-foreground">Vendeur: {activeOrder?.shop_name}</p>
              <p className="text-muted-foreground">Article: {activeOrder?.product_name} ({formatPrice(activeOrder?.total || 0)})</p>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-3 p-3 bg-muted/30 rounded-xl border border-border/40">
            {activeOrder && ChatAPI.filter(c => c.order_id === activeOrder.id).length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Aucun message pour le moment.</p>
            ) : (
              activeOrder && ChatAPI.filter(c => c.order_id === activeOrder.id).map(msg => (
                <div key={msg.id} className={cn('p-3 rounded-2xl max-w-[85%] text-xs space-y-1', msg.sender_role === 'customer' ? 'ml-auto bg-primary text-white rounded-br-none' : 'mr-auto bg-card border border-border text-foreground rounded-bl-none shadow-sm')}>
                  <p className="font-bold text-[10px] opacity-80">{msg.sender_name}</p>
                  {msg.message && <p>{msg.message}</p>}
                  {msg.image_url && (
                    <div className="mt-2">
                      <img src={msg.image_url} alt="Preuve" className="max-w-full max-h-40 rounded-lg border border-border/40" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Send Image / Proof Section */}
          {activeOrder && (
            <div className="space-y-3">
              {uploadedImage && (
                <div className="p-2 rounded-lg bg-muted/30 border border-border/40 flex items-center gap-2">
                  <img src={uploadedImage} alt="Preview" className="w-10 h-10 rounded object-cover" />
                  <span className="text-xs text-muted-foreground">Image prête à être envoyée</span>
                </div>
              )}
              <Button
                type="button"
                onClick={openFilePicker}
                className="w-full gap-2 bg-purple-600 hover:bg-purple-500 text-white"
                size="sm"
              >
                <Upload className="w-4 h-4" />
                {uploadedImage ? 'Changer l\'image' : 'Uploader une image'}
              </Button>
              <Input
                label="URL de la capture (optionnel)"
                placeholder="Coller l'URL si nécessaire..."
                value={proofImageUrl}
                onChange={e => setProofImageUrl(e.target.value)}
                className="text-xs"
              />
              <Button
                type="button"
                onClick={handleSendProof}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                size="sm"
                disabled={!uploadedImage && !proofImageUrl.trim()}
              >
                Envoyer preuve de paiement
              </Button>
            </div>
          )}

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Presets :
            </span>
            {[
              'Paiement MoMo effectué 💳',
              'Pouvez-vous valider ma commande ?',
              'Quel est le délai de livraison ?',
              'Article bien reçu, merci !'
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setChatMessage(preset)}
                className="px-2 py-0.5 rounded-md bg-card border border-border/60 hover:bg-muted text-[10px] text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendImageMessage} className="flex gap-2">
            <Input placeholder="Écrire un message au vendeur..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} className="flex-1 text-xs" />
            <Button type="submit" className="gap-1 text-xs">
              <Send className="w-3.5 h-3.5" /> Envoyer
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  )
}
