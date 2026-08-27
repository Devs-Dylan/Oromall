export interface OsmPlace {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type?: string
  category?: string
  importance?: number
  address?: {
    road?: string
    suburb?: string
    city?: string
    town?: string
    village?: string
    state?: string
    country?: string
    university?: string
    amenity?: string
    school?: string
    building?: string
    shop?: string
  }
}

export interface GeocodedLocation {
  id: string
  label: string
  shortLabel: string
  lat: number
  lng: number
  type: string
  city?: string
  neighborhood?: string
  source: 'osm_nominatim' | 'osm_photon' | 'openmeteo'
  googleMapsUrl?: string
  osmUrl?: string
}

/**
 * Moteur de géolocalisation 100% en direct via les API OpenStreetMap officielles.
 * Aucune coordonnée codée en dur : toutes les coordonnées proviennent exclusivement
 * des serveurs OpenStreetMap (Nominatim, Photon Komoot, Open-Meteo).
 */
export async function searchOpenStreetMap(query: string): Promise<GeocodedLocation[]> {
  if (!query || query.trim().length < 2) return []

  const trimmed = query.trim()
  const encoded = encodeURIComponent(trimmed)
  const results: GeocodedLocation[] = []

  try {
    // 1. Requête principale : OpenStreetMap Nominatim Live (Cameroun + mondial)
    const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&countrycodes=cm&addressdetails=1&limit=8`
    const osmPromise = fetch(osmUrl, {
      headers: {
        'Accept-Language': 'fr,en',
      }
    }).then(r => (r.ok ? r.json() : [])).catch(() => [])

    // 2. Requête complémentaire : Photon Komoot (Index direct de la planète OpenStreetMap)
    const photonUrl = `https://photon.komoot.io/api/?q=${encoded}&limit=8`
    const photonPromise = fetch(photonUrl).then(r => (r.ok ? r.json() : { features: [] })).catch(() => ({ features: [] }))

    // 3. Requête complémentaire : Open-Meteo Geocoding (Données OpenStreetMap)
    const openMeteoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encoded}&count=8&language=fr&format=json`
    const openMeteoPromise = fetch(openMeteoUrl).then(r => (r.ok ? r.json() : { results: [] })).catch(() => ({ results: [] }))

    const [osmData, photonData, openMeteoData] = await Promise.all([osmPromise, photonPromise, openMeteoPromise])

    // Traitement des résultats Nominatim
    if (Array.isArray(osmData)) {
      osmData.forEach((item: OsmPlace) => {
        const lat = Number(parseFloat(item.lat).toFixed(5))
        const lng = Number(parseFloat(item.lon).toFixed(5))
        const isDuplicate = results.some(r => Math.abs(r.lat - lat) < 0.0005 && Math.abs(r.lng - lng) < 0.0005)

        if (!isDuplicate) {
          const parts = item.display_name.split(',')
          const shortLabel = parts.slice(0, 3).join(', ').trim()
          const city = item.address?.city || item.address?.town || item.address?.state || ''

          results.push({
            id: `osm-nom-${item.place_id}`,
            label: item.display_name,
            shortLabel: shortLabel || item.display_name,
            lat,
            lng,
            type: item.type || item.category || 'OpenStreetMap',
            city,
            source: 'osm_nominatim',
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
            osmUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
          })
        }
      })
    }

    // Traitement des résultats Photon OpenStreetMap
    if (photonData?.features && Array.isArray(photonData.features)) {
      photonData.features.forEach((feat: any, idx: number) => {
        const props = feat.properties || {}
        const coords = feat.geometry?.coordinates || []
        if (coords.length === 2) {
          const lng = Number(coords[0].toFixed(5))
          const lat = Number(coords[1].toFixed(5))
          const isDuplicate = results.some(r => Math.abs(r.lat - lat) < 0.0005 && Math.abs(r.lng - lng) < 0.0005)

          if (!isDuplicate) {
            const name = props.name || props.street || trimmed
            const city = props.city || props.state || props.country || ''
            const label = `${name}${city ? ', ' + city : ''}`

            results.push({
              id: `osm-pho-${idx}`,
              label,
              shortLabel: label,
              lat,
              lng,
              type: props.type || 'Lieu OpenStreetMap',
              city,
              source: 'osm_photon',
              googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
              osmUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
            })
          }
        }
      })
    }

    // Traitement des résultats Open-Meteo OpenStreetMap
    if (openMeteoData?.results && Array.isArray(openMeteoData.results)) {
      openMeteoData.results.forEach((item: any, idx: number) => {
        const lat = Number(item.latitude.toFixed(5))
        const lng = Number(item.longitude.toFixed(5))
        const isDuplicate = results.some(r => Math.abs(r.lat - lat) < 0.0005 && Math.abs(r.lng - lng) < 0.0005)

        if (!isDuplicate) {
          const label = `${item.name}${item.admin1 ? ', ' + item.admin1 : ''}${item.country ? ' (' + item.country + ')' : ''}`
          results.push({
            id: `osm-met-${idx}`,
            label,
            shortLabel: label,
            lat,
            lng,
            type: 'Localité',
            city: item.admin1 || item.name,
            source: 'openmeteo',
            googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
            osmUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`
          })
        }
      })
    }
  } catch (err) {
    console.warn('Erreur interrogation OpenStreetMap live:', err)
  }

  return results
}
