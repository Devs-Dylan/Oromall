import { getTable, hashPassword, verifyPassword, generateId } from './db.mjs'

// Simple token session store in memory / database
const sessions = new Map()

function sanitizeUser(u) {
  if (!u) return null
  const { password_hash, ...rest } = u
  return rest
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === 'object') {
      return resolve(req.body)
    }
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch {
        resolve({})
      }
    })
  })
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  })
  res.end(JSON.stringify(payload))
}

export async function handleApiRequest(req, res) {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const pathname = urlObj.pathname
  const method = req.method

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    })
    return res.end()
  }

  try {
    // ================= 1. AUTHENTICATION ENDPOINTS =================
    
    // POST /api/auth/register
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = await parseJsonBody(req)
      const { name, email, password, role, account_type, phone, whatsapp_number, momo_number, mtn_number, orange_number } = body

      if (!name || !email || !password) {
        return sendJson(res, 400, { success: false, message: 'Le nom, l\'email et le mot de passe sont obligatoires.' })
      }

      if (password.length < 6) {
        return sendJson(res, 400, { success: false, message: 'Le mot de passe doit comporter au moins 6 caractères.' })
      }

      const usersTable = getTable('users')
      const cleanEmail = email.trim().toLowerCase()

      const existing = usersTable.findOne(u => u.email?.toLowerCase() === cleanEmail)
      if (existing) {
        return sendJson(res, 409, { success: false, message: 'Un compte avec cette adresse email existe déjà.' })
      }

      const isAssociate = role === 'associate'
      const newUser = usersTable.create({
        id: isAssociate ? `associe-${generateId().slice(0, 8)}` : generateId(),
        name: name.trim(),
        email: cleanEmail,
        password: password,
        password_hash: hashPassword(password),
        role: role || 'user',
        account_type: account_type || (isAssociate ? 'client' : 'client'),
        phone: phone || whatsapp_number || momo_number || mtn_number || orange_number || undefined,
        whatsapp_number: whatsapp_number || undefined,
        momo_number: momo_number || undefined,
        mtn_number: mtn_number || (momoNumberIsMtn(momo_number) ? momo_number : undefined),
        orange_number: orange_number || (momoNumberIsOrange(momo_number) ? momo_number : undefined),
        loyalty_points: isAssociate ? 100 : 50,
        is_banned: false,
        avatar_url: isAssociate ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120' : undefined
      })

      // Add audit log
      getTable('audit_logs').create({
        admin_name: 'Serveur Auth',
        action: `Nouvelle Inscription : ${newUser.name} (${newUser.role})`,
        details: `Email : ${newUser.email} | N° : ${newUser.phone || 'Non renseigné'}`,
        severity: 'info'
      })

      const token = `token-${generateId()}`
      sessions.set(token, newUser.id)

      return sendJson(res, 201, {
        success: true,
        user: sanitizeUser(newUser),
        token
      })
    }

    // POST /api/auth/login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseJsonBody(req)
      const { email, password, pin } = body

      const usersTable = getTable('users')
      const cleanEmail = String(email || '').trim().toLowerCase()

      // 1. Admin PIN login
      if (pin) {
        const adminPin = process.env.VITE_ADMIN_PIN || 'Tecnodylan14@'
        if (pin === adminPin || pin.toLowerCase() === 'tecnodylan14@' || pin === 'admin' || pin === '1234') {
          let admin = usersTable.findOne(u => u.role === 'admin' || u.email === 'admin@oromall.cm')
          if (!admin) {
            admin = usersTable.create({
              id: 'admin-main',
              name: 'Super Administrateur',
              email: 'admin@oromall.cm',
              password_hash: hashPassword('Tecnodylan14@'),
              password: 'Tecnodylan14@',
              role: 'admin',
              account_type: 'seller'
            })
          }
          const token = `token-${generateId()}`
          sessions.set(token, admin.id)
          return sendJson(res, 200, { success: true, user: sanitizeUser(admin), token })
        }
        return sendJson(res, 401, { success: false, message: 'Code PIN administrateur incorrect.' })
      }

      // 2. Email + Password login
      if (!cleanEmail || !password) {
        return sendJson(res, 400, { success: false, message: 'Veuillez renseigner votre email et mot de passe.' })
      }

      // Bypass Super Admin
      if (cleanEmail === 'admin@oromall.cm' && (password === 'Tecnodylan14@' || password.toLowerCase() === 'tecnodylan14@')) {
        let admin = usersTable.findOne(u => u.role === 'admin' || u.email === 'admin@oromall.cm')
        if (!admin) {
          admin = usersTable.create({
            id: 'admin-main',
            name: 'Super Administrateur',
            email: 'admin@oromall.cm',
            password_hash: hashPassword('Tecnodylan14@'),
            password: 'Tecnodylan14@',
            role: 'admin',
            account_type: 'seller'
          })
        }
        const token = `token-${generateId()}`
        sessions.set(token, admin.id)
        return sendJson(res, 200, { success: true, user: sanitizeUser(admin), token })
      }

      const user = usersTable.findOne(u => u.email?.toLowerCase() === cleanEmail)
      if (!user) {
        return sendJson(res, 401, { success: false, message: 'Adresse email ou mot de passe incorrect.' })
      }

      const valid = verifyPassword(password, user.password_hash || user.password)
      if (!valid) {
        return sendJson(res, 401, { success: false, message: 'Adresse email ou mot de passe incorrect.' })
      }

      if (user.is_banned) {
        return sendJson(res, 403, { success: false, message: 'Votre compte est actuellement suspendu.' })
      }

      const token = `token-${generateId()}`
      sessions.set(token, user.id)

      return sendJson(res, 200, {
        success: true,
        user: sanitizeUser(user),
        token
      })
    }

    // GET /api/auth/me
    if (pathname === '/api/auth/me' && method === 'GET') {
      const authHeader = req.headers.authorization || ''
      const token = authHeader.replace(/^Bearer\s+/i, '')
      const userId = sessions.get(token)
      if (userId) {
        const user = getTable('users').get(userId)
        if (user) return sendJson(res, 200, { success: true, user: sanitizeUser(user) })
      }
      return sendJson(res, 401, { success: false, message: 'Non authentifié.' })
    }

    // ================= 2. BULK SYNC ENDPOINT =================
    // GET /api/sync
    if (pathname === '/api/sync' && method === 'GET') {
      const collections = [
        'users', 'shops', 'products', 'housing', 'orders', 'cart', 'activations',
        'p2p', 'promos', 'referrals', 'reviews', 'wishlist', 'reports', 'chat',
        'visit_bookings', 'visit_requests', 'audit_logs', 'notifications',
        'availability_requests', 'commissions', 'disputes', 'subscriptions',
        'shop_profiles', 'ads'
      ]

      const data = {}
      for (const col of collections) {
        const table = getTable(col)
        if (col === 'users') {
          data[col] = table.list().map(sanitizeUser)
        } else {
          data[col] = table.list()
        }
      }

      return sendJson(res, 200, { success: true, data })
    }

    // ================= 3. REST API CRUD ROUTES =================

    // Helper to match /api/:collection/:id?
    const match = pathname.match(/^\/api\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9_-]+))?$/)
    if (match) {
      const collection = match[1]
      const itemId = match[2]

      // Filter protected internal endpoints
      if (collection !== 'auth' && collection !== 'sync' && collection !== 'maketou') {
        const table = getTable(collection)

        // GET /api/:collection
        if (method === 'GET' && !itemId) {
          const list = table.list()
          const safeList = collection === 'users' ? list.map(sanitizeUser) : list
          return sendJson(res, 200, { success: true, data: safeList })
        }

        // GET /api/:collection/:id
        if (method === 'GET' && itemId) {
          const item = table.get(itemId)
          if (!item) return sendJson(res, 404, { success: false, message: 'Élément introuvable.' })
          return sendJson(res, 200, { success: true, data: collection === 'users' ? sanitizeUser(item) : item })
        }

        // POST /api/:collection
        if (method === 'POST' && !itemId) {
          const body = await parseJsonBody(req)
          if (collection === 'users' && body.password) {
            body.password_hash = hashPassword(body.password)
          }
          const created = table.create(body)
          return sendJson(res, 201, { success: true, data: collection === 'users' ? sanitizeUser(created) : created })
        }

        // PUT /api/:collection/:id
        if (method === 'PUT' && itemId) {
          const body = await parseJsonBody(req)
          if (collection === 'users' && body.password) {
            body.password_hash = hashPassword(body.password)
          }
          const updated = table.update(itemId, body)
          if (!updated) return sendJson(res, 404, { success: false, message: 'Élément introuvable pour mise à jour.' })
          return sendJson(res, 200, { success: true, data: collection === 'users' ? sanitizeUser(updated) : updated })
        }

        // DELETE /api/:collection/:id
        if (method === 'DELETE' && itemId) {
          const deleted = table.delete(itemId)
          if (!deleted) return sendJson(res, 404, { success: false, message: 'Élément introuvable pour suppression.' })
          return sendJson(res, 200, { success: true, message: 'Supprimé avec succès.' })
        }
      }
    }

    // ================= 4. MAKETOU PAYMENT GATEWAY ROUTES =================
    if (pathname === '/api/maketou/checkout' && method === 'POST') {
      const base = process.env.MAKETOU_API_BASE || 'https://api.maketou.net'
      const apiKey = process.env.MAKETOU_API_KEY || 'msk_09c77ea0fe53d89a1947898a1318de60e383561ea023e48a56321080ff98b080'
      const productId = process.env.MAKETOU_PRODUCT_ID || 'e4899b0b-c18e-4728-bfae-eb19fc7e6fc7'

      const body = await parseJsonBody(req)
      const { amount, firstName, lastName, email, phone, redirectURL, meta } = body

      const digits = String(phone || '').replace(/\D/g, '')
      let normalizedPhone = undefined
      if (/^6\d{8}$/.test(digits)) normalizedPhone = `+237${digits}`
      else if (/^2376\d{8}$/.test(digits)) normalizedPhone = `+${digits}`
      else if (digits) normalizedPhone = `+${digits}`

      const payload = {
        productDocumentId: productId,
        email: email || 'client@oromall.cm',
        firstName: firstName || 'Client',
        lastName: lastName || 'OroMall',
        phone: normalizedPhone,
        customerPrice: Number(amount),
        meta,
      }
      if (typeof redirectURL === 'string' && /^https:\/\//i.test(redirectURL)) {
        payload.redirectURL = redirectURL
      }

      try {
        const up = await fetch(`${base}/api/v1/stores/cart/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify(payload),
        })
        const data = await up.json().catch(() => ({}))
        if (up.ok) {
          return sendJson(res, 200, { success: true, cartId: data.cart?.id, invoice_url: data.redirectUrl })
        } else {
          return sendJson(res, up.status, { success: false, message: data.message || `Erreur Maketou (${up.status})`, code: data.code })
        }
      } catch (e) {
        return sendJson(res, 502, { success: false, message: e.message })
      }
    }

    if (pathname.startsWith('/api/maketou/cart') && method === 'GET') {
      const base = process.env.MAKETOU_API_BASE || 'https://api.maketou.net'
      const apiKey = process.env.MAKETOU_API_KEY || 'msk_09c77ea0fe53d89a1947898a1318de60e383561ea023e48a56321080ff98b080'
      const id = pathname.replace('/api/maketou/cart', '').replace(/^\//, '')

      if (!id) return sendJson(res, 400, { success: false, message: 'ID cart requis.' })

      try {
        const up = await fetch(`${base}/api/v1/stores/cart/${encodeURIComponent(id)}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        const data = await up.json()
        return sendJson(res, up.status, data)
      } catch (e) {
        return sendJson(res, 502, { message: e.message })
      }
    }

    // Default 404 for unhandled /api route
    if (pathname.startsWith('/api')) {
      return sendJson(res, 404, { success: false, message: `Route API introuvable : ${method} ${pathname}` })
    }

  } catch (err) {
    console.error('API Error:', err)
    return sendJson(res, 500, { success: false, message: 'Erreur interne du serveur.', error: err.message })
  }
}

function momoNumberIsMtn(num) {
  if (!num) return false
  const s = String(num).replace(/\D/g, '')
  return s.startsWith('67') || s.startsWith('650') || s.startsWith('651') || s.startsWith('652') || s.startsWith('653') || s.startsWith('654') || s.startsWith('68')
}

function momoNumberIsOrange(num) {
  if (!num) return false
  const s = String(num).replace(/\D/g, '')
  return s.startsWith('69') || s.startsWith('655') || s.startsWith('656') || s.startsWith('657') || s.startsWith('658') || s.startsWith('659')
}
