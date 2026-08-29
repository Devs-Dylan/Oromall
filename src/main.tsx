import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/hooks/useAuth'
import App from './App'
import 'leaflet/dist/leaflet.css'
import './index.css'

// 🚫 Désactivation totale des caches navigateur et désenregistrement des Service Workers
if (typeof window !== 'undefined') {
  // 1. Désenregistrer tous les Service Workers actifs
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister()
      }
    }).catch(() => { /* ignore */ })
  }

  // 2. Vider tous les caches de stockage (CacheStorage) du navigateur
  if ('caches' in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        caches.delete(key)
      }
    }).catch(() => { /* ignore */ })
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
