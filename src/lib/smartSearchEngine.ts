import { ProductAPI, HousingAPI, ShopAPI } from '@/lib/store'
import { CITIES_CAMEROON, CATEGORIES, type Product, type Housing, type Shop } from '@/types'
import { searchOpenStreetMap, type GeocodedLocation } from '@/lib/osmGeocoding'

export interface SmartSearchResult {
  products: Array<Product & { highlightText?: string }>
  housings: Array<Housing & { highlightText?: string }>
  shops: Array<Shop & { highlightText?: string }>
  osmPlaces: GeocodedLocation[]
  detectedCity?: string
  detectedCategory?: string
  detectedMaxPrice?: number
  detectedType?: 'product' | 'housing' | 'shop' | 'place'
  suggestedAction?: {
    label: string
    url: string
  }
}

// Normalise une chaîne de caractères (supprime les accents, minuscules, ponctuation)
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Calcule la distance de Levenshtein pour tolérance aux fautes de frappe
export function levenshteinDistance(a: string, b: string): number {
  const an = a.length
  const bn = b.length
  if (an === 0) return bn
  if (bn === 0) return an
  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0))
  for (let i = 0; i <= an; i++) matrix[0][i] = i
  for (let j = 0; j <= bn; j++) matrix[j][0] = j

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (b[j - 1] === a[i - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1]
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        )
      }
    }
  }
  return matrix[bn][an]
}

// Test de correspondance floue (fuzzy match)
export function fuzzyMatch(pattern: string, text: string, maxTypos: number = 2): boolean {
  const normPattern = normalizeString(pattern)
  const normText = normalizeString(text)

  if (normText.includes(normPattern)) return true

  // Mots découpés
  const patternWords = normPattern.split(/\s+/).filter(Boolean)
  const textWords = normText.split(/\s+/).filter(Boolean)

  return patternWords.every(pw => {
    if (pw.length <= 2) return normText.includes(pw)
    return textWords.some(tw => {
      if (tw.includes(pw) || pw.includes(tw)) return true
      if (Math.abs(tw.length - pw.length) <= 2) {
        return levenshteinDistance(tw, pw) <= maxTypos
      }
      return false
    })
  })
}

/**
 * Moteur de recherche sémantique et prédictif intelligent
 */
export async function executeSmartSearch(query: string): Promise<SmartSearchResult> {
  const normQuery = normalizeString(query)

  if (!normQuery || normQuery.length < 2) {
    return { products: [], housings: [], shops: [], osmPlaces: [] }
  }

  // 1. Détection de filtres intelligents dans la requête (Prix, Ville, Catégorie)
  let detectedCity: string | undefined
  let detectedCategory: string | undefined
  let detectedMaxPrice: number | undefined
  let detectedType: 'product' | 'housing' | 'shop' | 'place' | undefined

  // Détection de la ville
  for (const city of CITIES_CAMEROON) {
    if (fuzzyMatch(city, normQuery, 1)) {
      detectedCity = city
      break
    }
  }
  if (!detectedCity && fuzzyMatch('bastos', normQuery, 1)) detectedCity = 'Yaoundé'
  if (!detectedCity && fuzzyMatch('ngoa', normQuery, 1)) detectedCity = 'Yaoundé'
  if (!detectedCity && fuzzyMatch('akwa', normQuery, 1)) detectedCity = 'Douala'
  if (!detectedCity && fuzzyMatch('bonamoussadi', normQuery, 1)) detectedCity = 'Douala'

  // Détection de prix (ex: "moins de 50000", "max 30000", "20k", "50000 fcfa")
  const priceMatch = normQuery.match(/(?:moins de|max|sous|<|inférieur a)?\s*(\d+)(?:\s*k\b|\s*000\b|\s*fcfa\b)?/)
  if (priceMatch && priceMatch[1]) {
    const rawVal = parseInt(priceMatch[1], 10)
    if (normQuery.includes('k') && rawVal < 1000) {
      detectedMaxPrice = rawVal * 1000
    } else if (rawVal > 100) {
      detectedMaxPrice = rawVal
    }
  }

  // Détection de type
  if (normQuery.includes('chambre') || normQuery.includes('studio') || normQuery.includes('logement') || normQuery.includes('appartement') || normQuery.includes('villa') || normQuery.includes('cite')) {
    detectedType = 'housing'
  } else if (normQuery.includes('boutique') || normQuery.includes('magasin') || normQuery.includes('vendeur') || normQuery.includes('shop')) {
    detectedType = 'shop'
  } else if (normQuery.includes('campus') || normQuery.includes('universite') || normQuery.includes('ecole') || normQuery.includes('estlc') || normQuery.includes('polytech') || normQuery.includes('carrefour')) {
    detectedType = 'place'
  }

  // Détection de catégorie de produits
  for (const cat of CATEGORIES) {
    if (fuzzyMatch(cat, normQuery, 1)) {
      detectedCategory = cat
      break
    }
  }

  // 2. Recherche Produits
  const allProducts = ProductAPI.filter(p => p.status === 'active')
  const matchedProducts = allProducts.filter(p => {
    if (detectedMaxPrice && p.price > detectedMaxPrice) return false
    if (detectedCategory && p.category !== detectedCategory && !fuzzyMatch(detectedCategory, p.category)) return false
    return (
      fuzzyMatch(normQuery, p.name) ||
      fuzzyMatch(normQuery, p.description || '') ||
      fuzzyMatch(normQuery, p.category) ||
      (p.shop_name && fuzzyMatch(normQuery, p.shop_name))
    )
  }).slice(0, 5)

  // 3. Recherche Logements
  const allHousings = HousingAPI.filter(h => h.status === 'active')
  const matchedHousings = allHousings.filter(h => {
    if (detectedCity && h.city !== detectedCity) return false
    if (detectedMaxPrice && h.price > detectedMaxPrice) return false
    return (
      fuzzyMatch(normQuery, h.title) ||
      fuzzyMatch(normQuery, h.neighborhood || '') ||
      fuzzyMatch(normQuery, h.city) ||
      fuzzyMatch(normQuery, h.category) ||
      fuzzyMatch(normQuery, h.description || '')
    )
  }).slice(0, 4)

  // 4. Recherche Boutiques
  const allShops = ShopAPI.filter(s => s.status === 'active')
  const matchedShops = allShops.filter(s => {
    if (detectedCity && s.city !== detectedCity) return false
    return (
      fuzzyMatch(normQuery, s.name) ||
      fuzzyMatch(normQuery, s.city) ||
      fuzzyMatch(normQuery, s.category) ||
      fuzzyMatch(normQuery, s.description || '')
    )
  }).slice(0, 3)

  // 5. Recherche OpenStreetMap en arrière-plan pour les lieux réels et campus
  let osmPlaces: GeocodedLocation[] = []
  if (normQuery.length >= 3) {
    try {
      osmPlaces = await searchOpenStreetMap(query)
    } catch {
      osmPlaces = []
    }
  }

  // 6. Suggestion d'Action Intelligente
  let suggestedAction: { label: string; url: string } | undefined
  if (detectedType === 'housing' || (matchedHousings.length > matchedProducts.length && matchedHousings.length > 0)) {
    suggestedAction = {
      label: `Voir tous les logements ${detectedCity ? 'à ' + detectedCity : ''} 🏠`,
      url: `/housing${detectedCity ? '?city=' + encodeURIComponent(detectedCity) : ''}`
    }
  } else if (matchedProducts.length > 0) {
    suggestedAction = {
      label: `Explorer ces ${matchedProducts.length}+ articles sur la marketplace 🛍️`,
      url: `/?search=${encodeURIComponent(query)}`
    }
  } else if (osmPlaces.length > 0) {
    suggestedAction = {
      label: `Localiser "${query}" sur la Carte Interactive 📍`,
      url: `/map`
    }
  }

  return {
    products: matchedProducts,
    housings: matchedHousings,
    shops: matchedShops,
    osmPlaces: osmPlaces.slice(0, 3),
    detectedCity,
    detectedCategory,
    detectedMaxPrice,
    detectedType,
    suggestedAction
  }
}
