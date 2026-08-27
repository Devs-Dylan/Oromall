import { useState, useEffect, useCallback } from 'react'
import { WishlistAPI, ProductAPI, HousingAPI } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import { Product, Housing } from '@/types'
import { toastSuccess, toastError } from '@/components/ui/Toast'

export function useWishlist() {
  const { user } = useAuth()
  const [, setTick] = useState(0)

  const triggerUpdate = () => setTick(t => t + 1)

  const isProductFavorite = useCallback((productId: string): boolean => {
    if (!user) return false
    return WishlistAPI.filter(w => w.user_id === user.id && w.product_id === productId).length > 0
  }, [user])

  const isHousingFavorite = useCallback((housingId: string): boolean => {
    if (!user) return false
    try {
      const stored = localStorage.getItem('mp_housing_favorites')
      if (!stored) return false
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) && parsed.includes(housingId)
    } catch {
      return false
    }
  }, [user])

  const toggleProductFavorite = useCallback((product: Product) => {
    if (!user) { toastError('Connexion requise', 'Connectez-vous pour ajouter aux favoris.'); return }
    const existing = WishlistAPI.filter(w => w.user_id === user.id && w.product_id === product.id)[0]
    if (existing) {
      WishlistAPI.delete(existing.id)
      toastSuccess(`"${product.name}" retiré de vos favoris`)
    } else {
      WishlistAPI.create({ user_id: user.id, product_id: product.id })
      toastSuccess(`"${product.name}" ajouté à vos favoris ❤️`)
    }
    triggerUpdate()
  }, [user])

  const toggleHousingFavorite = useCallback((housing: Housing) => {
    if (!user) { toastError('Connexion requise', 'Connectez-vous pour ajouter aux favoris.'); return }
    try {
      const stored = localStorage.getItem('mp_housing_favorites')
      const favs: string[] = stored ? JSON.parse(stored) : []
      const exists = favs.includes(housing.id)
      let updated: string[]
      if (exists) {
        updated = favs.filter(id => id !== housing.id)
        toastSuccess(`"${housing.title}" retiré de vos favoris`)
      } else {
        updated = [...favs, housing.id]
        toastSuccess(`"${housing.title}" ajouté à vos favoris ❤️`)
      }
      localStorage.setItem('mp_housing_favorites', JSON.stringify(updated))
      triggerUpdate()
    } catch {
      toastError('Erreur', 'Impossible de mettre à jour les favoris.')
    }
  }, [user])

  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([])
  const [favoriteHousings, setFavoriteHousings] = useState<Housing[]>([])

  useEffect(() => {
    if (!user) {
      setFavoriteProducts([])
      setFavoriteHousings([])
      return
    }
    try {
      const productIds = WishlistAPI.filter(w => w.user_id === user.id).map(w => w.product_id)
      const products = productIds
        .map(id => ProductAPI.get(id))
        .filter((p): p is Product => p !== undefined)

      const stored = localStorage.getItem('mp_housing_favorites')
      const housingIds: string[] = stored ? JSON.parse(stored) : []
      const housings = housingIds
        .map(id => HousingAPI.get(id))
        .filter((h): h is Housing => h !== undefined)

      setFavoriteProducts(products)
      setFavoriteHousings(housings)
    } catch {
      setFavoriteProducts([])
      setFavoriteHousings([])
    }
  }, [user, triggerUpdate])

  const totalCount = favoriteProducts.length + favoriteHousings.length

  return {
    favoriteProducts,
    favoriteHousings,
    totalCount,
    isProductFavorite,
    isHousingFavorite,
    toggleProductFavorite,
    toggleHousingFavorite
  }
}
