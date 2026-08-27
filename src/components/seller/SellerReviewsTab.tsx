import { useState, useMemo } from 'react'
import { Star, MessageSquare, CornerDownRight, CheckCircle, ShieldCheck, User } from 'lucide-react'
import type { Review } from '@/types'
import { ReviewAPI } from '@/lib/store'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Input'
import { toastSuccess } from '@/components/ui/Toast'

interface SellerReviewsTabProps {
  reviews: Review[]
  onRefresh: () => void
}

export function SellerReviewsTab({ reviews, onRefresh }: SellerReviewsTabProps) {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [replyText, setReplyText] = useState('')

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 4.8
    return (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
  }, [reviews])

  const handleSaveReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReview || !replyText.trim()) return

    ReviewAPI.update(selectedReview.id, {
      vendor_reply: replyText
    })

    toastSuccess('Réponse publique enregistrée et publiée sous l\'avis client !')
    setSelectedReview(null)
    setReplyText('')
    onRefresh()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Rating Overview */}
      <div className="card-glass p-6 bg-gradient-to-r from-amber-500/10 via-card to-background border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Avis & Réputation Boutique
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consultez les évaluations déposées par vos acheteurs et renforcez la confiance en y répondant publiquement.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card p-3 rounded-2xl border border-border">
          <div className="text-center">
            <span className="text-2xl font-extrabold text-amber-400">{avgRating}</span>
            <div className="flex items-center text-amber-400 text-xs">
              {'★'.repeat(Math.round(Number(avgRating)))}
            </div>
          </div>
          <div className="text-xs text-muted-foreground border-l border-border pl-3">
            <p className="font-bold text-foreground">{reviews.length} avis reçus</p>
            <p>98% de satisfaction</p>
          </div>
        </div>
      </div>

      {/* Reviews Feed */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="card-glass p-12 text-center space-y-3">
            <Star className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucun avis client déposé pour l'instant.</p>
          </div>
        ) : (
          reviews.map(rev => (
            <div key={rev.id} className="card-glass p-5 space-y-3 hover:border-amber-500/30 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-400 text-xs">
                    {rev.user_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{rev.user_name}</h4>
                    <p className="text-[10px] text-muted-foreground">{formatDate(rev.created_date)}</p>
                  </div>
                </div>

                <div className="flex items-center text-amber-400 text-xs gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-xs text-foreground bg-muted/30 p-3 rounded-xl border border-border/30">
                "{rev.comment}"
              </p>

              {/* Vendor Reply display */}
              {rev.vendor_reply ? (
                <div className="ml-6 p-3 rounded-xl bg-primary/10 border border-primary/20 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-primary">
                    <CornerDownRight className="w-3.5 h-3.5" /> Votre réponse publique :
                  </div>
                  <p className="text-foreground italic">{rev.vendor_reply}</p>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button
                    onClick={() => { setSelectedReview(rev); setReplyText('') }}
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Répondre publiquement
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Reply Modal */}
      <Modal
        open={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title="Répondre publiquement à l'avis client"
      >
        {selectedReview && (
          <form onSubmit={handleSaveReply} className="space-y-4">
            <div className="p-3 rounded-xl bg-muted text-xs space-y-1">
              <p><strong>Acheteur :</strong> {selectedReview.user_name}</p>
              <p><strong>Commentaire :</strong> "{selectedReview.comment}"</p>
            </div>

            <Textarea
              label="Votre réponse publique"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Merci pour votre confiance ! Nous sommes ravis que le produit vous plaise..."
              rows={4}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setSelectedReview(null)}>Annuler</Button>
              <Button type="submit">Publier la réponse</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
