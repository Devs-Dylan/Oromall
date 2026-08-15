// Store simulé Base44 (localStorage)
import { generateId } from './utils'
import type {
  Shop, Product, Order, CartItem, SellerActivation,
  P2PAccount, PromoCode, Referral, Review, Wishlist, Report, ChatMessage, User,
  Housing, VisitBooking, AuditLog, UserNotification
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

// ===== Seed Demo Data =====
export function seedDemoData() {
  if (localStorage.getItem('mp_seeded')) return

  const shopIds = [generateId(), generateId(), generateId(), generateId()]

  const shops: Shop[] = [
    {
      id: shopIds[0], name: 'TechHub Yaoundé', description: 'Électronique neuve et reconditionnée, accessoires, téléphones. Service après-vente garanti.',
      owner_name: 'Armel Nkeng', owner_email: 'armel@example.cm', owner_id: 'demo1',
      shop_type: 'specialized', status: 'active', category: 'Électronique',
      city: 'Yaoundé', address: 'Avenue Kennedy, Rue des boutiques, Yaoundé',
      whatsapp_number: '237680195221', mtn_number: '680195221', orange_number: '691576677',
      latitude: 3.868, longitude: 11.521, logo_url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=200',
      banner_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1000',
      business_hours: 'Lun - Sam: 08h00 - 19h30', rating: 4.8, reviews_count: 24, is_verified: true,
      policies: { shipping: 'Livraison gratuite sur le campus universitaire', returns: 'Retours acceptés sous 7 jours', guarantee: 'Garantie 6 mois sur le reconditionné' },
      social_links: { facebook: 'https://facebook.com', website: 'https://techhub-cm.com' },
      created_date: new Date(Date.now() - 30 * 86400000).toISOString(), updated_date: now(),
    },
    {
      id: shopIds[1], name: 'Bella Mode Douala', description: 'Mode féminine tendance pour les étudiantes. Vêtements, sacs, chaussures et accessoires.',
      owner_name: 'Sandra Biya', owner_email: 'sandra@example.cm', owner_id: 'demo2',
      shop_type: 'individual', status: 'active', category: 'Mode',
      city: 'Douala', address: 'Carrefour Bonakouamang, Akwa, Douala',
      whatsapp_number: '237680195221', mtn_number: '680195221', orange_number: '691576677',
      latitude: 4.048, longitude: 9.704, logo_url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=200',
      banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000',
      business_hours: 'Mar - Dim: 09h00 - 20h00', rating: 4.9, reviews_count: 18, is_verified: true,
      policies: { shipping: 'Expédition rapide vers toutes les villes du Cameroun', returns: 'Échange sous 3 jours' },
      created_date: new Date(Date.now() - 15 * 86400000).toISOString(), updated_date: now(),
    },
    {
      id: shopIds[2], name: 'Campus Livres Bafoussam', description: 'Manuels universitaires, polycopiés, romans, livres scolaires d\'occasion.',
      owner_name: 'Paul Foning', owner_email: 'paul@example.cm', owner_id: 'demo3',
      shop_type: 'individual', status: 'active', category: 'Livres',
      city: 'Bafoussam', address: 'Quartier Tamdja, face Université',
      whatsapp_number: '237680195221', orange_number: '691576677', mtn_number: '680195221',
      latitude: 5.477, longitude: 10.417, logo_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=200',
      banner_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1000',
      business_hours: 'Lun - Ven: 07h30 - 18h00', rating: 4.6, reviews_count: 12, is_verified: false,
      created_date: new Date(Date.now() - 5 * 86400000).toISOString(), updated_date: now(),
    },
    {
      id: shopIds[3], name: 'FreshFood Cameroun', description: 'Produits alimentaires locaux, épices du village, plats cuisinés, jus de fruits naturels.',
      owner_name: 'Marie Mbassi', owner_email: 'marie@example.cm', owner_id: 'demo4',
      shop_type: 'magasin', status: 'active', category: 'Alimentation',
      city: 'Yaoundé', address: 'Marché Mvog-Mbi, Stand 42, Yaoundé',
      whatsapp_number: '237680195221', mtn_number: '680195221', orange_number: '691576677',
      latitude: 3.855, longitude: 11.515, logo_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
      banner_url: 'https://images.unsplash.com/photo-1506484381205-f7945653044d?w=1000',
      business_hours: '7j/7: 06h00 - 21h00', rating: 4.7, reviews_count: 31, is_verified: true,
      created_date: new Date(Date.now() - 2 * 86400000).toISOString(), updated_date: now(),
    },
  ]

  const products: Product[] = [
    { id: generateId(), shop_id: shopIds[0], shop_name: 'TechHub Yaoundé', name: 'iPhone 13 Pro reconditionné', description: 'iPhone 13 Pro 256Go, état excellent, batterie 89%, vient avec chargeur original.', price: 450000, image_url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400', images: [], category: 'Électronique', stock: 2, condition: 'tres_bon', status: 'active', created_date: now(), updated_date: now() },
    { id: generateId(), shop_id: shopIds[0], shop_name: 'TechHub Yaoundé', name: 'Samsung Galaxy A54', description: 'Samsung Galaxy A54 128Go neuf, sous scellé, garantie 1 an.', price: 185000, image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400', images: [], category: 'Électronique', stock: 5, condition: 'neuf', status: 'active', created_date: now(), updated_date: now() },
    { id: generateId(), shop_id: shopIds[0], shop_name: 'TechHub Yaoundé', name: 'AirPods Pro 2ème génération', description: 'AirPods Pro 2 neufs, jamais ouverts, prix négociable.', price: 95000, image_url: 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=400', images: [], category: 'Électronique', stock: 3, condition: 'neuf', status: 'active', created_date: now(), updated_date: now() },
    { id: generateId(), shop_id: shopIds[0], shop_name: 'TechHub Yaoundé', name: 'Laptop HP EliteBook 840', description: 'HP EliteBook i5, 16Go RAM, 512Go SSD. Parfait pour étudiants.', price: 320000, image_url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400', images: [], category: 'Électronique', stock: 1, condition: 'bon', status: 'active', created_date: now(), updated_date: now() },
    { id: generateId(), shop_id: shopIds[1], shop_name: 'Bella Mode Douala', name: 'Robe wax africaine', description: 'Belle robe en wax coloré, taille 38-42, motifs africains modernes.', price: 15000, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4b7f09?w=400', images: [], category: 'Mode', stock: 10, condition: 'neuf', status: 'active', created_date: now(), updated_date: now() },
    { id: generateId(), shop_id: shopIds[1], shop_name: 'Bella Mode Douala', name: 'Sac à main tendance', description: 'Sac en cuir synthétique, plusieurs compartiments, couleurs variées.', price: 12000, image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400', images: [], category: 'Mode', stock: 8, condition: 'neuf', status: 'active', created_date: now(), updated_date: now() },
    { id: generateId(), shop_id: shopIds[1], shop_name: 'Bella Mode Douala', name: 'Sneakers Nike Air Force', description: 'Nike Air Force 1 pointures 36-45, original avec boîte.', price: 45000, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', images: [], category: 'Mode', stock: 4, condition: 'neuf', status: 'active', created_date: now(), updated_date: now() },
    { id: generateId(), shop_id: shopIds[2], shop_name: 'Campus Livres Bafoussam', name: 'Mathématiques Terminale', description: 'Manuel scolaire de mathématiques Terminale C, bon état, annotations utiles.', price: 3500, image_url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400', images: [], category: 'Livres', stock: 6, condition: 'bon', status: 'active', created_date: now(), updated_date: now() },
    { id: generateId(), shop_id: shopIds[2], shop_name: 'Campus Livres Bafoussam', name: 'Droit des affaires OHADA', description: 'Traité de droit OHADA, édition 2022, peu utilisé.', price: 8000, image_url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400', images: [], category: 'Livres', stock: 3, condition: 'tres_bon', status: 'active', created_date: now(), updated_date: now() },
    { id: generateId(), shop_id: shopIds[3], shop_name: 'FreshFood Cameroun', name: 'Panier épices locales', description: 'Assortiment d\'épices camerounaises : poivre, gingembre, ail frais, piments.', price: 5000, image_url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', images: [], category: 'Alimentation', stock: 20, condition: 'neuf', status: 'active', created_date: now(), updated_date: now() },
    { id: generateId(), shop_id: shopIds[3], shop_name: 'FreshFood Cameroun', name: 'Jus de gingembre naturel', description: 'Jus de gingembre artisanal 1L, sans conservateurs, livraison Yaoundé.', price: 2500, image_url: 'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=400', images: [], category: 'Alimentation', stock: 15, condition: 'neuf', status: 'active', created_date: now(), updated_date: now() },
    { id: generateId(), shop_id: shopIds[0], shop_name: 'TechHub Yaoundé', name: 'Chargeur USB-C 65W', description: 'Chargeur universel USB-C 65W compatible MacBook, HP, Samsung, etc.', price: 8500, image_url: 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?w=400', images: [], category: 'Électronique', stock: 12, condition: 'neuf', status: 'active', created_date: now(), updated_date: now() },
  ]

  const housings: Housing[] = [
    {
      id: generateId(),
      title: 'Studio Moderne Meublé Cité U Ngaoundéré / Ngoa-Ekellé',
      description: 'Superbe studio totalement meublé à 3 minutes à pied du campus universitaire Ngoa-Ekellé. Lit double, bureau d\'étude, kitchenette équipée, compteur d\'eau et d\'électricité individuel. Idéal pour étudiant.',
      category: 'studio',
      price: 65000,
      price_type: 'month',
      city: 'Yaoundé',
      neighborhood: 'Ngoa-Ekellé',
      address: 'Derrière le Rectorat, Ngoa-Ekellé, Yaoundé',
      latitude: 3.856,
      longitude: 11.503,
      surface_sqm: 28,
      bedrooms: 1,
      bathrooms: 1,
      furnished: true,
      amenities: ['wifi', 'eau_gratuite', 'gardien', 'parking', 'climatisation'],
      image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'
      ],
      owner_name: 'Agence Immobilière Campus',
      owner_email: 'immo.campus@gmail.cm',
      owner_phone: '+237699112233',
      whatsapp_number: '237699112233',
      status: 'available',
      rating: 4.9,
      reviews_count: 14,
      created_date: now(),
      updated_date: now()
    },
    {
      id: generateId(),
      title: 'Appartement 2 Chambres Logbessou Bonamoussadi',
      description: 'Appartement spacieux 2 chambres, 1 grand salon lumineux, cuisine avec placards, 2 douches. Eau de forrage en permanence, groupe électrogène automatique, parking sécurisé 24h/24.',
      category: 'appartement',
      price: 120000,
      price_type: 'month',
      city: 'Douala',
      neighborhood: 'Bonamoussadi',
      address: 'Avenue de la République, Bonamoussadi, Douala',
      latitude: 4.081,
      longitude: 9.742,
      surface_sqm: 75,
      bedrooms: 2,
      bathrooms: 2,
      furnished: false,
      amenities: ['eau_gratuite', 'groupe_electrogene', 'gardien', 'parking'],
      image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600'
      ],
      owner_name: 'Bailleur M. Tagne',
      owner_email: 'tagne@example.cm',
      owner_phone: '+237677889900',
      whatsapp_number: '237677889900',
      status: 'available',
      rating: 4.7,
      reviews_count: 8,
      created_date: now(),
      updated_date: now()
    },
    {
      id: generateId(),
      title: 'Chambre Étudiante Propre Molyko Buea',
      description: 'Chambre individuelle sécurisée à Molyko Buea, à proximité de l\'Université de Buea. Douche interne, sol carrelé, balcon, sécurité assurée par un gardien nuit et jour.',
      category: 'chambre',
      price: 35000,
      price_type: 'month',
      city: 'Buea',
      neighborhood: 'Molyko',
      address: 'Molyko University Road, Buea',
      latitude: 4.156,
      longitude: 9.241,
      surface_sqm: 18,
      bedrooms: 1,
      bathrooms: 1,
      furnished: false,
      amenities: ['eau_gratuite', 'gardien'],
      image_url: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600',
      images: [
        'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600'
      ],
      owner_name: 'Chief Njoh Residence',
      owner_email: 'njoh@example.cm',
      owner_phone: '+237675123456',
      whatsapp_number: '237675123456',
      status: 'available',
      rating: 4.5,
      reviews_count: 6,
      created_date: now(),
      updated_date: now()
    },
    {
      id: generateId(),
      title: 'Villa Haut Standing Bastos Yaoundé avec Piscine',
      description: 'Magnifique villa de 4 chambres, grand séjour, jardin paysager, piscine, dépendance pour le personnel. Climatisation centrale, sécurité armée 24h/24.',
      category: 'villa',
      price: 450000,
      price_type: 'month',
      city: 'Yaoundé',
      neighborhood: 'Bastos',
      address: 'Quartier des Ambassades, Bastos, Yaoundé',
      latitude: 3.889,
      longitude: 11.512,
      surface_sqm: 350,
      bedrooms: 4,
      bathrooms: 4,
      furnished: true,
      amenities: ['wifi', 'eau_gratuite', 'groupe_electrogene', 'gardien', 'parking', 'climatisation', 'piscine'],
      image_url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600',
      images: [
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600'
      ],
      owner_name: 'Prestige Immo Cameroun',
      owner_email: 'contact@prestigeimmo.cm',
      owner_phone: '+237699001122',
      whatsapp_number: '237699001122',
      status: 'available',
      rating: 5.0,
      reviews_count: 9,
      created_date: now(),
      updated_date: now()
    },
    {
      id: generateId(),
      title: 'Studio meublé de passage par jour - Akwa Douala',
      description: 'Studio climatisé pour vos séjours courts et voyages d\'affaires à Douala Akwa. Smart TV, Wifi haut débit 5G, cuisine équipée, service de ménage quotidien.',
      category: 'studio',
      price: 25000,
      price_type: 'day',
      city: 'Douala',
      neighborhood: 'Akwa',
      address: 'Boulevard de la Liberté, Akwa, Douala',
      latitude: 4.051,
      longitude: 9.696,
      surface_sqm: 32,
      bedrooms: 1,
      bathrooms: 1,
      furnished: true,
      amenities: ['wifi', 'climatisation', 'tv', 'eau_gratuite', 'gardien'],
      image_url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600'
      ],
      owner_name: 'Residence Akwa Comfort',
      owner_email: 'comfort.akwa@gmail.cm',
      owner_phone: '+237699445566',
      whatsapp_number: '237699445566',
      status: 'available',
      rating: 4.8,
      reviews_count: 22,
      created_date: now(),
      updated_date: now()
    }
  ]

  setStore('mp_shops', shops)
  setStore('mp_products', products)
  setStore('mp_housing', housings)
  setStore('mp_orders', [])
  setStore('mp_activations', [])
  setStore('mp_visit_bookings', [])
  localStorage.setItem('mp_seeded', '1')
}

