import React, { useState, useMemo } from 'react'
import {
  ShoppingBag, CheckCircle, ShieldCheck, Clock, AlertCircle,
  Phone, Mail, FileText, Key, Eye, XCircle, Trash2, Check,
  MessageSquare, AlertTriangle, ArrowRight, Ban, MapPin,
  ExternalLink, Calendar, User, CreditCard, ChevronRight, Copy, MessageCircle
} from 'lucide-react'
import type { Order } from '@/types'
import { OrderAPI, ChatAPI, NotificationAPI } from '@/lib/store'
import { formatPrice, formatDate, cn, buildWhatsAppUrl } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { toastSuccess, toastError, toastInfo } from '@/components/ui/Toast'

import { InvoiceModal } from '@/components/seller/InvoiceModal'

interface SellerOrdersTabProps {
  orders: Order[]
  onRefresh: () => void
}

const CANCEL_REASONS = [
  'Article actuellement en rupture de stock',
  'Adresse de livraison hors de notre zone de couverture',
  'Preuve de paiement Mobile Money non reçue ou non conforme',
  'Délai de livraison non réalisable pour le moment',
  'Autre motif convenu avec l\'acheteur'
]

export function SellerOrdersTab({ orders, onRefresh }: SellerOrdersTabProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'completed' | 'cancelled'>('all')
  const [pinInput, setPinInput] = useState('')

  // Detailed Inspection Modal state
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null)

  // Invoice Modal state
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null)

  // PIN modal state (standalone or from inspection)
  const [pinModalOrder, setPinModalOrder] = useState<Order | null>(null)

  // Reject / Cancel Order Modal state
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null)
  const [rejectReason, setRejectReason] = useState<string>(CANCEL_REASONS[0])
  const [customReason, setCustomReason] = useState<string>('')

  // Delete confirmation modal state
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)

  // 1. Approuver la commande (Accusé de réception & préparation)
  const handleApproveOrder = (order: Order) => {
    OrderAPI.update(order.id, {
      status: 'approved_by_seller'
    })

    ChatAPI.create({
      order_id: order.id,
      sender_role: 'vendor',
      sender_name: order.shop_name,
      message: `✅ Commande #${order.id.slice(0, 8)} acceptée et en cours de préparation par ${order.shop_name}.`
    })

    NotificationAPI.create({
      user_email: order.customer_email,
      title: `Commande #${order.id.slice(0, 8)} Approuvée`,
      message: `Votre commande pour "${order.product_name}" a été acceptée par la boutique.`,
      type: 'order',
      read: false
    })

    if (inspectingOrder?.id === order.id) {
      setInspectingOrder(OrderAPI.get(order.id) || null)
    }

    toastSuccess('Commande approuvée avec succès ! Client notifié.')
    onRefresh()
  }

  // 2. Validation Preuve MoMo
  const handleVerifyPayment = (order: Order) => {
    OrderAPI.update(order.id, {
      status: 'payment_verified',
      payment_verified: true
    })

    ChatAPI.create({
      order_id: order.id,
      sender_role: 'vendor',
      sender_name: order.shop_name,
      message: `💳 Paiement Mobile Money validé pour la commande #${order.id.slice(0, 8)}. Préparation de la livraison.`
    })

    NotificationAPI.create({
      user_email: order.customer_email,
      title: `Paiement Confirmé - Commande #${order.id.slice(0, 8)}`,
      message: `Le paiement pour "${order.product_name}" a été vérifié par le vendeur.`,
      type: 'payment',
      read: false
    })

    if (inspectingOrder?.id === order.id) {
      setInspectingOrder(OrderAPI.get(order.id) || null)
    }

    toastSuccess('Preuve de paiement Mobile Money vérifiée avec succès !')
    onRefresh()
  }

  // 3. Refuser / Annuler une commande
  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingOrder) return

    const finalReason = rejectReason === 'Autre motif convenu avec l\'acheteur'
      ? (customReason.trim() || 'Commande annulée par le vendeur')
      : rejectReason

    OrderAPI.update(rejectingOrder.id, {
      status: 'cancelled',
      cancellation_reason: finalReason
    })

    // Notify customer in chat & notifications
    ChatAPI.create({
      order_id: rejectingOrder.id,
      sender_role: 'vendor',
      sender_name: rejectingOrder.shop_name,
      message: `❌ Commande #${rejectingOrder.id.slice(0, 8)} refusée/annulée par le vendeur. Motif : ${finalReason}`
    })

    NotificationAPI.create({
      user_email: rejectingOrder.customer_email,
      title: `Commande #${rejectingOrder.id.slice(0, 8)} Refusée`,
      message: `Le vendeur a décliné la commande : "${finalReason}".`,
      type: 'order',
      read: false
    })

    if (inspectingOrder?.id === rejectingOrder.id) {
      setInspectingOrder(OrderAPI.get(rejectingOrder.id) || null)
    }

    toastInfo('Commande refusée et client notifié.')
    setRejectingOrder(null)
    setCustomReason('')
    onRefresh()
  }

  // 4. Supprimer définitivement une commande
  const handleConfirmDelete = () => {
    if (!deletingOrder) return
    OrderAPI.delete(deletingOrder.id)
    if (inspectingOrder?.id === deletingOrder.id) {
      setInspectingOrder(null)
    }
    toastSuccess('Commande définitivement supprimée.')
    setDeletingOrder(null)
    onRefresh()
  }

  // 5. Marquer comme livrée avec validation du Code PIN
  const handleCompleteOrderWithPin = (e: React.FormEvent, targetOrder?: Order) => {
    e.preventDefault()
    const activeOrd = targetOrder || pinModalOrder || inspectingOrder
    if (!activeOrd) return

    const expectedPin = activeOrd.pin_code || '1234'
    if (pinInput.trim() !== expectedPin) {
      toastError(`Code PIN incorrect. (Code PIN attendu : ${expectedPin})`)
      return
    }

    OrderAPI.update(activeOrd.id, {
      status: 'completed'
    })

    ChatAPI.create({
      order_id: activeOrd.id,
      sender_role: 'vendor',
      sender_name: activeOrd.shop_name,
      message: `🎉 Colis livré en main propre et validé avec succès via le code PIN #${expectedPin}. Merci pour votre confiance !`
    })

    NotificationAPI.create({
      user_email: activeOrd.customer_email,
      title: `Commande #${activeOrd.id.slice(0, 8)} Livrée & Complétée`,
      message: `Votre commande a été validée avec succès.`,
      type: 'order',
      read: false
    })

    if (inspectingOrder?.id === activeOrd.id) {
      setInspectingOrder(OrderAPI.get(activeOrd.id) || null)
    }

    toastSuccess('Code PIN validé ! La commande est marquée comme Livrée & Complétée.')
    setPinModalOrder(null)
    setPinInput('')
    onRefresh()
  }

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (statusFilter === 'pending') {
        return o.status === 'new' || o.status === 'payment_uploaded' || o.status === 'pending_payment'
      }
      if (statusFilter === 'verified') {
        return o.status === 'payment_verified' || o.status === 'approved_by_seller'
      }
      if (statusFilter === 'completed') {
        return o.status === 'completed' || o.status === 'sold'
      }
      if (statusFilter === 'cancelled') {
        return o.status === 'cancelled'
      }
      return true
    })
  }, [orders, statusFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" /> Commandes & Hub Mobile Money ({orders.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inspectez chaque commande en détail, vérifiez les preuves MoMo, validez les codes PIN ou gérez les annulations.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card-glass p-3 flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'all', label: `Toutes (${orders.length})` },
          { id: 'pending', label: `En Attente (${orders.filter(o => o.status === 'payment_uploaded' || o.status === 'new' || o.status === 'pending_payment').length})` },
          { id: 'verified', label: `Approuvées / Payées (${orders.filter(o => o.status === 'payment_verified' || o.status === 'approved_by_seller').length})` },
          { id: 'completed', label: `Livrées (${orders.filter(o => o.status === 'completed' || o.status === 'sold').length})` },
          { id: 'cancelled', label: `Refusées / Annulées (${orders.filter(o => o.status === 'cancelled').length})` },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id as any)}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all',
              statusFilter === f.id ? 'bg-primary text-white shadow-sm' : 'bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="card-glass p-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucune commande enregistrée pour ce filtre.</p>
          </div>
        ) : (
          filteredOrders.map(ord => {
            const shipAddr = ord.shipping_address as any
            const city = shipAddr?.city || 'Cameroun'
            const neighborhood = shipAddr?.neighborhood || ''

            return (
              <div
                key={ord.id}
                onClick={() => setInspectingOrder(ord)}
                className="card-glass p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
                      ID #{ord.id.slice(0, 8)}
                    </span>
                    <span className="text-xs font-bold text-foreground truncate">{ord.customer_name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400" /> {ord.customer_phone || 'Non renseigné'}
                    </span>
                    {neighborhood && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-primary" /> {city} ({neighborhood})
                      </span>
                    )}
                    <span className="text-[11px] text-muted-foreground">
                      {formatDate(ord.created_date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-foreground">
                      Produit: <span className="text-primary group-hover:underline">{ord.product_name}</span>
                    </div>
                    <div className="text-sm font-extrabold text-emerald-400">
                      {formatPrice(ord.total)}
                    </div>
                  </div>

                  {ord.payment_proof_url && (
                    <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 w-fit">
                      <FileText className="w-4 h-4" />
                      <span>Preuve MoMo disponible</span>
                    </div>
                  )}

                  {ord.status === 'cancelled' && ord.cancellation_reason && (
                    <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 w-fit">
                      <Ban className="w-3.5 h-3.5" />
                      <span>Motif du refus : <strong>{ord.cancellation_reason}</strong></span>
                    </div>
                  )}
                </div>

                {/* Status and Action Buttons */}
                <div
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="text-center sm:text-right">
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-bold inline-block border',
                      ord.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      ord.status === 'payment_verified' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                      ord.status === 'approved_by_seller' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      ord.status === 'payment_uploaded' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      ord.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    )}>
                      {ord.status === 'payment_uploaded' ? 'Preuve reçue 📥' :
                       ord.status === 'payment_verified' ? 'Payé (Vérifié) 💳' :
                       ord.status === 'approved_by_seller' ? 'Approuvé ✨' :
                       ord.status === 'completed' ? 'Livrée & Validée ✅' :
                       ord.status === 'cancelled' ? 'Refusée / Annulée ❌' : 'En attente ⏳'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 justify-end">
                  {/* Main Inspect Button */}
                  <Button
                    onClick={() => setInspectingOrder(ord)}
                    size="sm"
                    className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-white transition-all text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Gérer & Inspecter
                  </Button>

                  {/* Facture Pro Button */}
                  <Button
                    onClick={() => setInvoiceOrder(ord)}
                    size="sm"
                    variant="outline"
                    className="text-xs border-slate-700 hover:bg-muted"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Facture Pro
                  </Button>

                    {/* WhatsApp Direct */}
                    <a
                      href={buildWhatsAppUrl(
                        ord.customer_phone || '237680195221',
                        `Bonjour ${ord.customer_name}, je vous contacte concernant votre commande #${ord.id.slice(0, 8)} (${ord.product_name}) sur OroMall.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow"
                      title="Contacter l'acheteur sur WhatsApp"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>

                    {/* Quick PIN validation */}
                    {(ord.status === 'payment_verified' || ord.status === 'approved_by_seller' || ord.status === 'new') && (
                      <Button
                        onClick={() => { setPinModalOrder(ord); setPinInput('') }}
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 border-primary/40 text-primary"
                        title="Valider la livraison par code PIN"
                      >
                        <Key className="w-3.5 h-3.5" /> PIN
                      </Button>
                    )}

                    {/* Refuser button */}
                    {ord.status !== 'completed' && ord.status !== 'cancelled' && (
                      <Button
                        onClick={() => {
                          setRejectingOrder(ord)
                          setRejectReason(CANCEL_REASONS[0])
                          setCustomReason('')
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                        title="Refuser ou annuler cette commande"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </Button>
                    )}

                    {/* Delete button */}
                    <Button
                      onClick={() => setDeletingOrder(ord)}
                      variant="ghost"
                      size="sm"
                      className="text-xs p-2 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                      title="Supprimer définitivement la commande"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* FULL DETAILED INSPECTION MODAL */}
      {/* ========================================================================= */}
      <Modal
        open={!!inspectingOrder}
        onClose={() => setInspectingOrder(null)}
        title={`Inspection Complète - Commande #${inspectingOrder?.id.slice(0, 8)}`}
        size="lg"
      >
        {inspectingOrder && (
          <div className="space-y-4 text-xs">
            {/* Status & ID banner */}
            <div className="p-3.5 rounded-2xl bg-card border border-border flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-primary">Commande #{inspectingOrder.id}</span>
                  <span className={cn(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-bold border',
                    inspectingOrder.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    inspectingOrder.status === 'payment_verified' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    inspectingOrder.status === 'approved_by_seller' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    inspectingOrder.status === 'payment_uploaded' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    inspectingOrder.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                    'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  )}>
                    {inspectingOrder.status}
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px]">
                  Passée le {formatDate(inspectingOrder.created_date)} • Boutique : <strong>{inspectingOrder.shop_name}</strong>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Total Commande</span>
                <span className="text-xl font-black text-emerald-400">{formatPrice(inspectingOrder.total)}</span>
              </div>
            </div>

            {/* Grid 2 Columns: Client info vs Delivery & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* 1. Client & Contact */}
              <div className="p-3.5 rounded-2xl bg-card border border-border space-y-2.5">
                <h4 className="font-bold text-foreground flex items-center gap-1.5 text-xs text-primary">
                  <User className="w-3.5 h-3.5" /> 1. Informations de l'Acheteur
                </h4>
                <div className="space-y-1.5 text-[11px]">
                  <p><span className="text-muted-foreground">Nom complet :</span> <strong className="text-foreground">{inspectingOrder.customer_name}</strong></p>
                  <p><span className="text-muted-foreground">Numéro WhatsApp :</span> <strong className="text-emerald-400">{inspectingOrder.customer_phone || 'Non spécifié'}</strong></p>
                  <p><span className="text-muted-foreground">Email :</span> {inspectingOrder.customer_email || 'Non spécifié'}</p>
                  
                  {inspectingOrder.customer_phone && (
                    <div className="pt-1">
                      <a
                        href={buildWhatsAppUrl(
                          inspectingOrder.customer_phone,
                          `Bonjour ${inspectingOrder.customer_name}, je suis le vendeur de "${inspectingOrder.product_name}" sur OroMall. Je vous contacte pour convenir de la livraison.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Discuter sur WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Lieu de Livraison */}
              <div className="p-3.5 rounded-2xl bg-card border border-border space-y-2.5">
                <h4 className="font-bold text-foreground flex items-center gap-1.5 text-xs text-primary">
                  <MapPin className="w-3.5 h-3.5" /> 2. Adresse & Modalités de Livraison
                </h4>
                <div className="space-y-1.5 text-[11px]">
                  <p>
                    <span className="text-muted-foreground">Ville :</span>{' '}
                    <strong>{(inspectingOrder.shipping_address as any)?.city || 'Cameroun'}</strong>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Quartier / Repère :</span>{' '}
                    <strong className="text-foreground">{(inspectingOrder.shipping_address as any)?.neighborhood || 'Non spécifié'}</strong>
                  </p>
                  {(inspectingOrder.shipping_address as any)?.notes && (
                    <p className="bg-muted/40 p-2 rounded-lg italic text-muted-foreground">
                      "{(inspectingOrder.shipping_address as any).notes}"
                    </p>
                  )}
                  {inspectingOrder.message && !((inspectingOrder.shipping_address as any)?.notes) && (
                    <p className="bg-muted/40 p-2 rounded-lg italic text-muted-foreground">
                      "{inspectingOrder.message}"
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Mobile Money Payment details & Proof */}
            <div className="p-3.5 rounded-2xl bg-card border border-border space-y-3">
              <h4 className="font-bold text-foreground flex items-center justify-between text-xs text-amber-400">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> 3. Paiement Mobile Money & Preuve
                </span>
                <span className="text-foreground font-semibold">
                  Méthode : <strong className="uppercase text-primary">{inspectingOrder.payment_method || 'Mobile Money'}</strong>
                </span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div>
                  <p><span className="text-muted-foreground">Statut de vérification :</span>{' '}
                    <strong>{inspectingOrder.payment_verified ? '✅ Vérifié & Validé' : '⏳ En attente de vérification'}</strong>
                  </p>
                  {inspectingOrder.payment_reference && (
                    <p className="mt-1">
                      <span className="text-muted-foreground">Réf Transaction :</span>{' '}
                      <code className="bg-muted px-1.5 py-0.5 rounded font-mono font-bold text-primary">{inspectingOrder.payment_reference}</code>
                    </p>
                  )}
                </div>

                {inspectingOrder.payment_proof_url && (
                  <div className="space-y-1.5">
                    <p className="text-muted-foreground font-semibold">Preuve de transfert téléversée :</p>
                    <a
                      href={inspectingOrder.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-xl border border-border hover:border-primary transition-all max-w-[200px]"
                    >
                      <img
                        src={inspectingOrder.payment_proof_url}
                        alt="Reçu de paiement"
                        className="w-full h-24 object-cover hover:scale-105 transition-transform"
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Security Delivery PIN code Box */}
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/30 space-y-2">
              <h4 className="font-bold text-foreground flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-primary">
                  <Key className="w-3.5 h-3.5" /> 4. Validation Sécurisée par Code PIN
                </span>
                <span className="font-mono font-black text-sm bg-primary/20 text-primary px-2.5 py-0.5 rounded border border-primary/30">
                  PIN Client : {inspectingOrder.pin_code || '1234'}
                </span>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Lors de la livraison, demandez ce code PIN au client pour clôturer la commande et confirmer la réception en main propre.
              </p>

              {inspectingOrder.status !== 'completed' && inspectingOrder.status !== 'cancelled' && (
                <form
                  onSubmit={(e) => handleCompleteOrderWithPin(e, inspectingOrder)}
                  className="flex items-center gap-2 pt-1"
                >
                  <Input
                    type="password"
                    maxLength={6}
                    placeholder="Entrez le code PIN remis par le client..."
                    value={pinInput}
                    onChange={e => setPinInput(e.target.value)}
                    className="flex-1 text-xs"
                    required
                  />
                  <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs whitespace-nowrap">
                    Valider la livraison
                  </Button>
                </form>
              )}
            </div>

            {/* Quick Actions in Inspection */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                {inspectingOrder.status === 'pending_payment' && (
                  <Button onClick={() => handleApproveOrder(inspectingOrder)} size="sm" className="bg-purple-600 hover:bg-purple-500 text-white text-xs gap-1">
                    <Check className="w-3.5 h-3.5" /> Approuver la commande
                  </Button>
                )}

                {inspectingOrder.status === 'payment_uploaded' && (
                  <Button onClick={() => handleVerifyPayment(inspectingOrder)} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Valider Paiement MoMo
                  </Button>
                )}

                {inspectingOrder.status !== 'completed' && inspectingOrder.status !== 'cancelled' && (
                  <Button
                    onClick={() => {
                      setRejectingOrder(inspectingOrder)
                      setRejectReason(CANCEL_REASONS[0])
                      setCustomReason('')
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs text-rose-400 hover:bg-rose-500/10"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Refuser
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setDeletingOrder(inspectingOrder)}
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setInspectingOrder(null)}>
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* STANDALONE PIN MODAL */}
      <Modal
        open={!!pinModalOrder}
        onClose={() => setPinModalOrder(null)}
        title="Validation par Code PIN de Livraison"
      >
        {pinModalOrder && (
          <form onSubmit={(e) => handleCompleteOrderWithPin(e, pinModalOrder)} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1 text-foreground">
              <p><strong>Acheteur :</strong> {pinModalOrder.customer_name}</p>
              <p><strong>Article :</strong> {pinModalOrder.product_name}</p>
              <p><strong>Montant Total :</strong> {formatPrice(pinModalOrder.total)}</p>
              <p className="text-muted-foreground pt-1">
                Entrez le code PIN remis par le client au livreur lors de la remise du colis en main propre.
              </p>
            </div>

            <Input
              label="Code PIN Client à 4 chiffres"
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="Entrez le code PIN..."
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPinModalOrder(null)}>
                Annuler
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Valider la livraison
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* REJECT / CANCEL ORDER MODAL */}
      <Modal
        open={!!rejectingOrder}
        onClose={() => setRejectingOrder(null)}
        title="Refuser ou Annuler la commande"
      >
        {rejectingOrder && (
          <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1 text-rose-300">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Annulation de la commande #{rejectingOrder.id.slice(0, 8)}
              </p>
              <p className="text-slate-300">
                Article : <strong>{rejectingOrder.product_name}</strong> • Acheteur : <strong>{rejectingOrder.customer_name}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <label className="font-bold text-foreground">Sélectionnez le motif du refus :</label>
              <div className="space-y-1.5">
                {CANCEL_REASONS.map(reason => (
                  <label
                    key={reason}
                    className={cn(
                      'flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all',
                      rejectReason === reason
                        ? 'bg-rose-500/10 border-rose-500/40 text-foreground font-semibold'
                        : 'bg-card border-border text-muted-foreground hover:bg-muted'
                    )}
                  >
                    <input
                      type="radio"
                      name="cancel_reason"
                      value={reason}
                      checked={rejectReason === reason}
                      onChange={() => setRejectReason(reason)}
                      className="mt-0.5"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            {rejectReason === 'Autre motif convenu avec l\'acheteur' && (
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Précisez le motif :</label>
                <Input
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  placeholder="Ex: Rupture temporaire, contact téléphonique passé..."
                  required
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setRejectingOrder(null)}>
                Fermer
              </Button>
              <Button type="submit" className="bg-rose-600 hover:bg-rose-500 text-white">
                Confirmer le refus
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        open={!!deletingOrder}
        onClose={() => setDeletingOrder(null)}
        title="Supprimer la commande"
      >
        {deletingOrder && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 space-y-1 text-destructive">
              <p className="font-bold flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Êtes-vous sûr de vouloir supprimer cette commande ?
              </p>
              <p className="text-muted-foreground">
                Commande #{deletingOrder.id.slice(0, 8)} ({deletingOrder.product_name}) pour {deletingOrder.customer_name}.
              </p>
              <p className="text-muted-foreground text-[11px] pt-1">
                Cette action retirera définitivement cette commande de votre espace.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setDeletingOrder(null)}>
                Annuler
              </Button>
              <Button type="button" onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90 text-white">
                Supprimer définitivement
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* INVOICE MODAL */}
      <InvoiceModal
        order={invoiceOrder}
        open={!!invoiceOrder}
        onClose={() => setInvoiceOrder(null)}
      />
    </div>
  )
}
