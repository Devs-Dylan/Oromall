// Types partagés MarchéPlus

export type ShopType = 'individual' | 'specialized' | 'magasin'
export type ShopStatus = 'pending' | 'active' | 'suspended'
export type ProductCondition = 'neuf' | 'tres_bon' | 'bon' | 'correct'
export type ProductStatus = 'active' | 'sold' | 'draft'
export type OrderStatus = 'new' | 'contacted' | 'sold' | 'cancelled' | 'pending_payment' | 'payment_uploaded' | 'payment_verified' | 'completed'
export type ActivationStatus = 'pending' | 'verified' | 'rejected'
export type PaymentMethod = 'mtn' | 'orange'
export type AccountType = 'client' | 'seller'
export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  mtn_number?: string
  orange_number?: string
  account_type?: AccountType
  role: UserRole
  is_banned?: boolean
  created_date: string
  avatar_url?: string
}

export interface AuditLog {
  id: string
  timestamp: string
  admin_name: string
  action: string
  details?: string
  severity?: 'info' | 'warning' | 'danger'
}

export interface ShopPolicy {
  shipping?: string
  returns?: string
  guarantee?: string
}

export interface ShopSocial {
  facebook?: string
  instagram?: string
  website?: string
}

export interface Shop {
  id: string
  name: string
  description: string
  owner_name: string
  owner_email: string
  owner_id: string
  shop_type: ShopType
  status: ShopStatus
  category: string
  city: string
  address?: string
  whatsapp_number: string
  mtn_number?: string
  orange_number?: string
  latitude?: number
  longitude?: number
  logo_url?: string
  banner_url?: string
  business_hours?: string
  rating?: number
  reviews_count?: number
  is_verified?: boolean
  policies?: ShopPolicy
  social_links?: ShopSocial
  created_date: string
  updated_date: string
}

export type HousingCategory = 'studio' | 'appartement' | 'chambre' | 'villa' | 'duplex'
export type HousingStatus = 'available' | 'rented' | 'reserved'
export type HousingPriceType = 'month' | 'day'

export interface Housing {
  id: string
  title: string
  description: string
  category: HousingCategory
  price: number
  price_type: HousingPriceType
  city: string
  neighborhood: string
  address?: string
  latitude: number
  longitude: number
  surface_sqm: number
  bedrooms: number
  bathrooms: number
  furnished: boolean
  amenities: string[]
  images: string[]
  image_url: string
  owner_name: string
  owner_email?: string
  owner_phone?: string
  whatsapp_number: string
  status: HousingStatus
  rating?: number
  reviews_count?: number
  created_date: string
  updated_date?: string
}

export interface VisitBooking {
  id: string
  housing_id: string
  housing_title: string
  user_name: string
  user_email: string
  user_phone: string
  visit_date: string
  visit_time: string
  message?: string
  status: 'pending' | 'confirmed' | 'cancelled'
  created_date: string
  updated_date?: string
}

export interface ProductColor {
  name: string
  hex?: string
  image_url?: string
}

export interface Product {
  id: string
  shop_id: string
  shop_name: string
  name: string
  description: string
  price: number
  image_url: string
  images?: string[]
  colors?: ProductColor[]
  category: string
  stock: number
  condition: ProductCondition
  status: ProductStatus
  is_featured?: boolean
  created_date: string
  updated_date: string
}

export interface OrderItem {
  product_id: string
  name: string
  price: number
  quantity: number
  image_url?: string
}

export interface Order {
  id: string
  shop_id: string
  shop_name: string
  product_id?: string
  product_name: string
  product_price?: number
  items?: OrderItem[]
  total: number
  order_group_id?: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  status: OrderStatus
  message?: string
  payment_proof_url?: string
  payment_verified?: boolean
  pin_code?: string
  promo_code?: string
  discount_amount?: number
  is_p2p?: boolean
  fee_amount?: number
  is_service?: boolean
  booking_date?: string
  slot?: string
  created_date: string
  updated_date: string
}

export interface CartItem {
  id: string
  product_id: string
  shop_id: string
  shop_name: string
  product_name: string
  product_price: number
  quantity: number
  image_url?: string
  is_service?: boolean
  booking_date?: string
  slot?: string
  created_date?: string
  updated_date?: string
}

export interface SellerActivation {
  id: string
  user_name: string
  user_email: string
  shop_name: string
  shop_id?: string
  shop_type: ShopType
  payment_method: PaymentMethod
  amount: number
  status: ActivationStatus
  whatsapp_message?: string
  created_date: string
}

export interface P2PAccount {
  id: string
  user_id: string
  user_name: string
  user_email: string
  status: 'pending' | 'active' | 'expired'
  activation_fee: number
  payment_method: PaymentMethod
  whatsapp_message?: string
  activated_at?: string
  created_date: string
}

export interface PromoCode {
  id: string
  code: string
  description: string
  discount_type: 'percent' | 'fixed'
  value: number
  max_uses?: number
  uses_count: number
  expires_date?: string
  active: boolean
  owner_email?: string
  created_date: string
}

export interface Referral {
  id: string
  referrer_id: string
  referrer_email: string
  referred_email: string
  status: 'pending' | 'converted' | 'rewarded'
  reward_amount: number
  created_date: string
}

export interface Review {
  id: string
  product_id?: string
  shop_id?: string
  user_name: string
  rating: number
  comment: string
  vendor_reply?: string
  created_date: string
}

export interface Wishlist {
  id: string
  product_id: string
  user_id: string
  created_date: string
}

export interface Report {
  id: string
  target_type: 'product' | 'shop' | 'message'
  target_id: string
  target_label: string
  reason: string
  details?: string
  status: 'pending' | 'reviewed' | 'resolved'
  reporter_name: string
  created_date: string
}

export interface ChatMessage {
  id: string
  order_id: string
  sender_role: 'customer' | 'vendor' | 'admin'
  sender_name: string
  message: string
  created_date: string
}

export interface UserNotification {
  id: string
  user_email?: string
  shop_id?: string
  title: string
  message: string
  type: 'order' | 'payment' | 'chat' | 'system'
  link?: string
  read: boolean
  created_date: string
}

export const CATEGORIES = [
  'Toutes', 'Mode', 'Électronique', 'Maison', 'Logement',
  'Beauté', 'Sport', 'Alimentation', 'Services', 'Livres', 'Autre'
] as const

export const CITIES_CAMEROON = [
  'Yaoundé', 'Douala', 'Bafoussam', 'Bamenda', 'Garoua',
  'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi', 'Buea', 'Limbé'
] as const

export const CONDITION_LABELS: Record<ProductCondition, string> = {
  neuf: 'Neuf',
  tres_bon: 'Très bon état',
  bon: 'Bon état',
  correct: 'État correct',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Nouveau',
  contacted: 'Contacté',
  sold: 'Vendu',
  cancelled: 'Annulé',
  pending_payment: 'En attente de paiement',
  payment_uploaded: 'Preuve envoyée',
  payment_verified: 'Paiement vérifié',
  completed: 'Terminé',
}
