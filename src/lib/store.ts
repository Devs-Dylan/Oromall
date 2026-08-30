// Store simulé Base44 (localStorage)
import { generateId } from './utils'
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
  localStorage.setItem(key, JSON.stringify(data))
}
function now() { return new Date().toISOString() }

// ===== Generic CRUD =====
function createCRUD<T extends { id: string; created_date?: string; updated_date?: string }>(key: string) {
  return {
    list: (): T[] => getStore<T>(key),
    get: (id: string): T | undefined => getStore<T>(key).find(i => i.id === id),
    create: (data: Omit<T, 'id' | 'created_date' | 'updated_date'>): T => {
      const items = getStore<T>(key)
      const item = { ...data, id: generateId(), created_date: now(), updated_date: now() } as T
      setStore(key, [...items, item])
      return item
    },
    update: (id: string, data: Partial<T>): T | undefined => {
      const items = getStore<T>(key)
      const idx = items.findIndex(i => i.id === id)
      if (idx === -1) return undefined
      items[idx] = { ...items[idx], ...data, updated_date: now() }
      setStore(key, items)
      return items[idx]
    },
    delete: (id: string): boolean => {
      const items = getStore<T>(key)
      const filtered = items.filter(i => i.id !== id)
      if (filtered.length === items.length) return false
      setStore(key, filtered)
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

// Seed default Ads if empty
if (getStore<Advertisement>('mp_ads').length === 0) {
  setStore<Advertisement>('mp_ads', [
    {
      id: 'ad-1',
      title: 'Grand Spécial Rentrée Académique',
      subtitle: 'Jusqu\'à -35% sur les PC portables, smartphones et fournitures universitaires',
      image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500&q=75&auto=format',
      link_url: '/?cat=Électronique',
      cta_text: 'Profiter des réductions',
      position: 'hero',
      status: 'active',
      badge: 'PROMOTION GOLD ⭐',
      badge_color: 'gold',
      target_city: 'Toutes',
      priority: 10,
      impressions_count: 1420,
      clicks_count: 318,
      created_date: now(),
      updated_date: now(),
    },
    {
      id: 'ad-2',
      title: 'Résidences Étudiantes Bastos & Ngoa-Ekellé',
      subtitle: 'Studios meublés avec eau forfaitaire et gardien 24h/24 disponibles immédiatement',
      image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500&q=75&auto=format',
      link_url: '/housing',
      cta_text: 'Explorer les logements',
      position: 'marketplace_middle',
      status: 'active',
      badge: 'LOGEMENTS VÉRIFIÉS 🏠',
      badge_color: 'emerald',
      target_city: 'Yaoundé',
      priority: 8,
      impressions_count: 980,
      clicks_count: 245,
      created_date: now(),
      updated_date: now(),
    },
    {
      id: 'ad-3',
      title: 'Paiements Sécurisés MTN & Orange Money',
      subtitle: 'Achetez et louez en toute confiance avec validation d\'administrateur et support',
      image_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=500&q=75&auto=format',
      link_url: '/faq',
      cta_text: 'En savoir plus',
      position: 'top_banner',
      status: 'active',
      badge: 'SÉCURITÉ GARANTIE 🔒',
      badge_color: 'blue',
      target_city: 'Toutes',
      priority: 9,
      impressions_count: 2310,
      clicks_count: 412,
      created_date: now(),
      updated_date: now(),
    },
    {
      id: 'ad-4',
      title: 'Vendez vos produits sur OroMall en 2 minutes',
      subtitle: 'Ouvrez votre vitrine en ligne et touchez des milliers de clients partout au Cameroun',
      image_url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=500&q=75&auto=format',
      link_url: '/seller/onboarding',
      cta_text: 'Créer ma boutique',
      position: 'ticker',
      status: 'active',
      badge: 'DEVENEZ VENDEUR 🛍️',
      badge_color: 'purple',
      target_city: 'Toutes',
      priority: 7,
      impressions_count: 540,
      clicks_count: 112,
      created_date: now(),
      updated_date: now(),
    }
  ])
}

// Seed default Shops if empty
if (getStore<Shop>('mp_shops').length === 0) {
  setStore<Shop>('mp_shops', [
    {
      id: 'shop-1',
      name: 'TechCam Yaoundé',
      description: 'Spécialiste Informatique, MacBook, Smartphones et Accessoires d\'Origine à Yaoundé.',
      owner_name: 'Jean-Paul Mbida',
      owner_email: 'jeanpaul.mbida@gmail.com',
      owner_id: 'user-seller-1',
      shop_type: 'specialized',
      status: 'active',
      category: 'Électronique',
      city: 'Yaoundé',
      address: 'Avenue Kennedy, Immeuble Horizon 2ème étage',
      whatsapp_number: '680195221',
      mtn_number: '680195221',
      orange_number: '691576677',
      latitude: 3.86667,
      longitude: 11.51667,
      logo_url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400',
      rating: 4.9,
      reviews_count: 24,
      is_verified: true,
      created_date: now(),
      updated_date: now(),
    },
    {
      id: 'shop-2',
      name: 'Mode & Élégance Douala',
      description: 'Boutique de vêtements tendance, chaussures de marque et maroquinerie de qualité à Douala Akwa.',
      owner_name: 'Marie-Noëlle Eboa',
      owner_email: 'marienoelle.eboa@gmail.com',
      owner_id: 'user-seller-2',
      shop_type: 'individual',
      status: 'active',
      category: 'Mode',
      city: 'Douala',
      address: 'Boulevard de la Liberté, Akwa',
      whatsapp_number: '691576677',
      mtn_number: '677123456',
      orange_number: '691576677',
      latitude: 4.05105,
      longitude: 9.76787,
      logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      rating: 4.8,
      reviews_count: 18,
      is_verified: true,
      created_date: now(),
      updated_date: now(),
    },
    {
      id: 'shop-3',
      name: 'Résidences Bastos Prestige',
      description: 'Agence Immobilière spécialisée dans les studios et appartements haut de standing à Yaoundé Bastos.',
      owner_name: 'Alphonse Tagne',
      owner_email: 'alphonse.tagne@gmail.com',
      owner_id: 'user-seller-3',
      shop_type: 'specialized',
      status: 'active',
      category: 'Services',
      city: 'Yaoundé',
      address: 'Quartier Bastos, Carrefour Dragages',
      whatsapp_number: '677987654',
      mtn_number: '677987654',
      orange_number: '699887766',
      latitude: 3.88333,
      longitude: 11.51667,
      logo_url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
      rating: 5.0,
      reviews_count: 32,
      is_verified: true,
      created_date: now(),
      updated_date: now(),
    }
  ])
}

// Seed default Products if empty
if (getStore<Product>('mp_products').length === 0) {
  setStore<Product>('mp_products', [
    {
      id: 'prod-1',
      shop_id: 'shop-1',
      shop_name: 'TechCam Yaoundé',
      name: 'Apple MacBook Pro M2 16" 512GB - Gris Sidéral',
      description: 'Puce M2 Pro performante, 16 Go de RAM, écran Liquid Retina XDR. Idéal pour les professionnels, développeurs et designers.',
      price: 1250000,
      compare_at_price: 1350000,
      category: 'Électronique',
      condition: 'neuf',
      stock: 5,
      status: 'active',
      is_featured: true,
      city: 'Yaoundé',
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
        'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800'
      ],
      whatsapp_number: '680195221',
      created_date: now(),
      updated_date: now(),
    },
    {
      id: 'prod-2',
      shop_id: 'shop-1',
      shop_name: 'TechCam Yaoundé',
      name: 'iPhone 15 Pro Max 256GB Titanium',
      description: 'Écran Super Retina XDR 120Hz, triple capteur photo 48 MP, autonomie exceptionnelle. Produit scellé avec garantie.',
      price: 950000,
      compare_at_price: 1020000,
      category: 'Électronique',
      condition: 'neuf',
      stock: 8,
      status: 'active',
      is_featured: true,
      city: 'Yaoundé',
      image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800',
      whatsapp_number: '680195221',
      created_date: now(),
      updated_date: now(),
    },
    {
      id: 'prod-3',
      shop_id: 'shop-2',
      shop_name: 'Mode & Élégance Douala',
      name: 'Robe de Soirée Africaine en Pagne Wax Moderne',
      description: 'Confection artisanale sur-mesure, tissu Wax de haute qualité, coupe chic pour cérémonies et événements.',
      price: 45000,
      compare_at_price: 55000,
      category: 'Mode',
      condition: 'neuf',
      stock: 12,
      status: 'active',
      is_featured: false,
      city: 'Douala',
      image_url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800',
      whatsapp_number: '691576677',
      created_date: now(),
      updated_date: now(),
    },
    {
      id: 'prod-4',
      shop_id: 'shop-2',
      shop_name: 'Mode & Élégance Douala',
      name: 'Chaussures richelieu Cuir Véritable Homme',
      description: 'Chaussures habillées en cuir véritable avec semelle cousue. Élégantes et confortables pour le bureau.',
      price: 38000,
      compare_at_price: 48000,
      category: 'Mode',
      condition: 'neuf',
      stock: 10,
      status: 'active',
      is_featured: true,
      city: 'Douala',
      image_url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800',
      whatsapp_number: '691576677',
      created_date: now(),
      updated_date: now(),
    }
  ])
}

// Seed default Housing if empty
if (getStore<Housing>('mp_housing').length === 0) {
  setStore<Housing>('mp_housing', [
    {
      id: 'house-1',
      title: 'Studio Meublé Moderne à Bastos Ambassade',
      description: 'Superbe studio haut standing meublé avec climatisation, eau de forage forfaitaire, gardien 24h/24 et parking réservé.',
      category: 'studio',
      property_type: 'residential',
      price: 180000,
      price_type: 'month',
      price_negotiable: false,
      deposit_amount: 360000,
      payment_frequency: 'monthly',
      city: 'Yaoundé',
      neighborhood: 'Bastos',
      address: 'Rue des Ambassades, près de l\'Ambassade d\'Allemagne',
      latitude: 3.88333,
      longitude: 11.51667,
      surface_sqm: 45,
      bedrooms: 1,
      bathrooms: 1,
      living_rooms: 1,
      kitchens: 1,
      furnished: true,
      air_conditioning: true,
      water_source: 'borehole',
      electricity_source: 'grid',
      amenities: ['wifi', 'eau_gratuite', 'gardien', 'parking', 'climatisation', 'tv', 'cuisine_equipee', 'salon_meuble'],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000'
      ],
      image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000',
      owner_name: 'Alphonse Tagne (Prestige Residence)',
      owner_email: 'alphonse.tagne@gmail.com',
      owner_phone: '677987654',
      whatsapp_number: '677987654',
      status: 'available',
      rating: 4.9,
      reviews_count: 14,
      created_date: now(),
      updated_date: now(),
    },
    {
      id: 'house-2',
      title: 'Appartement 3 Chambres & Grand Salon à Bonapriso',
      description: 'Spacieux appartement meublé idéal pour familles ou séjours d\'affaires à Douala Bonapriso. Balcon avec vue panoramique.',
      category: 'appartement',
      property_type: 'residential',
      price: 350000,
      price_type: 'month',
      price_negotiable: true,
      deposit_amount: 700000,
      payment_frequency: 'monthly',
      city: 'Douala',
      neighborhood: 'Bonapriso',
      address: 'Avenue de la République, Bonapriso',
      latitude: 4.03333,
      longitude: 9.68333,
      surface_sqm: 120,
      bedrooms: 3,
      bathrooms: 2,
      living_rooms: 1,
      kitchens: 1,
      furnished: true,
      air_conditioning: true,
      water_source: 'city',
      electricity_source: 'grid',
      amenities: ['wifi', 'gardien', 'parking', 'climatisation', 'terrasse', 'cuisine_equipee', 'groupe_electrogene'],
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000'
      ],
      image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000',
      owner_name: 'Société Immobilière Bonapriso',
      owner_email: 'immo.bonapriso@gmail.com',
      owner_phone: '699887766',
      whatsapp_number: '699887766',
      status: 'available',
      rating: 4.8,
      reviews_count: 10,
      created_date: now(),
      updated_date: now(),
    }
  ])
}

// Seed default Subscriptions if empty
if (getStore<Subscription>('mp_subscriptions').length === 0) {
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + 28)

  setStore<Subscription>('mp_subscriptions', [
    {
      id: 'sub-1',
      shop_id: 'shop-1',
      shop_name: 'TechCam Yaoundé',
      owner_name: 'Jean-Paul Mbida',
      owner_email: 'jeanpaul.mbida@gmail.com',
      status: 'active',
      amount: 15000,
      currency: 'XAF',
      start_date: now(),
      end_date: futureDate.toISOString(),
      payment_method: 'mtn',
      payment_reference: 'MOMO983472948',
      days_remaining: 28,
      created_date: now(),
      updated_date: now(),
    },
    {
      id: 'sub-2',
      shop_id: 'shop-2',
      shop_name: 'Mode & Élégance Douala',
      owner_name: 'Marie-Noëlle Eboa',
      owner_email: 'marienoelle.eboa@gmail.com',
      status: 'active',
      amount: 15000,
      currency: 'XAF',
      start_date: now(),
      end_date: futureDate.toISOString(),
      payment_method: 'orange',
      payment_reference: 'OM774829381',
      days_remaining: 25,
      created_date: now(),
      updated_date: now(),
    },
    {
      id: 'sub-3',
      shop_id: 'shop-3',
      shop_name: 'Résidences Bastos Prestige',
      owner_name: 'Alphonse Tagne',
      owner_email: 'alphonse.tagne@gmail.com',
      status: 'active',
      amount: 15000,
      currency: 'XAF',
      start_date: now(),
      end_date: futureDate.toISOString(),
      payment_method: 'mtn',
      payment_reference: 'MOMO1294829384',
      days_remaining: 29,
      created_date: now(),
      updated_date: now(),
    }
  ])
}

// Seed default Orders & Commissions if empty
if (getStore<Order>('mp_orders').length === 0) {
  const o1 = {
    id: 'ord-1001',
    shop_id: 'shop-1',
    shop_name: 'TechCam Yaoundé',
    product_id: 'prod-1',
    product_name: 'Apple MacBook Pro M2 16"',
    product_price: 1250000,
    total: 1250000,
    customer_name: 'Paul Emmanuel Nkoa',
    customer_email: 'p.nkoa@gmail.com',
    customer_phone: '677112233',
    status: 'payment_verified' as const,
    payment_method: 'mtn' as const,
    payment_reference: 'TXN1294829384',
    payment_verified: true,
    withdrawal_status: 'verified' as const,
    pin_code: '4829',
    created_date: now(),
    updated_date: now(),
  }

  const o2 = {
    id: 'ord-1002',
    shop_id: 'shop-2',
    shop_name: 'Mode & Élégance Douala',
    product_id: 'prod-3',
    product_name: 'Robe de Soirée Africaine',
    product_price: 45000,
    total: 45000,
    customer_name: 'Chantal Bella',
    customer_email: 'chantal.bella@yahoo.fr',
    customer_phone: '699445566',
    status: 'payment_verified' as const,
    payment_method: 'orange' as const,
    payment_reference: 'OM983472948',
    payment_verified: true,
    withdrawal_status: 'pending' as const,
    pin_code: '1942',
    created_date: now(),
    updated_date: now(),
  }

  setStore<Order>('mp_orders', [o1, o2])

  if (getStore<Commission>('mp_commissions').length === 0) {
    setStore<Commission>('mp_commissions', [
      {
        id: 'comm-1',
        order_id: o1.id,
        shop_id: 'shop-1',
        shop_name: 'TechCam Yaoundé',
        vendor_name: 'Jean-Paul Mbida',
        vendor_email: 'jeanpaul.mbida@gmail.com',
        order_total: 1250000,
        rate: 2,
        amount: 25000, // 2% of 1,250,000 FCFA
        status: 'pending',
        created_date: now(),
      },
      {
        id: 'comm-2',
        order_id: o2.id,
        shop_id: 'shop-2',
        shop_name: 'Mode & Élégance Douala',
        vendor_name: 'Marie-Noëlle Eboa',
        vendor_email: 'marienoelle.eboa@gmail.com',
        order_total: 45000,
        rate: 2,
        amount: 900, // 2% of 45,000 FCFA
        status: 'pending',
        created_date: now(),
      }
    ])
  }
}

// ===== Seed Default Associate Account =====
const existingUsers = getStore<User>('mp_users')
if (!existingUsers.some(u => u.role === 'associate' || u.email === 'associe@oromall.cm')) {
  const defaultAssociate: User = {
    id: 'associe-1',
    name: 'Marc - Agent Bastos & Ngoa-Ekellé',
    email: 'associe@oromall.cm',
    password: 'Associe2026@',
    phone: '699112233',
    role: 'associate',
    account_type: 'client',
    created_date: now(),
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
  }
  setStore<User>('mp_users', [...existingUsers, defaultAssociate])
}

// ===== Seed Demo Pending Associate Housing Submission =====
const existingHousings = getStore<Housing>('mp_housing')
if (!existingHousings.some(h => h.status === 'pending_review')) {
  const pendingSubmission: Housing = {
    id: 'house-assoc-1',
    title: 'Studio Moderne Meublé avec Groupe & Forage - Proche Campus Bastos',
    description: 'Studio ultra moderne récemment construit, entièrement équipé avec climatisation, forage d\'eau potable 24h/24 et groupe électrogène automatique. Idéal étudiant ou jeune cadre.',
    category: 'studio',
    property_type: 'residential',
    price: 95000,
    price_type: 'month',
    price_negotiable: false,
    deposit_amount: 190000,
    payment_frequency: 'monthly',
    city: 'Yaoundé',
    neighborhood: 'Bastos',
    address: 'Carrefour Bastos, face École Américaine',
    latitude: 3.892,
    longitude: 11.512,
    surface_sqm: 38,
    bedrooms: 1,
    bathrooms: 1,
    living_rooms: 1,
    kitchens: 1,
    furnished: true,
    air_conditioning: true,
    water_source: 'borehole',
    electricity_source: 'generator',
    internet_available: true,
    security_24h: true,
    amenities: ['wifi', 'eau_gratuite', 'groupe_electrogene', 'gardien', 'climatisation', 'salon_meuble'],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80',
    ],
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
    owner_name: 'Bailleur M. Ondoa (Vérifié par Marc)',
    whatsapp_number: '237690112233',
    status: 'pending_review',
    submitted_by_associate_id: 'associe-1',
    submitted_by_associate_name: 'Marc - Agent Bastos & Ngoa-Ekellé',
    created_date: now(),
    updated_date: now(),
  }
  setStore<Housing>('mp_housing', [pendingSubmission, ...existingHousings])
}

// ===== Helpers =====
export function clearAllHousings() {
  localStorage.setItem('mp_housing', '[]')
}


