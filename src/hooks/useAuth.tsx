import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User, AccountType, UserRole } from '@/types'
import { generateId } from '@/lib/utils'
import { seedDemoData } from '@/lib/store'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
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
    seedDemoData()
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

  const login = useCallback(async (email: string, _password: string) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    // Check existing users
    const users: User[] = JSON.parse(localStorage.getItem('mp_users') || '[]')
    let found = users.find(u => u.email === email)
    if (!found) {
      // Auto-create for demo
      const isAdmin = email.includes('admin')
      found = {
        id: generateId(), name: email.split('@')[0], email,
        role: isAdmin ? 'admin' : 'user',
        account_type: isAdmin ? 'seller' : undefined,
        created_date: new Date().toISOString(),
      }
    }
    saveUser(found)
    setIsLoading(false)
  }, [])

  const register = useCallback(async (name: string, email: string, _password: string) => {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    const newUser: User = {
      id: generateId(), name, email, role: 'user',
      created_date: new Date().toISOString(),
    }
    saveUser(newUser)
    setIsLoading(false)
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
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser, setRole, isAdmin, isSeller }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
