import { useEffect } from 'react'
import { useAuth } from './useAuth'
import { SubscriptionAPI, NotificationAPI } from '@/lib/store'

export function useSubscriptionNotifications() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => {
      const subs = SubscriptionAPI.filter(s => s.owner_email === user.email && s.status === 'active')
      subs.forEach(sub => {
        const endDate = new Date(sub.end_date)
        const now = new Date()
        const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        if (daysRemaining <= 5 && daysRemaining > 0 && (sub.days_remaining ?? Infinity) > 5) {
          SubscriptionAPI.update(sub.id, { days_remaining: daysRemaining, status: 'expiring', updated_date: new Date().toISOString() })
          NotificationAPI.create({
            user_email: user.email,
            title: 'Abonnement expire bientôt',
            message: `Votre abonnement pour "${sub.shop_name}" expire dans ${daysRemaining} jours. Renouvelez-le maintenant.`,
            type: 'system',
            read: false,
          })
        }
      })
    }, 1000 * 60 * 60)
    return () => clearInterval(interval)
  }, [user])
}
