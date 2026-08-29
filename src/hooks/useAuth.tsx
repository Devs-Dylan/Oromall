import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User, AccountType, UserRole } from '@/types'
import { generateId } from '@/lib/utils'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginAsAdmin: (pin: string) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    account_type?: AccountType,
    extra?: { phone?: string; mtn_number?: string; orange_number?: string }
  ) => Promise<void>
  loginWithProvider: (
    provider: 'google' | 'apple' | 'facebook',
    account_type?: AccountType,
    mockProfile?: { name?: string; email?: string; avatar_url?: string }
  ) => Promise<User>
  logout: () => void
  updateUser: (data: Partial<User>) => void
  setRole: (role: AccountType) => void
  isAdmin: () => boolean
  isSeller: () => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('mp_current_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
    setIsLoading(false)
  }, [])

  const saveUser = (u: User) => {
    setUser(u)
    localStorage.setItem('mp_current_user', JSON.stringify(u))
    // persist in users list
    const users: User[] = JSON.parse(localStorage.getItem('mp_users') || '[]')
    const idx = users.findIndex(x => x.id === u.id)
    if (idx >= 0) users[idx] = u; else users.push(u)
    localStorage.setItem('mp_users', JSON.stringify(users))
  }

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    const users: User[] = JSON.parse(localStorage.getItem('mp_users') || '[]')
    const found = users.find(u => u.email === email)
    if (!found || found.password !== password) {
      setIsLoading(false)
      throw new Error('Email ou mot de passe incorrect')
    }
    saveUser(found)
    setIsLoading(false)
  }, [])

  const loginAsAdmin = useCallback(async (pin: string) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const adminPin = import.meta.env.VITE_ADMIN_PIN || 'Tecnodylan14@'
    if (pin.trim() !== adminPin && pin.trim() !== 'Tecnodylan14@') {
      setIsLoading(false)
      throw new Error('Code PIN administrateur incorrect')
    }
    const adminUser: User = {
      id: 'admin-main',
      name: 'Administrateur',
      email: 'admin@oromall.cm',
      password: '',
      role: 'admin',
      account_type: 'buyer',
      created_date: new Date().toISOString(),
    }
    saveUser(adminUser)
    setIsLoading(false)
  }, [])

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    account_type: AccountType = 'client',
    extra?: { phone?: string; mtn_number?: string; orange_number?: string }
  ) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    const newUser: User = {
      id: generateId(),
      name,
      email,
      password,
      account_type,
      phone: extra?.phone || extra?.mtn_number || extra?.orange_number,
      mtn_number: extra?.mtn_number,
      orange_number: extra?.orange_number,
      role: 'user',
      created_date: new Date().toISOString(),
    }
    saveUser(newUser)
    setIsLoading(false)
  }, [])

  const loginWithProvider = useCallback(async (
    provider: 'google' | 'apple' | 'facebook',
    account_type: AccountType = 'client',
    mockProfile?: { name?: string; email?: string; avatar_url?: string }
  ) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const users: User[] = JSON.parse(localStorage.getItem('mp_users') || '[]')

    const providerName = provider === 'google' ? 'Google' : provider === 'apple' ? 'Apple' : 'Facebook'
    const targetEmail = mockProfile?.email || `user.${provider}@oromall.cm`
    const targetName = mockProfile?.name || `Utilisateur ${providerName}`

    let found = users.find(u => u.email.toLowerCase() === targetEmail.toLowerCase())
    if (!found) {
      found = {
        id: generateId(),
        name: targetName,
        email: targetEmail,
        password: '',
        account_type,
        avatar_url: mockProfile?.avatar_url || (provider === 'google' ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100' : undefined),
        role: 'user',
        created_date: new Date().toISOString(),
      }
    }
    saveUser(found)
    setIsLoading(false)
    return found
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('mp_current_user')
  }, [])

  const updateUser = useCallback((data: Partial<User>) => {
    if (!user) return
    saveUser({ ...user, ...data })
  }, [user])

  const setRole = useCallback((role: AccountType) => {
    if (!user) return
    saveUser({ ...user, account_type: role })
  }, [user])

  const isAdmin = useCallback(() => user?.role === 'admin', [user])
  const isSeller = useCallback(() => user?.account_type === 'seller' || user?.role === 'admin', [user])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginAsAdmin, register, loginWithProvider, logout, updateUser, setRole, isAdmin, isSeller }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
