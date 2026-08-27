import { useState } from 'react'
import { Printer, Download, CheckCircle, Store, Phone, Mail, Calendar, FileText, ShieldCheck, CreditCard } from 'lucide-react'
import type { Order } from '@/types'
import { ShopAPI } from '@/lib/store'
import { formatPrice, formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface InvoiceModalProps {
  order: Order | null
  open: boolean
  onClose: () => void
}

export function InvoiceModal({ order, open, onClose }: InvoiceModalProps) {
  if (!order) return null

  const shop = ShopAPI.get(order.shop_id)

  const handlePrint = () => {
    window.print()
  }

  const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}`
  const taxAmount = Math.round(order.total * 0.05) // 5% TPS/TVA estimée
  const netAmount = order.total - taxAmount

  return (
    <Modal open={open} onClose={onClose} title="Facture Professionnelle PDF / A4">
      <div className="space-y-6">
        {/* Actions header */}
        <div className="flex items-center justify-between border-b border-border pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Facture Validée
            </span>
            <span className="text-xs text-muted-foreground">Réf: {invoiceNumber}</span>
          </div>
          <Button onClick={handlePrint} className="bg-primary text-white text-xs font-bold">
            <Printer className="w-4 h-4 mr-1.5" /> Imprimer / Imprimer en PDF
          </Button>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8 font-sans print:shadow-none print:border-none print:p-0">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <Store className="w-7 h-7 text-emerald-600" />
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {shop?.name || 'BOUTIQUE OFFICIELLE'}
                </h1>
                {shop?.is_verified && (
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Vérifiée
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{shop?.city || 'Cameroun'} • {shop?.address || 'MarchéPlus Pro'}</p>
              <p className="text-xs text-slate-500">Tel/WhatsApp: {shop?.whatsapp_number || '237680195221'}</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-black uppercase tracking-wider">
                FACTURE OFFICIELLE
              </span>
              <p className="text-sm font-bold text-slate-900 mt-2">{invoiceNumber}</p>
              <p className="text-xs text-slate-500">Date: {formatDate(order.created_date)}</p>
            </div>
          </div>

          {/* Client & Payment Info */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl text-xs">
            <div>
              <p className="font-extrabold text-slate-400 uppercase tracking-wider mb-1">FACTURÉ À :</p>
              <p className="font-bold text-slate-900 text-sm">{order.customer_name}</p>
              <p className="text-slate-600">Tel: {order.customer_phone}</p>
              <p className="text-slate-600">Ville: {(order as any).customer_city || 'Douala/Yaoundé'}</p>
            </div>

            <div>
              <p className="font-extrabold text-slate-400 uppercase tracking-wider mb-1">MODE DE RÈGLEMENT :</p>
              <p className="font-bold text-slate-900 flex items-center gap-1">
                <CreditCard className="w-4 h-4 text-emerald-600" /> {order.payment_method?.toUpperCase() || 'MOBILE MONEY'}
              </p>
              {order.payment_reference && (
                <p className="text-slate-600">Réf Txn: <strong className="font-mono text-slate-900">{order.payment_reference}</strong></p>
              )}
              <p className="text-slate-600 mt-1">Statut: <span className="font-bold text-emerald-600">PAYÉ & CERTIFIÉ ✅</span></p>
            </div>
          </div>

          {/* Table Items */}
          <div className="border rounded-xl overflow-hidden border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase">
                <tr>
                  <th className="p-3">Désignation Produit</th>
                  <th className="p-3 text-center">Qté</th>
                  <th className="p-3 text-right">Prix Unitaire</th>
                  <th className="p-3 text-right">Total Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-3 font-bold text-slate-900">{order.product_name}</td>
                  <td className="p-3 text-center font-bold text-slate-800">{(order as any).quantity || 1}</td>
                  <td className="p-3 text-right text-slate-600">{formatPrice((order as any).unit_price || order.total)}</td>
                  <td className="p-3 text-right font-black text-slate-900">{formatPrice(order.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total calculation */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total HT :</span>
                <span className="font-bold">{formatPrice(netAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Services & TPS (5%) :</span>
                <span className="font-bold">{formatPrice(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black text-base pt-2 border-t border-slate-300">
                <span>TOTAL TTC :</span>
                <span className="text-emerald-600">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="border-t border-slate-200 pt-6 flex items-center justify-between text-[11px] text-slate-500">
            <div>
              <p className="font-bold text-slate-700">Merci de votre confiance !</p>
              <p>Facture générée automatiquement via la plateforme MarchéPlus Cameroon.</p>
            </div>
            <div className="text-right font-mono text-[10px]">
              <p>Authenticité certifiée par OroMall Cloud System 🛡️</p>
            </div>
          </div>

        </div>
      </div>
    </Modal>
  )
}
