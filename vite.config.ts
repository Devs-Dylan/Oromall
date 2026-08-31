import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { handleApiRequest } from './server/apiRouter.mjs'

function oromallBackendPlugin() {
  return {
    name: 'oromall-backend-api',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/api')) {
          return handleApiRequest(req, res)
        }
        next()
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
    oromallBackendPlugin()
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
