import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleApiRequest } from './apiRouter.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PORT = Number(process.env.PORT || process.env.API_PORT || 3000)
const DIST_DIR = path.resolve(__dirname, '../dist')

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
}

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const pathname = urlObj.pathname

  // Healthcheck endpoint
  if (pathname === '/api/health' || pathname === '/healthz' || pathname === '/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() }))
  }

  // 1. API Route handling
  if (pathname.startsWith('/api')) {
    return handleApiRequest(req, res)
  }

  // 2. Static files serving (if dist exists)
  if (fs.existsSync(DIST_DIR)) {
    let filePath = path.join(DIST_DIR, pathname)
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html')
    }

    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
      const ext = path.extname(filePath).toLowerCase()
      const mime = MIME_TYPES[ext] || 'application/octet-stream'
      res.writeHead(200, { 'Content-Type': mime })
      return fs.createReadStream(filePath).pipe(res)
    }

    // SPA Fallback to index.html
    const indexPath = path.join(DIST_DIR, 'index.html')
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' })
      return fs.createReadStream(indexPath).pipe(res)
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' })
  res.end('Not Found')
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur OroMall & Base de Données actif sur http://0.0.0.0:${PORT}`)
})
