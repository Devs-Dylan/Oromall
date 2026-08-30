/**
 * Client d'intégration officiel de la passerelle de paiement Maketou (Moneroo)
 * Prise en charge de MTN Mobile Money, Orange Money, Moov, Wave, Cartes bancaires au Cameroun.
 */

export interface MaketouCheckoutInput {
  amount: number
  firstName: string
  lastName?: string
  email: string
  phone?: string
  redirectURL?: string
  meta?: Record<string, string>
}

export interface MaketouCheckoutResult {
  success: boolean
  cartId?: string
  invoice_url?: string
  message?: string
  code?: string
}

export interface MaketouCart {
  id: string
  status: 'waiting_payment' | 'completed' | 'abandoned' | 'payment_failed'
  totalAmount?: number
  currency?: string
}

export const MAKETOU_CONFIG = {
  apiBase: import.meta.env.VITE_MAKETOU_API_BASE || 'https://api.maketou.net',
  apiKey: import.meta.env.VITE_MAKETOU_API_KEY || 'msk_09c77ea0fe53d89a1947898a1318de60e383561ea023e48a56321080ff98b080',
  productId: import.meta.env.VITE_MAKETOU_PRODUCT_ID || 'e4899b0b-c18e-4728-bfae-eb19fc7e6fc7',
  freePrice: true,
}

/**
 * Normalise un numéro de téléphone au format international camerounais E.164 (+2376XXXXXXXX)
 */
export function normalizeCameroonPhone(value?: string): string | undefined {
  if (!value) return undefined
  const raw = String(value).trim()
  const digits = raw.replace(/\D/g, '')
  if (/^6\d{8}$/.test(digits)) return `+237${digits}`
  if (/^2376\d{8}$/.test(digits)) return `+${digits}`
  if (raw.startsWith('+') && /^\+[1-9]\d{7,14}$/.test(`+${digits}`)) return `+${digits}`
  return digits ? `+${digits}` : undefined
}

/**
 * Crée un panier de paiement sécurisé sur Maketou et retourne l'URL du guichet de paiement
 */
export async function createMaketouCheckout(input: MaketouCheckoutInput): Promise<MaketouCheckoutResult> {
  const normalizedPhone = normalizeCameroonPhone(input.phone)
  const names = (input.firstName || 'Client').trim().split(' ')
  const firstName = names[0] || 'Client'
  const lastName = input.lastName || names.slice(1).join(' ') || 'OroMall'

  // 1. Tenter d'appeler l'API locale / proxy
  try {
    const proxyRes = await fetch('/api/maketou/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: input.amount,
        firstName,
        lastName,
        email: input.email || 'client@oromall.cm',
        phone: normalizedPhone,
        redirectURL: input.redirectURL || `${window.location.origin}/orders?status=return`,
        meta: input.meta,
      }),
    })

    if (proxyRes.ok) {
      const data = await proxyRes.json()
      if (data.success && data.invoice_url) {
        return data
      }
    }
  } catch {
    // Si le proxy local n'est pas actif, basculer directement sur l'appel API Maketou
  }

  // 2. Appel direct à l'API Maketou
  try {
    const payload: any = {
      productDocumentId: MAKETOU_CONFIG.productId,
      email: input.email || 'client@oromall.cm',
      firstName,
      lastName,
      phone: normalizedPhone,
      customerPrice: Number(input.amount),
      meta: input.meta,
    }

    if (input.redirectURL && /^https:\/\//i.test(input.redirectURL)) {
      payload.redirectURL = input.redirectURL
    }

    const res = await fetch(`${MAKETOU_CONFIG.apiBase}/api/v1/stores/cart/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MAKETOU_CONFIG.apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json().catch(() => ({}))

    if (res.ok && (data.redirectUrl || data.invoice_url)) {
      return {
        success: true,
        cartId: data.cart?.id || data.id,
        invoice_url: data.redirectUrl || data.invoice_url,
      }
    }

    return {
      success: false,
      message: data.message || `Erreur Maketou (${res.status})`,
      code: data.code || data.error,
    }
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Impossible de joindre le serveur de paiement Maketou.',
    }
  }
}

/**
 * Récupère le statut en temps réel d'un panier Maketou
 */
export async function getMaketouCartStatus(cartId: string): Promise<MaketouCart | null> {
  if (!cartId) return null

  // 1. Tenter via le proxy
  try {
    const proxyRes = await fetch(`/api/maketou/cart/${encodeURIComponent(cartId)}`)
    if (proxyRes.ok) {
      return await proxyRes.json()
    }
  } catch {
    // ignore
  }

  // 2. Appel direct
  try {
    const res = await fetch(`${MAKETOU_CONFIG.apiBase}/api/v1/stores/cart/${encodeURIComponent(cartId)}`, {
      headers: {
        Authorization: `Bearer ${MAKETOU_CONFIG.apiKey}`,
      },
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // ignore
  }

  return null
}

export const maketouCartKey = (ref: string) => `oromall_maketou_${ref}`
