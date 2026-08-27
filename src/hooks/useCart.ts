import { useState, useCallback } from 'react'
import type { CartItem, PromoCode } from '@/types'
import { CartAPI, PromoAPI } from '@/lib/store'
import { generateId } from '@/lib/utils'

export function useCart() {
  const [, forceUpdate] = useState(0)
  const refresh = () => forceUpdate(n => n + 1)

  const items = CartAPI.list()

  const addItem = useCallback((item: Omit<CartItem, 'id'>) => {
    const current = CartAPI.list()
    const existing = current.find(i => i.product_id === item.product_id)
    if (existing) {
      CartAPI.update(existing.id, { quantity: existing.quantity + 1 })
    } else {
      CartAPI.create({ ...item, id: generateId() } as CartItem)
    }
    refresh()
  }, [refresh])

  const removeItem = useCallback((id: string) => {
    CartAPI.delete(id)
    refresh()
  }, [refresh])

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) CartAPI.delete(id)
    else CartAPI.update(id, { quantity })
    refresh()
  }, [refresh])

  const clearCart = useCallback(() => {
    const current = CartAPI.list()
    current.forEach(i => CartAPI.delete(i.id))
    refresh()
  }, [refresh])

  const applyPromo = useCallback((code: string): PromoCode | null => {
    const promo = PromoAPI.filter(p => p.code.toUpperCase() === code.toUpperCase() && p.active)[0]
    if (!promo) return null
    if (promo.max_uses && promo.uses_count >= promo.max_uses) return null
    if (promo.expires_date && new Date(promo.expires_date) < new Date()) return null
    PromoAPI.update(promo.id, { uses_count: promo.uses_count + 1 })
    return promo
  }, [])

  const currentItems = CartAPI.list()
  const total = currentItems.reduce((sum, i) => sum + i.product_price * i.quantity, 0)
  const count = currentItems.reduce((sum, i) => sum + i.quantity, 0)

  const byShop = currentItems.reduce((acc, item) => {
    if (!acc[item.shop_id]) acc[item.shop_id] = { shop_name: item.shop_name, items: [] as CartItem[] }
    acc[item.shop_id].items.push(item)
    return acc
  }, {} as Record<string, { shop_name: string; items: CartItem[] }>)

  return { items: currentItems, total, count, byShop, addItem, removeItem, updateQuantity, clearCart, applyPromo }
}
