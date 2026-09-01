// Centralized HTTP Client for OroMall Backend API

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

export class ApiError extends Error {
  status: number
  code?: string
  constructor(message: string, status: number = 500, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('mp_auth_token')
  } catch {
    return null
  }
}

export function setAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem('mp_auth_token', token)
    } else {
      localStorage.removeItem('mp_auth_token')
    }
  } catch {
    // Ignore storage issues
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

  try {
    const res = await fetch(url, {
      ...options,
      headers
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new ApiError(data.message || `Erreur serveur (${res.status})`, res.status, data.code)
    }

    return data
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err
    }
    throw new ApiError(err.message || 'Impossible de contacter le serveur OroMall.', 503)
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(endpoint: string, body?: any) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  // Auth specific
  auth: {
    register: (payload: any) => request<{ success: boolean; user: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    login: (payload: { email?: string; password?: string; pin?: string }) => request<{ success: boolean; user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    me: () => request<{ success: boolean; user: any }>('/api/auth/me', { method: 'GET' }),
  },

  // Bulk Data Sync
  sync: () => request<{ success: boolean; data: Record<string, any[]> }>('/api/sync', { method: 'GET' })
}
