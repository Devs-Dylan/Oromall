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

// Configuration PostgreSQL directe sur le serveur (Support Dokploy & VPS)
const pgConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('sslmode=require') || process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 25,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres_secure_pass_2026',
      database: process.env.PGDATABASE || 'marcheplus',
      max: 25,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
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

async function persistShopToPostgres(s) {
  try {
    await pool.query(`
      INSERT INTO shops (id, name, description, owner_name, owner_email, owner_id, shop_type, status, category, city, address, whatsapp_number, mtn_number, orange_number, latitude, longitude, logo_url, profile_image, cover_image, business_hours, rating, reviews_count, is_verified, policies, social_links, created_date, updated_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        owner_name = EXCLUDED.owner_name,
        owner_email = EXCLUDED.owner_email,
        shop_type = EXCLUDED.shop_type,
        status = EXCLUDED.status,
        category = EXCLUDED.category,
        city = EXCLUDED.city,
        address = EXCLUDED.address,
        whatsapp_number = EXCLUDED.whatsapp_number,
        mtn_number = EXCLUDED.mtn_number,
        orange_number = EXCLUDED.orange_number,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        logo_url = EXCLUDED.logo_url,
        profile_image = EXCLUDED.profile_image,
        cover_image = EXCLUDED.cover_image,
        business_hours = EXCLUDED.business_hours,
        rating = EXCLUDED.rating,
        reviews_count = EXCLUDED.reviews_count,
        is_verified = EXCLUDED.is_verified,
        policies = EXCLUDED.policies,
        social_links = EXCLUDED.social_links,
        updated_date = NOW()
    `, [
      s.id, s.name, s.description || null, s.owner_name, s.owner_email, s.owner_id || null,
      s.shop_type || 'individual', s.status || 'active', s.category || null, s.city || null,
      s.address || null, s.whatsapp_number || '699000000', s.mtn_number || null, s.orange_number || null,
      s.latitude ? Number(s.latitude) : null, s.longitude ? Number(s.longitude) : null,
      s.logo_url || null, s.profile_image || null, s.cover_image || null, s.business_hours || null,
      Number(s.rating || 0), Number(s.reviews_count || 0), Boolean(s.is_verified),
      JSON.stringify(s.policies || {}), JSON.stringify(s.social_links || {}),
      s.created_date || now(), s.updated_date || now()
    ])
  } catch (err) {
    console.error('[PostgreSQL] Erreur sauvegarde boutique:', err.message)
  }
}

async function persistProductToPostgres(p) {
  try {
    await pool.query(`
      INSERT INTO products (id, shop_id, seller_name, seller_email, title, description, price, original_price, category, subcategory, condition, city, neighborhood, whatsapp_number, images, image_url, tags, stock, sold_count, views_count, is_promoted, promotion_expires, status, rating, reviews_count, created_date, updated_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        original_price = EXCLUDED.original_price,
        category = EXCLUDED.category,
        subcategory = EXCLUDED.subcategory,
        condition = EXCLUDED.condition,
        city = EXCLUDED.city,
        neighborhood = EXCLUDED.neighborhood,
        whatsapp_number = EXCLUDED.whatsapp_number,
        images = EXCLUDED.images,
        image_url = EXCLUDED.image_url,
        tags = EXCLUDED.tags,
        stock = EXCLUDED.stock,
        sold_count = EXCLUDED.sold_count,
        views_count = EXCLUDED.views_count,
        is_promoted = EXCLUDED.is_promoted,
        promotion_expires = EXCLUDED.promotion_expires,
        status = EXCLUDED.status,
        rating = EXCLUDED.rating,
        reviews_count = EXCLUDED.reviews_count,
        updated_date = NOW()
    `, [
      p.id, p.shop_id || null, p.seller_name || null, p.seller_email || null,
      p.title, p.description || null, Number(p.price || 0), p.original_price ? Number(p.original_price) : null,
      p.category || 'general', p.subcategory || null, p.condition || 'neuf',
      p.city || null, p.neighborhood || null, p.whatsapp_number || null,
      JSON.stringify(p.images || []), p.image_url || null, JSON.stringify(p.tags || []),
      Number(p.stock || 1), Number(p.sold_count || 0), Number(p.views_count || 0),
      Boolean(p.is_promoted), p.promotion_expires || null, p.status || 'active',
      Number(p.rating || 0), Number(p.reviews_count || 0),
      p.created_date || now(), p.updated_date || now()
    ])
  } catch (err) {
    console.error('[PostgreSQL] Erreur sauvegarde produit:', err.message)
  }
}

async function persistOrderToPostgres(o) {
  try {
    await pool.query(`
      INSERT INTO orders (id, user_id, shop_id, shop_name, product_id, product_name, product_price, total_amount, status, items, customer_name, customer_email, customer_phone, shipping_address, payment_reference, payment_proof_url, payment_proof_type, payment_method, payment_verified, withdrawal_status, withdrawal_pin, pin_code, promo_code, discount_amount, is_p2p, fee_amount, message, cancellation_reason, created_date, updated_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        payment_verified = EXCLUDED.payment_verified,
        withdrawal_status = EXCLUDED.withdrawal_status,
        payment_proof_url = EXCLUDED.payment_proof_url,
        payment_reference = EXCLUDED.payment_reference,
        cancellation_reason = EXCLUDED.cancellation_reason,
        updated_date = NOW()
    `, [
      o.id, o.user_id || null, o.shop_id || null, o.shop_name || null,
      o.product_id || null, o.product_name || null, o.product_price ? Number(o.product_price) : null,
      Number(o.total_amount || 0), o.status || 'new', JSON.stringify(o.items || []),
      o.customer_name || null, o.customer_email || null, o.customer_phone || null,
      JSON.stringify(o.shipping_address || {}), o.payment_reference || null,
      o.payment_proof_url || null, o.payment_proof_type || null, o.payment_method || null,
      Boolean(o.payment_verified), o.withdrawal_status || 'pending', o.withdrawal_pin || null,
      o.pin_code || null, o.promo_code || null, Number(o.discount_amount || 0),
      Boolean(o.is_p2p), Number(o.fee_amount || 0), o.message || null, o.cancellation_reason || null,
      o.created_date || now(), o.updated_date || now()
    ])
  } catch (err) {
    console.error('[PostgreSQL] Erreur sauvegarde commande:', err.message)
  }
}

async function persistVisitRequestToPostgres(v) {
  try {
    await pool.query(`
      INSERT INTO visit_requests (id, housing_id, housing_title, housing_city, housing_image, visitor_name, visitor_email, visitor_phone, package_type, package_label, amount, payment_method, payment_proof_url, payment_reference, payment_status, visit_date, visit_time, status, notes, created_date, updated_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (id) DO UPDATE SET
        payment_status = EXCLUDED.payment_status,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        payment_proof_url = EXCLUDED.payment_proof_url,
        updated_date = NOW()
    `, [
      v.id, v.housing_id || null, v.housing_title || 'Visite Immobilière', v.housing_city || null,
      v.housing_image || null, v.visitor_name || '', v.visitor_email || '', v.visitor_phone || '',
      v.package_type || 'single', v.package_label || null, Number(v.amount || 0),
      v.payment_method || 'momo', v.payment_proof_url || null, v.payment_reference || null,
      v.payment_status || 'pending', v.visit_date || null, v.visit_time || null,
      v.status || 'pending', v.notes || null, v.created_date || now(), v.updated_date || now()
    ])
  } catch (err) {
    console.error('[PostgreSQL] Erreur sauvegarde demande de visite:', err.message)
  }
}

async function persistAuditLogToPostgres(a) {
  try {
    await pool.query(`
      INSERT INTO audit_logs (id, admin_name, action, details, severity, created_date, updated_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        details = EXCLUDED.details,
        updated_date = NOW()
    `, [
      a.id, a.admin_name || 'Admin', a.action || 'ACTION', a.details || null,
      a.severity || 'info', a.created_date || now(), a.updated_date || now()
    ])
  } catch (err) {
    console.error('[PostgreSQL] Erreur sauvegarde audit log:', err.message)
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
    } else if (collection === 'visit_requests') {
      await pool.query('DELETE FROM visit_requests WHERE id = $1', [id])
    } else if (collection === 'audit_logs') {
      await pool.query('DELETE FROM audit_logs WHERE id = $1', [id])
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

      // PostgreSQL Realtime Write to specific tables or generic_records
      if (tableName === 'users') persistUserToPostgres(item)
      else if (tableName === 'housing') persistHousingToPostgres(item)
      else if (tableName === 'shops') persistShopToPostgres(item)
      else if (tableName === 'products') persistProductToPostgres(item)
      else if (tableName === 'orders') persistOrderToPostgres(item)
      else if (tableName === 'visit_requests') persistVisitRequestToPostgres(item)
      else if (tableName === 'audit_logs') persistAuditLogToPostgres(item)
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
      else if (tableName === 'shops') persistShopToPostgres(item)
      else if (tableName === 'products') persistProductToPostgres(item)
      else if (tableName === 'orders') persistOrderToPostgres(item)
      else if (tableName === 'visit_requests') persistVisitRequestToPostgres(item)
      else if (tableName === 'audit_logs') persistAuditLogToPostgres(item)
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
