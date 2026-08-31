// Types partagés MarchéPlus

export type ShopType = 'individual' | 'specialized' | 'magasin'
export type ShopStatus = 'pending' | 'active' | 'suspended'
export type ProductCondition = 'neuf' | 'tres_bon' | 'bon' | 'correct'
export type ProductStatus = 'active' | 'sold' | 'draft'
export type OrderStatus = 'new' | 'contacted' | 'sold' | 'cancelled' | 'pending_payment' | 'payment_uploaded' | 'payment_verified' | 'completed' | 'approved_by_seller' | 'ready_for_pickup'
export type PaymentProofType = 'reference' | 'image'
export type WithdrawalStatus = 'pending' | 'verified' | 'completed'
export type SubscriptionStatus = 'active' | 'expiring' | 'expired' | 'suspended'
export type ActivationStatus = 'pending' | 'verified' | 'rejected'
export type HousingCategory = 'studio' | 'appartement' | 'chambre' | 'villa' | 'duplex'
export type HousingStatus = 'available' | 'rented' | 'reserved' | 'active' | 'pending_review' | 'rejected'
export type HousingPriceType = 'month' | 'day'
export type PaymentMethod = 'mtn' | 'orange'
export type AccountType = 'client' | 'seller' | 'buyer'
export type UserRole = 'user' | 'admin' | 'associate'

export interface User {
  id: string
  name: string
  email: string
  password: string
  phone?: string
  whatsapp_number?: string
  momo_number?: string
  mtn_number?: string
  orange_number?: string
  account_type?: AccountType
  role: UserRole
  is_banned?: boolean
  loyalty_points?: number
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
  is_verified?: boolean
  category: string
  city: string
  address?: string
  whatsapp_number: string
  whatsapp?: string
  mtn_number?: string
  orange_number?: string
  latitude?: number
  longitude?: number
  logo_url?: string
  profile_image?: string
  cover_image?: string
  business_hours?: string
  rating?: number
  reviews_count?: number
  policies?: ShopPolicy
  social_links?: ShopSocial
  created_date: string
  updated_date: string
}

export interface Housing {
  id: string
  title: string
  description: string
  category: HousingCategory
  property_type: 'residential' | 'commercial' | 'land' | 'office'
  price: number
  price_type: HousingPriceType
  price_negotiable: boolean
  deposit_amount: number
  payment_frequency: 'monthly' | 'quarterly' | 'yearly'
  city: string
  neighborhood: string
  address?: string
  latitude: number
  longitude: number
  surface_sqm: number
  lot_size_sqm?: number
  bedrooms: number
  bathrooms: number
  living_rooms: number
  kitchens: number
  balconies?: number
  parking_spaces?: number
  storage_rooms?: number
  floor_number?: number
  year_built?: number
  furnished: boolean
  furnished_kitchen?: boolean
  air_conditioning: boolean
  heating?: boolean
  swimming_pool?: boolean
  garden?: boolean
  terrace?: boolean
  water_source: 'city' | 'well' | 'borehole' | 'none'
  electricity_source: 'grid' | 'solar' | 'generator' | 'none'
  internet_available?: boolean
  security_24h?: boolean
  pets_allowed?: boolean
  smoking_allowed?: boolean
  legal_status?: 'title_deed' | 'permit' | 'none'
  occupancy_status?: 'vacant' | 'occupied' | 'reserved'
  available_from?: string
  minimum_stay_months?: number
  amenities: string[]
  images: string[]
  image_url: string
  video_url?: string
  virtual_tour_url?: string
  property_documents_url?: string
  owner_name: string
  owner_email?: string
  owner_phone?: string
  whatsapp_number: string
  secondary_phone?: string
  viewing_times?: string
  nearby_schools?: boolean
  nearby_hospitals?: boolean
  nearby_markets?: boolean
  public_transport_access?: boolean
  status: HousingStatus
  submitted_by_associate_id?: string
  submitted_by_associate_name?: string
  rejection_reason?: string
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
  title?: string
  city?: string
  description: string
  price: number
  compare_at_price?: number
  sku?: string
  brand?: string
  tags?: string[]
  image_url: string
  images?: string[]
  colors?: ProductColor[]
  category: string
  stock: number
  condition: ProductCondition
  status: ProductStatus
  is_featured?: boolean
  is_p2p?: boolean
  whatsapp_number?: string
  created_date: string
  updated_date: string
  average_rating?: number
  review_count?: number
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
  shipping_address?: string | { city?: string; neighborhood?: string; [key: string]: any }
  status: OrderStatus
  message?: string
  cancellation_reason?: string
  payment_proof_url?: string
  payment_proof_type?: PaymentProofType
  payment_reference?: string
  payment_verified?: boolean
  payment_method?: PaymentMethod
  pin_code?: string
  withdrawal_status?: WithdrawalStatus
  withdrawal_pin?: string
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
  user_id?: string
  user_name: string
  user_email: string
  shop_name: string
  shop_id?: string
  shop_type: ShopType
  activity_type?: 'seller' | 'bailleur' | 'both'
  category?: string
  city?: string
  whatsapp_number?: string
  mtn_number?: string
  orange_number?: string
  description?: string
  payment_method: PaymentMethod
  amount: number
  status: ActivationStatus
  whatsapp_message?: string
  notes?: string
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
  target_type: 'product' | 'shop' | 'message' | 'order' | 'user'
  target_id: string
  target_label: string
  reason: string
  details?: string
  status: 'pending' | 'reviewed' | 'resolved'
  reporter_name: string
  created_date: string
}

export interface AvailabilityRequest {
  id: string
  product_id: string
  product_name: string
  shop_id: string
  shop_name: string
  customer_name: string
  customer_email: string
  customer_phone: string
  quantity: number
  deadline_date: string
  status: 'pending' | 'approved' | 'rejected' | 'converted'
  created_date: string
  updated_date: string
}

export interface Commission {
  id: string
  order_id: string
  shop_id: string
  shop_name: string
  vendor_name: string
  vendor_email: string
  order_total: number
  rate: number
  amount: number
  status: 'pending' | 'paid' | 'cancelled'
  paid_at?: string
  created_date: string
}

export interface Dispute {
  id: string
  order_id: string
  shop_id: string
  customer_name: string
  customer_email: string
  vendor_name: string
  vendor_email: string
  subject: string
  description: string
  evidence_url?: string
  status: 'open' | 'investigating' | 'resolved_buyer' | 'resolved_seller' | 'closed'
  resolution?: string
  resolved_by?: string
  created_date: string
  updated_date: string
}

export interface Subscription {
  id: string
  shop_id: string
  shop_name: string
  owner_email: string
  owner_name: string
  status: SubscriptionStatus
  amount: number
  currency: string
  start_date: string
  end_date: string
  payment_method?: PaymentMethod
  payment_proof_url?: string
  payment_reference?: string
  payment_proof_type?: PaymentProofType
  days_remaining: number
  created_date: string
  updated_date: string
}

export interface ShopProfile {
  id: string
  shop_id: string
  profile_image: string
  cover_image: string
  updated_date: string
}

export interface ChatMessage {
  id: string
  order_id: string
  sender_role: 'customer' | 'vendor' | 'admin'
  sender_name: string
  message: string
  image_url?: string
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
  'Toutes', 'Mode', 'Électronique', 'Beauté', 'Sport',
  'Alimentation', 'Services', 'Livres', 'Autre'
] as const

export const CITIES_CAMEROON = [
  'Yaoundé', 'Douala', 'Bafoussam', 'Bamenda', 'Garoua',
  'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi', 'Buea', 'Limbé', 'Ambam', 'Dschang', 'Kumba', 'Foumban'
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
  approved_by_seller: 'Approuvé par vendeur',
  ready_for_pickup: 'Prêt pour retrait',
}

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: 'En attente',
  verified: 'PIN vérifié',
  completed: 'Retrait effectué',
}

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Active',
  expiring: 'Expire bientôt',
  expired: 'Expirée',
  suspended: 'Suspendue',
}

export type VisitPackage = 'single' | 'premium'
export type VisitStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'

export interface VisitRequest {
  id: string
  housing_id: string
  housing_title: string
  housing_city: string
  housing_image: string
  visitor_name: string
  visitor_email: string
  visitor_phone: string
  package_type: VisitPackage
  package_label: string
  amount: number
  payment_method: PaymentMethod
  payment_proof_url?: string
  payment_reference?: string
  payment_status: 'pending' | 'paid' | 'rejected'
  visit_date: string
  visit_time: string
  status: VisitStatus
  notes?: string
  created_date: string
  updated_date: string
}

export const VISIT_PACKAGES = [
  { id: 'single', label: 'Visite Simple', description: '1 visite de logement', price: 2000, visits: 1 },
  { id: 'premium', label: 'Visite Premium', description: '3 visites de logements', price: 5000, visits: 3 },
] as const

export const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvée',
  rejected: 'Rejetée',
  completed: 'Effectuée',
  cancelled: 'Annulée',
}

export type AdPosition = 'hero' | 'top_banner' | 'ticker' | 'marketplace_middle' | 'housing_page' | 'sidebar' | 'popup'
export type AdStatus = 'active' | 'paused' | 'scheduled'

export interface Advertisement {
  id: string
  title: string
  subtitle?: string
  image_url: string
  link_url?: string
  cta_text?: string
  position: AdPosition
  status: AdStatus
  badge?: string
  badge_color?: string
  target_city?: string
  action_type?: 'internal_link' | 'whatsapp' | 'call' | 'custom_url' | 'promo_code'
  whatsapp_phone?: string
  promo_code?: string
  budget_amount?: number
  advertiser_name?: string
  advertiser_contact?: string
  priority?: number
  start_date?: string
  end_date?: string
  impressions_count?: number
  clicks_count?: number
  created_date: string
  updated_date?: string
}

