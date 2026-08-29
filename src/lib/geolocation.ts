/**
 * Module universel de Géolocalisation Intelligente (Smart Geolocation)
 * Résout les problèmes de blocage navigateur (HTTPS requis, timeout GPS sur PC, permission bloquée, etc.)
 * avec repli automatique (GPS précis -> Réseau Wi-Fi/Cellulaire -> Géolocalisation IP -> Coordonnées de ville).
 */

export interface GeolocationResult {
  latitude: number
  longitude: number
  accuracy?: number
  method: 'gps_high' | 'network' | 'ip' | 'preset'
  message: string
}

// Coordonnées par défaut des principales villes du Cameroun
export const CAMEROON_CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Yaoundé': { lat: 3.8480, lng: 11.5021 },
  'Douala': { lat: 4.0511, lng: 9.7679 },
  'Bafoussam': { lat: 5.4777, lng: 10.4176 },
  'Bamenda': { lat: 5.9631, lng: 10.1591 },
  'Garoua': { lat: 9.3014, lng: 13.3977 },
  'Maroua': { lat: 10.5973, lng: 14.3159 },
  'Ngaoundéré': { lat: 7.3167, lng: 13.5833 },
  'Bertoua': { lat: 4.5773, lng: 13.6846 },
  'Ebolowa': { lat: 2.9167, lng: 11.1500 },
  'Kribi': { lat: 2.9390, lng: 9.9110 },
  'Buea': { lat: 4.1560, lng: 9.2880 },
  'Limbé': { lat: 4.0244, lng: 9.2140 },
  'Dschang': { lat: 5.4480, lng: 10.0530 },
  'Kumba': { lat: 4.6363, lng: 9.4469 },
  'Foumban': { lat: 5.7291, lng: 10.9000 },
  'Ambam': { lat: 2.3833, lng: 11.2833 },
}

/**
 * Récupère la position avec tolérance aux pannes et replis automatiques
 */
export async function getSmartGeolocation(fallbackCity?: string): Promise<GeolocationResult> {
  // 1. Essai Géolocalisation Navigateur Haute Précision (GPS)
  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 30000,
        })
      })

      return {
        latitude: Number(pos.coords.latitude.toFixed(6)),
        longitude: Number(pos.coords.longitude.toFixed(6)),
        accuracy: Math.round(pos.coords.accuracy),
        method: 'gps_high',
        message: `Position GPS exacte détectée (précision ~${Math.round(pos.coords.accuracy)}m)`,
      }
    } catch (err: any) {
      console.warn('GPS haute précision non disponible, tentative réseau standard...', err)
    }

    // 2. Deuxième essai : Géolocalisation Standard / Basse consommation (Wi-Fi / Cellulaire)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60000,
        })
      })

      return {
        latitude: Number(pos.coords.latitude.toFixed(6)),
        longitude: Number(pos.coords.longitude.toFixed(6)),
        accuracy: Math.round(pos.coords.accuracy),
        method: 'network',
        message: 'Position détectée via réseau Wi-Fi / Cellulaire 📍',
      }
    } catch (err: any) {
      console.warn('Géolocalisation navigateur échouée, tentative repli IP...', err)
    }
  }

  // 3. Troisième essai : Géolocalisation par IP (Fonctionne même si le navigateur bloque le GPS ou en HTTP)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    const res = await fetch('https://ipwho.is/', { signal: controller.signal })
    clearTimeout(timeoutId)

    if (res.ok) {
      const data = await res.json()
      if (data && data.latitude && data.longitude) {
        return {
          latitude: Number(data.latitude.toFixed(6)),
          longitude: Number(data.longitude.toFixed(6)),
          method: 'ip',
          message: `Position approximative détectée via connexion Internet (${data.city || data.country || 'IP'})`,
        }
      }
    }
  } catch (ipErr) {
    console.warn('Géolocalisation IP non disponible:', ipErr)
  }

  // 4. Quatrième repli : Ville sélectionnée ou Yaoundé par défaut
  const cityName = fallbackCity && CAMEROON_CITY_COORDS[fallbackCity] ? fallbackCity : 'Yaoundé'
  const preset = CAMEROON_CITY_COORDS[cityName] || CAMEROON_CITY_COORDS['Yaoundé']

  return {
    latitude: preset.lat,
    longitude: preset.lng,
    method: 'preset',
    message: `Position calée sur le centre de ${cityName} (GPS non accessible)`,
  }
}
