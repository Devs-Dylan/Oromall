import { useState, useEffect, useCallback } from 'react'
import { WishlistAPI, ProductAPI, HousingAPI } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import { Product, Housing } from '@/types'
import { toastSuccess } from '@/components/ui/Toast'

export function useWishlist() {
  const { user } = useAuth()
  const [, setTick] = useState(0)

  const triggerUpdate = () => setTick(t => t + 1)

  // Get list of favorite product IDs & housing IDs stored in localStorage
  const getLocalFavorites = useCallback(() => {
    try {
      const stored = localStorage.getItem('mp_favorites_v2')
      return stored ? JSON.parse(stored) : { products: [], housings: [] }
    } catch {
      return { products: [], housings: [] }
    }
  }, [])

  const setLocalFavorites = (data: { products: string[]; housings: string[] }) => {
    localStorage.setItem('mp_favorites_v2', JSON.stringify(data))
    triggerUpdate()
  }

  const isProductFavorite = (productId: string): boolean => {
    const favs = getLocalFavorites()
    return favs.products.includes(productId)
  }

  const isHousingFavorite = (housingId: string): boolean => {
    const favs = getLocalFavorites()
    return favs.housings.includes(housingId)
  }

  const toggleProductFavorite = (product: Product) => {
    const favs = getLocalFavorites()
    const exists = favs.products.includes(product.id)

    let updatedProducts: string[]
    if (exists) {
      updatedProducts = favs.products.filter((id: string) => id !== product.id)
      toastSuccess(`"${product.name}" retiré de vos favoris`)
    } else {
      updatedProducts = [...favs.products, product.id]
      toastSuccess(`"${product.name}" ajouté à vos favoris ❤️`)
    }

    setLocalFavorites({ ...favs, products: updatedProducts })
  }

  const toggleHousingFavorite = (housing: Housing) => {
    const favs = getLocalFavorites()
    const exists = favs.housings.includes(housing.id)

    let updatedHousings: string[]
    if (exists) {
      updatedHousings = favs.housings.filter((id: string) => id !== housing.id)
      toastSuccess(`"${housing.title}" retiré de vos favoris`)
    } else {
      updatedHousings = [...favs.housings, housing.id]
      toastSuccess(`"${housing.title}" ajouté à vos favoris ❤️`)
    }

    setLocalFavorites({ ...favs, housings: updatedHousings })
  }

  const favs = getLocalFavorites()
  const favoriteProducts: Product[] = favs.products
    .map((id: string) => ProductAPI.get(id))
    .filter((p: Product | undefined): p is Product => p !== undefined)

  const favoriteHousings: Housing[] = favs.housings
    .map((id: string) => HousingAPI.get(id))
    .filter((h: Housing | undefined): h is Housing => h !== undefined)

  const totalCount = favs.products.length + favs.housings.length

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
