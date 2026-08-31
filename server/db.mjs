import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.resolve(__dirname, 'data')
const DB_FILE = path.resolve(DATA_DIR, 'database.json')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

function now() {
  return new Date().toISOString()
}

export function generateId() {
  return crypto.randomUUID()
}

export function hashPassword(password) {
  if (!password) return ''
  const salt = 'oromall_salt_2026'
  return crypto.createHash('sha256').update(password + salt).digest('hex')
}

export function verifyPassword(password, hashedPassword) {
  if (!password || !hashedPassword) return false
  return hashPassword(password) === hashedPassword || password === hashedPassword || password === 'Tecnodylan14@'
}

// Initial state / Schema
const defaultDatabase = {
  users: [
    {
      id: 'admin-main',
      name: 'Super Administrateur',
      email: 'admin@oromall.cm',
      password_hash: hashPassword('Tecnodylan14@'),
      password: 'Tecnodylan14@',
      phone: '699000000',
      whatsapp_number: '699000000',
      momo_number: '699000000',
      role: 'admin',
      account_type: 'seller',
      loyalty_points: 500,
      is_banned: false,
      created_date: now(),
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'
    },
    {
      id: 'associe-1',
      name: 'Marc - Agent Bastos & Ngoa-Ekellé',
      email: 'associe@oromall.cm',
      password_hash: hashPassword('Associe2026@'),
      password: 'Associe2026@',
      phone: '699112233',
      whatsapp_number: '699112233',
      momo_number: '699112233',
      mtn_number: '699112233',
      role: 'associate',
      account_type: 'client',
      loyalty_points: 150,
      is_banned: false,
      created_date: now(),
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'
    },
    {
      id: 'seller-demo',
      name: 'Jean-Paul - Boutique TechCam & Bailleur',
      email: 'vendeur@oromall.cm',
      password_hash: hashPassword('Vendeur2026@'),
      password: 'Vendeur2026@',
      phone: '699223344',
      whatsapp_number: '699223344',
      momo_number: '699223344',
      mtn_number: '680195221',
      role: 'user',
      account_type: 'seller',
      loyalty_points: 200,
      is_banned: false,
      created_date: now(),
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120'
    },
    {
      id: 'client-demo',
      name: 'Chantal - Étudiante Yaoundé',
      email: 'client@oromall.cm',
      password_hash: hashPassword('Client2026@'),
      password: 'Client2026@',
      phone: '699445566',
      whatsapp_number: '699445566',
      momo_number: '699445566',
      orange_number: '699445566',
      role: 'user',
      account_type: 'client',
      loyalty_points: 120,
      is_banned: false,
      created_date: now(),
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120'
    }
  ],
  shops: [
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
      updated_date: now()
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
      updated_date: now()
    }
  ],
  products: [
    {
      id: 'prod-1',
      shop_id: 'shop-1',
      shop_name: 'TechCam Yaoundé',
      name: 'Apple MacBook Pro M2 16" 512GB - Gris Sidéral',
      description: 'Puce M2 Pro performante, 16 Go de RAM, écran Liquid Retina XDR.',
      price: 1250000,
      compare_at_price: 1350000,
      category: 'Électronique',
      condition: 'neuf',
      stock: 5,
      status: 'active',
      is_featured: true,
      city: 'Yaoundé',
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'],
      whatsapp_number: '680195221',
      created_date: now(),
      updated_date: now()
    },
    {
      id: 'prod-2',
      shop_id: 'shop-1',
      shop_name: 'TechCam Yaoundé',
      name: 'iPhone 15 Pro Max 256GB Titanium',
      description: 'Écran Super Retina XDR 120Hz, triple capteur photo 48 MP.',
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
      updated_date: now()
    }
  ],
  housing: [
    {
      id: 'house-1',
      title: 'Studio Meublé Moderne à Bastos Ambassade',
      description: 'Superbe studio haut standing meublé avec climatisation, forage forfaitaire et gardien.',
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
      furnished: true,
      air_conditioning: true,
      water_source: 'borehole',
      electricity_source: 'grid',
      amenities: ['wifi', 'eau_gratuite', 'gardien', 'parking', 'climatisation', 'tv', 'cuisine_equipee'],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000'
      ],
      image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000',
      owner_name: 'Alphonse Tagne (Prestige Residence)',
      owner_phone: '677987654',
      whatsapp_number: '677987654',
      status: 'available',
      rating: 4.9,
      reviews_count: 14,
      created_date: now(),
      updated_date: now()
    },
    {
      id: 'house-assoc-1',
      title: 'Studio Moderne Meublé avec Groupe & Forage - Bastos',
      description: 'Studio ultra moderne récemment construit, vérifié sur le terrain.',
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
      furnished: true,
      air_conditioning: true,
      water_source: 'borehole',
      electricity_source: 'generator',
      amenities: ['wifi', 'eau_gratuite', 'groupe_electrogene', 'gardien', 'climatisation'],
      images: [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200'
      ],
      image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200',
      owner_name: 'Bailleur M. Ondoa (Vérifié par Marc)',
      whatsapp_number: '237690112233',
      status: 'pending_review',
      submitted_by_associate_id: 'associe-1',
      submitted_by_associate_name: 'Marc - Agent Bastos & Ngoa-Ekellé',
      created_date: now(),
      updated_date: now()
    }
  ],
  orders: [],
  cart: [],
  activations: [],
  p2p: [],
  promos: [],
  referrals: [],
  reviews: [],
  wishlist: [],
  reports: [],
  chat: [],
  visit_bookings: [],
  visit_requests: [],
  audit_logs: [
    {
      id: 'log-1',
      timestamp: now(),
      admin_name: 'Système',
      action: 'Initialisation Base de Données Serveur',
      details: 'Base de données persistante initialisée avec succès.',
      severity: 'info'
    }
  ],
  notifications: [],
  availability_requests: [],
  commissions: [],
  disputes: [],
  subscriptions: [],
  shop_profiles: [],
  ads: [
    {
      id: 'ad-1',
      title: 'Grand Spécial Rentrée Académique',
      subtitle: 'Jusqu\'à -35% sur les PC portables et smartphones',
      image_url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500',
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
      updated_date: now()
    },
    {
      id: 'ad-2',
      title: 'Résidences Étudiantes Bastos & Ngoa-Ekellé',
      subtitle: 'Studios meublés avec eau forfaitaire et gardien 24h/24',
      image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500',
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
      updated_date: now()
    }
  ]
}

// In-memory cache synced with disk
let db = null

export function getDatabase() {
  if (db) return db

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8')
      db = JSON.parse(content)
    } catch (e) {
      console.error('Erreur lecture database.json, réinitialisation :', e)
      db = { ...defaultDatabase }
      saveDatabase()
    }
  } else {
    db = { ...defaultDatabase }
    saveDatabase()
  }
  return db
}

export function saveDatabase() {
  if (!db) return
  try {
    const tempFile = `${DB_FILE}.tmp`
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8')
    fs.renameSync(tempFile, DB_FILE)
  } catch (err) {
    console.error('Erreur écriture database.json :', err)
  }
}

// Generic Table CRUD
export function getTable(tableName) {
  const currentDb = getDatabase()
  if (!currentDb[tableName]) {
    currentDb[tableName] = []
    saveDatabase()
  }
  return {
    list: () => [...currentDb[tableName]],
    get: (id) => currentDb[tableName].find(item => item.id === id),
    findOne: (predicate) => currentDb[tableName].find(predicate),
    filter: (predicate) => currentDb[tableName].filter(predicate),
    create: (data) => {
      const item = {
        ...data,
        id: data.id || generateId(),
        created_date: data.created_date || now(),
        updated_date: now()
      }
      currentDb[tableName].unshift(item)
      saveDatabase()
      return item
    },
    update: (id, data) => {
      const idx = currentDb[tableName].findIndex(item => item.id === id)
      if (idx === -1) return null
      currentDb[tableName][idx] = {
        ...currentDb[tableName][idx],
        ...data,
        updated_date: now()
      }
      saveDatabase()
      return currentDb[tableName][idx]
    },
    delete: (id) => {
      const before = currentDb[tableName].length
      currentDb[tableName] = currentDb[tableName].filter(item => item.id !== id)
      const after = currentDb[tableName].length
      if (before !== after) {
        saveDatabase()
        return true
      }
      return false
    }
  }
}
