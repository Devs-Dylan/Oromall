// Utilitaires généraux
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-CM', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + ' FCFA'
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  })
}

export function formatRelativeDate(date: string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor(diff / 3600000)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'À l\'instant'
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days < 7) return `Il y a ${days}j`
  return formatDate(date)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
}

export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[àâä]/g, 'a').replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function truncate(text: string, length: number): string {
  return text.length > length ? text.substring(0, length) + '...' : text
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '')
  const intl = clean.startsWith('237') ? clean : '237' + clean
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'badge-success', pending: 'badge-warning',
    suspended: 'badge-danger', verified: 'badge-success',
    rejected: 'badge-danger', new: 'badge-primary',
    contacted: 'badge-warning', sold: 'badge-success',
    cancelled: 'badge-danger', completed: 'badge-success',
    payment_uploaded: 'badge-warning', payment_verified: 'badge-success',
    pending_payment: 'badge-warning',
  }
  return map[status] ?? 'badge-gray'
}
