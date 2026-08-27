import express from 'express'
import cors from 'cors'
import pkg from 'pg'
const { Pool } = pkg

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

// Configuration du Pool PostgreSQL
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'oromall',
})

// Clé secrète de sécurité pour l'application Kotlin Android
const ANDROID_GATEWAY_SECRET = process.env.ANDROID_SECRET || 'MARCHEPLUS_ANDROID_SECRET_KEY_2026'

// --- HELPER D'EXTRACTION REGEX MTN & ORANGE MONEY ---
function parseMtnSms(message: string): { transactionId: string | null; amount: number | null; senderPhone: string | null } {
  // Ex MTN Cameroun : "Vous avez recu 15000 FCFA de 677XXXXXX. Transaction Id: 1294829384. Nouveau solde: ..."
  // Ou : "Transfert de 5000 FCFA effectue par 677... Ref: 983472948"
  const txnMatch = message.match(/(?:Transaction\s*Id|Txn\s*ID|Ref|Id)[:\s]*([A-Za-z0-9]+)/i)
  const amountMatch = message.match(/(?:recu|reçu|montant\s*de|de)\s*([0-9\s.,]+)\s*(?:FCFA|XAF)/i)
  const phoneMatch = message.match(/(?:de|par)\s*(237)?(6[5-9][0-9]{7})/i)

  const transactionId = txnMatch ? txnMatch[1].trim() : null
  const rawAmount = amountMatch ? amountMatch[1].replace(/[\s,]/g, '') : null
  const amount = rawAmount ? parseFloat(rawAmount) : null
  const senderPhone = phoneMatch ? (phoneMatch[2] ? (phoneMatch[1] ? phoneMatch[1] + phoneMatch[2] : phoneMatch[2]) : phoneMatch[0].replace(/\D/g, '')) : null

  return { transactionId, amount, senderPhone }
}

// =========================================================================
// 1. ENDPOINT RÉCEPTION SMS DEPUIS L'APP ANDROID KOTLIN (BroadcastReceiver)
// =========================================================================
app.post('/api/gateway/sms', async (req, res) => {
  try {
    const authHeader = req.headers['x-gateway-key']
    if (authHeader !== ANDROID_GATEWAY_SECRET) {
      return res.status(401).json({ error: 'Accès non autorisé au Gateway SMS' })
    }

    const { sender, message, receivedAt } = req.body
    if (!message) {
      return res.status(400).json({ error: 'Message SMS manquant' })
    }

    console.log(`📩 SMS MoMo intercepté de [${sender}] : ${message}`)

    const { transactionId, amount, senderPhone } = parseMtnSms(message)

    // Insérer dans les logs PostgreSQL
    const insertQuery = `
      INSERT INTO payment_sms_logs (sender, message_raw, amount, transaction_id, sender_phone)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (transaction_id) DO NOTHING
      RETURNING *
    `
    const { rows } = await pool.query(insertQuery, [
      sender || 'MTN MobileMoney',
      message,
      amount,
      transactionId,
      senderPhone
    ])

    // Comparaison & Vérification automatique avec les commandes / demandes de visites en attente
    let autoMatched = false
    if (transactionId) {
      // 1. Chercher dans les commandes en attente avec cette référence
      const orderMatch = await pool.query(
        `SELECT id, total_amount FROM orders WHERE payment_reference = $1 OR payment_proof_url ILIKE $2`,
        [transactionId, `%${transactionId}%`]
      )

      if (orderMatch.rows.length > 0) {
        const order = orderMatch.rows[0]
        await pool.query(
          `UPDATE orders SET status = 'payment_verified', withdrawal_status = 'verified' WHERE id = $1`,
          [order.id]
        )
        await pool.query(
          `UPDATE payment_sms_logs SET matched = true, matched_order_id = $1 WHERE transaction_id = $2`,
          [order.id, transactionId]
        )
        autoMatched = true
        console.log(`✅ Commande #${order.id} validée automatiquement par SMS MoMo !`)
      }

      // 2. Chercher dans les demandes de visite de logement
      const visitMatch = await pool.query(
        `SELECT id, amount FROM visit_requests WHERE payment_reference = $1 OR payment_proof_url ILIKE $2`,
        [transactionId, `%${transactionId}%`]
      )

      if (visitMatch.rows.length > 0) {
        const visit = visitMatch.rows[0]
        await pool.query(
          `UPDATE visit_requests SET status = 'approved', payment_status = 'paid' WHERE id = $1`,
          [visit.id]
        )
        await pool.query(
          `UPDATE payment_sms_logs SET matched = true, matched_visit_id = $1 WHERE transaction_id = $2`,
          [visit.id, transactionId]
        )
        autoMatched = true
        console.log(`✅ Visite Logement #${visit.id} approuvée automatiquement par SMS MoMo !`)
      }
    }

    res.json({
      success: true,
      transactionId,
      amount,
      autoMatched
    })
  } catch (err: any) {
    console.error('Erreur Gateway SMS :', err.message)
    res.status(500).json({ error: err.message })
  }
})

// =========================================================================
// 2. ENDPOINT COMPARAISON MANUELLE PAR L'ADMIN (RÉFÉRENCE / OCR CAPTURE)
// =========================================================================
app.post('/api/gateway/verify-reference', async (req, res) => {
  try {
    const { reference, orderId, visitId } = req.body
    if (!reference) return res.status(400).json({ error: 'Référence requise' })

    const { rows } = await pool.query(
      `SELECT * FROM payment_sms_logs WHERE transaction_id = $1 OR message_raw ILIKE $2`,
      [reference.trim(), `%${reference.trim()}%`]
    )

    if (rows.length === 0) {
      return res.json({ verified: false, message: 'Aucun SMS bancaire MoMo trouvé avec cette référence' })
    }

    const sms = rows[0]

    // Si lié à une commande
    if (orderId) {
      await pool.query(`UPDATE orders SET status = 'payment_verified' WHERE id = $1`, [orderId])
      await pool.query(`UPDATE payment_sms_logs SET matched = true, matched_order_id = $1 WHERE id = $2`, [orderId, sms.id])
    }

    // Si lié à une visite
    if (visitId) {
      await pool.query(`UPDATE visit_requests SET status = 'approved', payment_status = 'paid' WHERE id = $1`, [visitId])
      await pool.query(`UPDATE payment_sms_logs SET matched = true, matched_visit_id = $1 WHERE id = $2`, [visitId, sms.id])
    }

    res.json({
      verified: true,
      amount: sms.amount,
      sender: sms.sender_phone,
      receivedAt: sms.created_at
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// =========================================================================
// 3. CRUD REST STANDARD
// =========================================================================
const createCrudEndpoints = (tableName: string) => {
  app.get(`/api/${tableName}`, async (req, res) => {
    try {
      const orderCol = tableName === 'payment_sms_logs' ? 'created_at' : 'created_date'
      const { rows } = await pool.query(`SELECT * FROM ${tableName} ORDER BY ${orderCol} DESC`)
      res.json(rows)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  app.get(`/api/${tableName}/:id`, async (req, res) => {
    try {
      const { id } = req.params
      const { rows } = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id])
      if (rows.length === 0) return res.status(404).json({ error: 'Non trouvé' })
      res.json(rows[0])
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })

  app.delete(`/api/${tableName}/:id`, async (req, res) => {
    try {
      const { id } = req.params
      await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [id])
      res.json({ success: true })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })
}

;['products', 'housing', 'shops', 'users', 'orders'].forEach(createCrudEndpoints)

app.listen(port, () => {
  console.log(`🚀 Serveur API + Gateway SMS MoMo démarré sur http://localhost:${port}`)
})
