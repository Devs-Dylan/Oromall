import { useState } from 'react'
import { MessageSquare, Send, User, CheckCheck, Sparkles, Phone, Mail } from 'lucide-react'
import type { ChatMessage } from '@/types'
import { ChatAPI } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

interface SellerMessagesTabProps {
  messages: ChatMessage[]
  onRefresh: () => void
}

export function SellerMessagesTab({ messages, onRefresh }: SellerMessagesTabProps) {
  const [replyText, setReplyText] = useState('')
  const [activeThreadId, setActiveThreadId] = useState<string>('demo-thread-1')

  // Sample threads for demonstration if empty
  const threads = [
    {
      id: 'demo-thread-1',
      customer_name: 'Christian Atangana',
      customer_phone: '699112233',
      product_name: 'iPhone 13 Pro reconditionné',
      last_message: 'Bonjour, l\'appareil est-il toujours disponible à Yaoundé ?',
      time: 'Il y a 10 min',
      unread: true
    },
    {
      id: 'demo-thread-2',
      customer_name: 'Vanessa Nguema',
      customer_phone: '677889900',
      product_name: 'Studio Meublé Ngoa-Ekellé',
      last_message: 'Est-il possible de faire la visite ce samedi à 14h ?',
      time: 'Il y a 1 heure',
      unread: false
    }
  ]

  const threadMessages = [
    { sender: 'customer', name: 'Christian Atangana', text: 'Bonjour, l\'appareil est-il toujours disponible à Yaoundé ?', date: '11:45' },
    { sender: 'vendor', name: 'Vous', text: 'Bonjour Christian, oui disponible en stock. Garantie 6 mois.', date: '11:50' },
    { sender: 'customer', name: 'Christian Atangana', text: 'Parfait, faites-vous la livraison à la Cité U ?', date: '12:05' },
  ]

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return

    toastSuccess('Réponse envoyée au client !')
    setReplyText('')
  }

  const handleQuickReply = (text: string) => {
    setReplyText(text)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sky-400" /> Messagerie Client Interne
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Répondez en direct aux questions des acheteurs et candidats à la location.
        </p>
      </div>

      {/* Messaging Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[550px]">
        {/* Threads List */}
        <div className="card-glass p-3 flex flex-col space-y-2 overflow-y-auto">
          <h3 className="text-xs font-bold text-muted-foreground px-2 py-1 uppercase tracking-wider">Discussions Récents</h3>
          
          {threads.map(thread => (
            <div
              key={thread.id}
              onClick={() => setActiveThreadId(thread.id)}
              className={`p-3 rounded-xl cursor-pointer transition-all border ${
                activeThreadId === thread.id
                  ? 'bg-primary/10 border-primary/40 shadow-sm'
                  : 'bg-card/50 border-border/30 hover:border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-primary" /> {thread.customer_name}
                </span>
                <span className="text-[10px] text-muted-foreground">{thread.time}</span>
              </div>
              <p className="text-[11px] font-semibold text-primary truncate mt-0.5">{thread.product_name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{thread.last_message}</p>
            </div>
          ))}
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 card-glass flex flex-col justify-between p-4 overflow-hidden">
          {/* Thread Header */}
          <div className="p-3 bg-muted/30 rounded-xl border border-border/40 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-foreground">Christian Atangana</h4>
              <p className="text-[11px] text-muted-foreground">Demande au sujet de: <span className="text-primary font-semibold">iPhone 13 Pro reconditionné</span></p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                Acheteur Vérifié
              </span>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3 px-1">
            {threadMessages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.sender === 'vendor' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs space-y-1 ${
                  msg.sender === 'vendor'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-muted/80 text-foreground border border-border/40 rounded-bl-none'
                }`}>
                  <p className="font-semibold text-[10px] opacity-75">{msg.name}</p>
                  <p>{msg.text}</p>
                  <p className="text-[9px] text-right opacity-60 pt-0.5">{msg.date}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Replies Presets */}
          <div className="py-2 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Réponses rapides :
            </span>
            {[
              'Produit disponible immédiatement !',
              'Oui, la livraison est gratuite à Yaoundé.',
              'Visite possible demain à 10h.',
              'Garantie 6 mois incluse.'
            ].map((preset, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleQuickReply(preset)}
                className="px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 text-[11px] font-medium whitespace-nowrap transition-colors border border-border/40"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendReply} className="flex items-center gap-2 pt-2 border-t border-border/40">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Écrivez votre message..."
              className="text-xs flex-1"
            />
            <Button type="submit" className="gap-1.5">
              <Send className="w-4 h-4" /> Envoyer
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
