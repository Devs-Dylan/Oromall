import { useState, useEffect } from 'react'
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
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)

  const threads = messages.length > 0 ? messages.map(m => ({
    id: m.id,
    customer_name: m.sender_name,
    customer_phone: '',
    product_name: '',
    last_message: m.message,
    time: formatDate(m.created_date),
    unread: false
  })) : []

  useEffect(() => {
    if (threads.length > 0 && !activeThreadId) {
      setActiveThreadId(threads[0].id)
    }
  }, [threads, activeThreadId])

  const activeThread = threads.find(t => t.id === activeThreadId)

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
          {activeThread ? (
            <>
              {/* Thread Header */}
              <div className="p-3 bg-muted/30 rounded-xl border border-border/40 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-foreground">{activeThread.customer_name}</h4>
                  <p className="text-[11px] text-muted-foreground">Demande au sujet de: <span className="text-primary font-semibold">{activeThread.product_name}</span></p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    Acheteur Vérifié
                  </span>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3 px-1">
                {activeThread && (
                  <div className="flex flex-col items-start">
                    <div className="max-w-[80%] p-3 rounded-2xl text-xs space-y-1 bg-muted/80 text-foreground border border-border/40 rounded-bl-none">
                      <p className="font-semibold text-[10px] opacity-75">{activeThread.customer_name}</p>
                      <p>{activeThread.last_message}</p>
                    </div>
                  </div>
                )}
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Aucune discussion sélectionnée
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
