import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function maketouApiPlugin() {
  const base = process.env.MAKETOU_API_BASE || 'https://api.maketou.net'
  const apiKey = process.env.MAKETOU_API_KEY || 'msk_09c77ea0fe53d89a1947898a1318de60e383561ea023e48a56321080ff98b080'
  const productId = process.env.MAKETOU_PRODUCT_ID || 'e4899b0b-c18e-4728-bfae-eb19fc7e6fc7'

  return {
    name: 'maketou-api',
    configureServer(server: any) {
      server.middlewares.use('/api/maketou/checkout', async (req: any, res: any) => {
        if (req.method !== 'POST') return res.writeHead(405).end()
        let body = ''
        req.on('data', (chunk: any) => { body += chunk })
        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}')
            const { amount, firstName, lastName, email, phone, redirectURL, meta } = parsed
            const digits = String(phone || '').replace(/\D/g, '')
            let normalizedPhone = undefined
            if (/^6\d{8}$/.test(digits)) normalizedPhone = `+237${digits}`
            else if (/^2376\d{8}$/.test(digits)) normalizedPhone = `+${digits}`
            else if (digits) normalizedPhone = `+${digits}`

            const payload: any = {
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

            const up = await fetch(`${base}/api/v1/stores/cart/checkout`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
              body: JSON.stringify(payload),
            })
            const data = await up.json().catch(() => ({}))
            res.writeHead(up.status, { 'Content-Type': 'application/json' })
            if (up.ok) {
              res.end(JSON.stringify({ success: true, cartId: data.cart?.id, invoice_url: data.redirectUrl }))
            } else {
              res.end(JSON.stringify({ success: false, message: data.message || `Erreur Maketou (${up.status})`, code: data.code }))
            }
          } catch (e: any) {
            res.writeHead(502, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ success: false, message: e.message }))
          }
        })
      })

      server.middlewares.use('/api/maketou/cart', async (req: any, res: any) => {
        const id = req.url?.replace(/^\//, '')
        if (!id) return res.writeHead(400).end()
        try {
          const up = await fetch(`${base}/api/v1/stores/cart/${encodeURIComponent(id)}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
          })
          const data = await up.json()
          res.writeHead(up.status, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(data))
        } catch (e: any) {
          res.writeHead(502, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ message: e.message }))
        }
      })
    }
  }
}

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  },
  preview: {
    host: true,
    port: 4173,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  },
  plugins: [
    react(),
    maketouApiPlugin()
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react', 'framer-motion'],
          maps: ['leaflet', 'react-leaflet']
        }
      }
    }
  }
})
