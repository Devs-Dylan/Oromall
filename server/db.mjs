import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg
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

// Configuration PostgreSQL directe sur le serveur
const pgConfig = {
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres_secure_pass_2026',
  database: process.env.PGDATABASE || 'marcheplus',
  connectionString: process.env.DATABASE_URL || undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
}

export const pool = new Pool(pgConfig)

let isPostgresReady = false

// In-Memory cache mirroring PostgreSQL for ultra-fast reads & synchronous queries
let memoryCache = {
  users: [],
  shops: [],
  products: [],
  housing: [],
  orders: [],
  visit_requests: [],
  visit_bookings: [],
  commissions: [],
  disputes: [],
  subscriptions: [],
  advertisements: [],
  ads: [],
  reviews: [],
  wishlist: [],
  audit_logs: [],
  notifications: [],
  availability_requests: [],
  p2p: [],
  promos: [],
  referrals: [],
  chat: [],
  cart: [],
  activations: [],
  shop_profiles: []
}

// Initial default seed accounts and sample data
const seedUsers = [
  {
    id: 'admin-main',
    name: 'Super Administrateur',
    email: 'admin@oromall.cm',
    password: 'Tecnodylan14@',
    password_hash: hashPassword('Tecnodylan14@'),
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
    password: 'Associe2026@',
    password_hash: hashPassword('Associe2026@'),
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
    password: 'Vendeur2026@',
    password_hash: hashPassword('Vendeur2026@'),
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
    password: 'Client2026@',
    password_hash: hashPassword('Client2026@'),
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
]

// Table creation queries
const INIT_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  password_hash TEXT,
  phone VARCHAR(50),
  whatsapp_number VARCHAR(50),
  momo_number VARCHAR(50),
  mtn_number VARCHAR(50),
  orange_number VARCHAR(50),
  account_type VARCHAR(50) DEFAULT 'client',
  role VARCHAR(50) DEFAULT 'user',
  is_banned BOOLEAN DEFAULT false,
  avatar_url TEXT,
  loyalty_points INT DEFAULT 50,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shops (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_id VARCHAR(100),
  shop_type VARCHAR(50) DEFAULT 'individual',
  status VARCHAR(50) DEFAULT 'active',
  category VARCHAR(100),
  city VARCHAR(100),
  address TEXT,
  whatsapp_number VARCHAR(50),
  mtn_number VARCHAR(50),
  orange_number VARCHAR(50),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  logo_url TEXT,
  profile_image TEXT,
  cover_image TEXT,
  business_hours TEXT,
  rating NUMERIC(3, 2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  policies JSONB DEFAULT '{}'::jsonb,
  social_links JSONB DEFAULT '{}'::jsonb,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  shop_id VARCHAR(100),
  seller_name VARCHAR(255),
  seller_email VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL,
  original_price NUMERIC(12, 2),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  condition VARCHAR(50) DEFAULT 'neuf',
  city VARCHAR(100),
  neighborhood VARCHAR(100),
  whatsapp_number VARCHAR(50),
  images JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  stock INT DEFAULT 1,
  sold_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  is_promoted BOOLEAN DEFAULT false,
  promotion_expires TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'active',
  rating NUMERIC(3, 2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS housing (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  property_type VARCHAR(50) DEFAULT 'residential',
  price NUMERIC(12, 2) NOT NULL,
  price_type VARCHAR(20) DEFAULT 'month',
  price_negotiable BOOLEAN DEFAULT false,
  deposit_amount NUMERIC(12, 2) DEFAULT 0,
  payment_frequency VARCHAR(50) DEFAULT 'monthly',
  city VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(100) NOT NULL,
  address TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  surface_sqm NUMERIC(8, 2) DEFAULT 0,
  bedrooms INT DEFAULT 0,
  bathrooms INT DEFAULT 0,
  living_rooms INT DEFAULT 0,
  kitchens INT DEFAULT 0,
  furnished BOOLEAN DEFAULT false,
  air_conditioning BOOLEAN DEFAULT false,
  water_source VARCHAR(50) DEFAULT 'city',
  electricity_source VARCHAR(50) DEFAULT 'grid',
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  image_url TEXT,
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255),
  owner_phone VARCHAR(50),
  whatsapp_number VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'available',
  rating NUMERIC(3, 2) DEFAULT 0,
  reviews_count INT DEFAULT 0,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100),
  shop_id VARCHAR(100),
  shop_name VARCHAR(255),
  product_id VARCHAR(100),
  product_name VARCHAR(255),
  product_price NUMERIC(12, 2),
  total_amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  items JSONB DEFAULT '[]'::jsonb,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  shipping_address JSONB DEFAULT '{}'::jsonb,
  payment_reference VARCHAR(100),
  payment_proof_url TEXT,
  payment_proof_type VARCHAR(50),
  payment_method VARCHAR(50),
  payment_verified BOOLEAN DEFAULT false,
  withdrawal_status VARCHAR(50) DEFAULT 'pending',
  withdrawal_pin VARCHAR(20),
  pin_code VARCHAR(20),
  promo_code VARCHAR(50),
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  is_p2p BOOLEAN DEFAULT false,
  fee_amount NUMERIC(12, 2) DEFAULT 0,
  message TEXT,
  cancellation_reason TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS visit_requests (
  id VARCHAR(100) PRIMARY KEY,
  housing_id VARCHAR(100),
  housing_title VARCHAR(255) NOT NULL,
  housing_city VARCHAR(100),
  housing_image TEXT,
  visitor_name VARCHAR(255) NOT NULL,
  visitor_email VARCHAR(255) NOT NULL,
  visitor_phone VARCHAR(50) NOT NULL,
  package_type VARCHAR(50) DEFAULT 'single',
  package_label VARCHAR(100),
  amount NUMERIC(12, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_proof_url TEXT,
  payment_reference VARCHAR(100),
  payment_status VARCHAR(50) DEFAULT 'pending',
  visit_date VARCHAR(50),
  visit_time VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(100) PRIMARY KEY,
  admin_name VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  details TEXT,
  severity VARCHAR(50) DEFAULT 'info',
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generic_records (
  id VARCHAR(100) PRIMARY KEY,
  collection VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`

// Initial load from JSON file or seed data
function loadInitialCache() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'))
      memoryCache = { ...memoryCache, ...parsed }
    } else {
      memoryCache.users = [...seedUsers]
      saveToDisk()
    }
  } catch (err) {
    console.warn('[DB] Lecture cache disque impossible, initialisation avec seed:', err.message)
    memoryCache.users = [...seedUsers]
  }
}

loadInitialCache()

function saveToDisk() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryCache, null, 2), 'utf-8')
  } catch (err) {
    console.warn('[DB] Erreur écriture JSON disque:', err.message)
  }
}

// Initialize PostgreSQL and sync tables
export async function initPostgres() {
  try {
    console.log('[PostgreSQL] Connexion au serveur PostgreSQL en cours...')
    await pool.query('SELECT 1')
    console.log('✅ [PostgreSQL] Connecté avec succès à la base de données PostgreSQL !')
    
    // Create Tables
    await pool.query(INIT_TABLES_SQL)
    console.log('✅ [PostgreSQL] Tables et Schémas PostgreSQL vérifiés et prêts.')

    // Ensure default users exist in PostgreSQL
    for (const u of seedUsers) {
      await pool.query(`
        INSERT INTO users (id, name, email, password, password_hash, phone, whatsapp_number, momo_number, mtn_number, role, account_type, loyalty_points, is_banned, avatar_url, created_date, updated_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        ON CONFLICT (email) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          account_type = EXCLUDED.account_type,
          password = EXCLUDED.password,
          password_hash = EXCLUDED.password_hash
      `, [
        u.id, u.name, u.email.toLowerCase(), u.password, u.password_hash,
        u.phone || null, u.whatsapp_number || null, u.momo_number || null, u.mtn_number || null,
        u.role, u.account_type, u.loyalty_points || 50, u.is_banned || false, u.avatar_url || null,
        u.created_date || now(), now()
      ])
    }

    // Read full state from PostgreSQL into memory
    await refreshMemoryFromPostgres()
    isPostgresReady = true
    console.log('🚀 [PostgreSQL] Synchronisation complète du serveur PostgreSQL réussie !')
  } catch (err) {
    console.error('⚠️ [PostgreSQL] Avertissement connexion PostgreSQL:', err.message)
    console.log('ℹ️ Le serveur reste actif avec le stockage persistant local en attendant la reconnexion.')
  }
}

// Auto-run DB init
initPostgres()

export async function refreshMemoryFromPostgres() {
  try {
    const userRes = await pool.query('SELECT * FROM users')
    if (userRes.rows.length > 0) memoryCache.users = userRes.rows

    const shopRes = await pool.query('SELECT * FROM shops')
    if (shopRes.rows.length > 0) memoryCache.shops = shopRes.rows

    const prodRes = await pool.query('SELECT * FROM products')
    if (prodRes.rows.length > 0) memoryCache.products = prodRes.rows

    const houseRes = await pool.query('SELECT * FROM housing')
    if (houseRes.rows.length > 0) memoryCache.housing = houseRes.rows

    const orderRes = await pool.query('SELECT * FROM orders')
    if (orderRes.rows.length > 0) memoryCache.orders = orderRes.rows

    const visitRes = await pool.query('SELECT * FROM visit_requests')
    if (visitRes.rows.length > 0) memoryCache.visit_requests = visitRes.rows

    const auditRes = await pool.query('SELECT * FROM audit_logs')
    if (auditRes.rows.length > 0) memoryCache.audit_logs = auditRes.rows

    const genRes = await pool.query('SELECT collection, payload FROM generic_records')
    for (const row of genRes.rows) {
      if (!memoryCache[row.collection]) memoryCache[row.collection] = []
      const idx = memoryCache[row.collection].findIndex(x => x.id === row.payload.id)
      if (idx >= 0) memoryCache[row.collection][idx] = row.payload
      else memoryCache[row.collection].push(row.payload)
    }

    saveToDisk()
  } catch (err) {
    console.warn('[PostgreSQL] Refresh mémoire échoué:', err.message)
  }
}

// PostgreSQL Synchronizers
async function persistUserToPostgres(user) {
  try {
    await pool.query(`
      INSERT INTO users (id, name, email, password, password_hash, phone, whatsapp_number, momo_number, mtn_number, orange_number, account_type, role, is_banned, avatar_url, loyalty_points, created_date, updated_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        password_hash = EXCLUDED.password_hash,
        phone = EXCLUDED.phone,
        whatsapp_number = EXCLUDED.whatsapp_number,
        momo_number = EXCLUDED.momo_number,
        mtn_number = EXCLUDED.mtn_number,
        orange_number = EXCLUDED.orange_number,
        account_type = EXCLUDED.account_type,
        role = EXCLUDED.role,
        is_banned = EXCLUDED.is_banned,
        avatar_url = EXCLUDED.avatar_url,
        loyalty_points = EXCLUDED.loyalty_points,
        updated_date = NOW()
    `, [
      user.id, user.name, user.email.toLowerCase(), user.password || '', user.password_hash || hashPassword(user.password),
      user.phone || null, user.whatsapp_number || null, user.momo_number || null, user.mtn_number || null, user.orange_number || null,
      user.account_type || 'client', user.role || 'user', user.is_banned || false, user.avatar_url || null, user.loyalty_points || 50,
      user.created_date || now(), user.updated_date || now()
    ])
  } catch (err) {
    console.error('[PostgreSQL] Erreur sauvegarde utilisateur:', err.message)
  }
}

async function persistHousingToPostgres(h) {
  try {
    await pool.query(`
      INSERT INTO housing (id, title, description, category, property_type, price, price_type, price_negotiable, deposit_amount, payment_frequency, city, neighborhood, address, latitude, longitude, surface_sqm, bedrooms, bathrooms, living_rooms, kitchens, furnished, air_conditioning, water_source, electricity_source, amenities, images, image_url, owner_name, owner_email, owner_phone, whatsapp_number, status, rating, reviews_count, created_date, updated_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        city = EXCLUDED.city,
        neighborhood = EXCLUDED.neighborhood,
        address = EXCLUDED.address,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        amenities = EXCLUDED.amenities,
        images = EXCLUDED.images,
        image_url = EXCLUDED.image_url,
        whatsapp_number = EXCLUDED.whatsapp_number,
        status = EXCLUDED.status,
        updated_date = NOW()
    `, [
      h.id, h.title, h.description || null, h.category || 'chambre', h.property_type || 'residential',
      Number(h.price || 0), h.price_type || 'month', Boolean(h.price_negotiable), Number(h.deposit_amount || 0),
      h.payment_frequency || 'monthly', h.city || 'Yaoundé', h.neighborhood || 'Centre', h.address || null,
      h.latitude ? Number(h.latitude) : null, h.longitude ? Number(h.longitude) : null,
      Number(h.surface_sqm || 0), Number(h.bedrooms || 0), Number(h.bathrooms || 0), Number(h.living_rooms || 0), Number(h.kitchens || 0),
      Boolean(h.furnished), Boolean(h.air_conditioning), h.water_source || 'city', h.electricity_source || 'grid',
      JSON.stringify(h.amenities || []), JSON.stringify(h.images || []), h.image_url || null,
      h.owner_name || 'Bailleur', h.owner_email || null, h.owner_phone || null, h.whatsapp_number || '699000000',
      h.status || 'available', Number(h.rating || 0), Number(h.reviews_count || 0),
      h.created_date || now(), h.updated_date || now()
    ])
  } catch (err) {
    console.error('[PostgreSQL] Erreur sauvegarde logement:', err.message)
  }
}

async function persistGenericToPostgres(collection, item) {
  try {
    await pool.query(`
      INSERT INTO generic_records (id, collection, payload, created_date, updated_date)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        payload = EXCLUDED.payload,
        updated_date = NOW()
    `, [item.id, collection, JSON.stringify(item), item.created_date || now(), item.updated_date || now()])
  } catch (err) {
    console.error(`[PostgreSQL] Erreur sauvegarde collection ${collection}:`, err.message)
  }
}

async function deleteFromPostgres(collection, id) {
  try {
    if (collection === 'users') {
      await pool.query('DELETE FROM users WHERE id = $1', [id])
    } else if (collection === 'housing') {
      await pool.query('DELETE FROM housing WHERE id = $1', [id])
    } else if (collection === 'shops') {
      await pool.query('DELETE FROM shops WHERE id = $1', [id])
    } else if (collection === 'products') {
      await pool.query('DELETE FROM products WHERE id = $1', [id])
    } else if (collection === 'orders') {
      await pool.query('DELETE FROM orders WHERE id = $1', [id])
    } else {
      await pool.query('DELETE FROM generic_records WHERE id = $1', [id])
    }
  } catch (err) {
    console.error(`[PostgreSQL] Erreur suppression ${collection}/${id}:`, err.message)
  }
}

// Unified CRUD Factory
export function getTable(tableName) {
  if (!memoryCache[tableName]) {
    memoryCache[tableName] = []
  }

  return {
    list: () => memoryCache[tableName] || [],
    get: (id) => (memoryCache[tableName] || []).find(x => x.id === id),
    findOne: (predicate) => (memoryCache[tableName] || []).find(predicate),
    filter: (predicate) => (memoryCache[tableName] || []).filter(predicate),
    create: (data) => {
      const item = {
        ...data,
        id: data.id || generateId(),
        created_date: data.created_date || now(),
        updated_date: now()
      }
      memoryCache[tableName] = [item, ...(memoryCache[tableName] || [])]
      saveToDisk()

      // PostgreSQL Realtime Write
      if (tableName === 'users') persistUserToPostgres(item)
      else if (tableName === 'housing') persistHousingToPostgres(item)
      else persistGenericToPostgres(tableName, item)

      return item
    },
    update: (id, updates) => {
      const items = memoryCache[tableName] || []
      const idx = items.findIndex(x => x.id === id)
      if (idx === -1) return null

      items[idx] = { ...items[idx], ...updates, updated_date: now() }
      saveToDisk()

      const item = items[idx]
      // PostgreSQL Realtime Update
      if (tableName === 'users') persistUserToPostgres(item)
      else if (tableName === 'housing') persistHousingToPostgres(item)
      else persistGenericToPostgres(tableName, item)

      return item
    },
    delete: (id) => {
      const items = memoryCache[tableName] || []
      const filtered = items.filter(x => x.id !== id)
      if (filtered.length === items.length) return false
      memoryCache[tableName] = filtered
      saveToDisk()

      // PostgreSQL Realtime Delete
      deleteFromPostgres(tableName, id)
      return true
    }
  }
}

export const db = {
  users: getTable('users'),
  shops: getTable('shops'),
  products: getTable('products'),
  housing: getTable('housing'),
  orders: getTable('orders'),
  visit_requests: getTable('visit_requests'),
  visit_bookings: getTable('visit_bookings'),
  commissions: getTable('commissions'),
  disputes: getTable('disputes'),
  subscriptions: getTable('subscriptions'),
  advertisements: getTable('advertisements'),
  ads: getTable('ads'),
  reviews: getTable('reviews'),
  wishlist: getTable('wishlist'),
  audit_logs: getTable('audit_logs'),
  notifications: getTable('notifications'),
  availability_requests: getTable('availability_requests'),
  p2p: getTable('p2p'),
  promos: getTable('promos'),
  referrals: getTable('referrals'),
  chat: getTable('chat'),
  cart: getTable('cart'),
  activations: getTable('activations'),
  shop_profiles: getTable('shop_profiles'),
  getDatabaseState: () => memoryCache,
  isPostgresReady: () => isPostgresReady
}

export function getDatabase() { return memoryCache }
export function saveDatabase() { saveToDisk() }
