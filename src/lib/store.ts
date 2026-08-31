// Store OroMall - Synchronisé en temps réel avec le serveur Backend REST et Base de Données
import { generateId } from './utils'
import { api } from './api'
import type {
  Shop, Product, Order, CartItem, SellerActivation,
  P2PAccount, PromoCode, Referral, Review, Wishlist, Report, ChatMessage, User,
  Housing, VisitBooking, AuditLog, UserNotification, AvailabilityRequest, Commission, Dispute,
  Subscription, ShopProfile, VisitRequest, Advertisement
} from '@/types'

function getStore<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

function setStore<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.warn('LocalStorage error:', err)
  }
}

function now() { return new Date().toISOString() }

// Map local keys to server collections
const COLLECTION_MAP: Record<string, string> = {
  mp_shops: 'shops',
  mp_products: 'products',
  mp_orders: 'orders',
  mp_cart: 'cart',
  mp_activations: 'activations',
  mp_p2p: 'p2p',
  mp_promos: 'promos',
  mp_referrals: 'referrals',
  mp_reviews: 'reviews',
  mp_wishlist: 'wishlist',
  mp_reports: 'reports',
  mp_chat: 'chat',
  mp_users: 'users',
  mp_housing: 'housing',
  mp_visit_bookings: 'visit_bookings',
  mp_audit_logs: 'audit_logs',
  mp_notifications: 'notifications',
  mp_availability_requests: 'availability_requests',
  mp_commissions: 'commissions',
  mp_disputes: 'disputes',
  mp_subscriptions: 'subscriptions',
  mp_shop_profiles: 'shop_profiles',
  mp_visit_requests: 'visit_requests',
  mp_ads: 'ads',
}

// ===== Generic CRUD with Server Sync =====
function createCRUD<T extends { id: string; created_date?: string; updated_date?: string }>(key: string) {
  const collectionName = COLLECTION_MAP[key] || key.replace(/^mp_/, '')

  return {
    list: (): T[] => getStore<T>(key),
    get: (id: string): T | undefined => getStore<T>(key).find(i => i.id === id),
    create: (data: Omit<T, 'id' | 'created_date' | 'updated_date'> & { id?: string }): T => {
      const items = getStore<T>(key)
      const item = { ...data, id: data.id || generateId(), created_date: now(), updated_date: now() } as T
      setStore(key, [item, ...items])

      // Asynchronous background sync to real backend server
      api.post(`/api/${collectionName}`, item).catch(err => {
        console.warn(`[Store Sync] Échec sync POST /api/${collectionName}:`, err.message)
      })

      return item
    },
    update: (id: string, data: Partial<T>): T | undefined => {
      const items = getStore<T>(key)
      const idx = items.findIndex(i => i.id === id)
      if (idx === -1) return undefined
      items[idx] = { ...items[idx], ...data, updated_date: now() }
      setStore(key, items)

      // Asynchronous background sync to real backend server
      api.put(`/api/${collectionName}/${id}`, data).catch(err => {
        console.warn(`[Store Sync] Échec sync PUT /api/${collectionName}/${id}:`, err.message)
      })

      return items[idx]
    },
    delete: (id: string): boolean => {
      const items = getStore<T>(key)
      const filtered = items.filter(i => i.id !== id)
      if (filtered.length === items.length) return false
      setStore(key, filtered)

      // Asynchronous background sync to real backend server
      api.delete(`/api/${collectionName}/${id}`).catch(err => {
        console.warn(`[Store Sync] Échec sync DELETE /api/${collectionName}/${id}:`, err.message)
      })

      return true
    },
    filter: (pred: (item: T) => boolean): T[] => getStore<T>(key).filter(pred),
  }
}

export const ShopAPI = createCRUD<Shop>('mp_shops')
export const ProductAPI = createCRUD<Product>('mp_products')
export const OrderAPI = createCRUD<Order>('mp_orders')
export const CartAPI = createCRUD<CartItem>('mp_cart')
export const ActivationAPI = createCRUD<SellerActivation>('mp_activations')
export const P2PAPI = createCRUD<P2PAccount>('mp_p2p')
export const PromoAPI = createCRUD<PromoCode>('mp_promos')
export const ReferralAPI = createCRUD<Referral>('mp_referrals')
export const ReviewAPI = createCRUD<Review>('mp_reviews')
export const WishlistAPI = createCRUD<Wishlist>('mp_wishlist')
export const ReportAPI = createCRUD<Report>('mp_reports')
export const ChatAPI = createCRUD<ChatMessage>('mp_chat')
export const UserAPI = createCRUD<User>('mp_users')
export const HousingAPI = createCRUD<Housing>('mp_housing')
export const VisitBookingAPI = createCRUD<VisitBooking>('mp_visit_bookings')
export const AuditLogAPI = createCRUD<AuditLog>('mp_audit_logs')
export const NotificationAPI = createCRUD<UserNotification>('mp_notifications')
export const AvailabilityRequestAPI = createCRUD<AvailabilityRequest>('mp_availability_requests')
export const CommissionAPI = createCRUD<Commission>('mp_commissions')
export const DisputeAPI = createCRUD<Dispute>('mp_disputes')
export const SubscriptionAPI = createCRUD<Subscription>('mp_subscriptions')
export const ShopProfileAPI = createCRUD<ShopProfile>('mp_shop_profiles')
export const VisitRequestAPI = createCRUD<VisitRequest>('mp_visit_requests')
export const AdAPI = createCRUD<Advertisement>('mp_ads')

// ===== Initial & Background Sync with Server =====
let isSyncing = false

export async function syncStoreWithServer() {
  if (isSyncing) return
  isSyncing = true
  try {
    const res = await api.sync()
    if (res?.success && res.data) {
      for (const [key, collectionName] of Object.entries(COLLECTION_MAP)) {
        if (res.data[collectionName]) {
          setStore(key, res.data[collectionName])
        }
      }
    }
  } catch (err: any) {
    console.info('[Store Sync] Serveur local au démarrage ou hors-ligne, utilisation du cache local.')
  } finally {
    isSyncing = false
  }
}

// Auto-trigger sync on load in browser environment
if (typeof window !== 'undefined') {
  syncStoreWithServer()
  // Periodically refresh server data every 30 seconds
  setInterval(() => {
    syncStoreWithServer()
  }, 30000)
}

// ===== Helpers =====
export function clearAllHousings() {
  localStorage.setItem('mp_housing', '[]')
}
