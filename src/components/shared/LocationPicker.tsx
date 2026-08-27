import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Compass, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { toastSuccess, toastError, toastInfo } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import LeafletMap, { MapMarkerItem } from './LeafletMap'

export interface LocationCoordinates {
  latitude: number
  longitude: number
  city?: string
  neighborhood?: string
}

interface LocationPickerProps {
  latitude: string | number
  longitude: string | number
  city?: string
  neighborhood?: string
  onChange: (coords: { latitude: string; longitude: string; city?: string; neighborhood?: string }) => void
  label?: string
}

export const CAMEROON_PRESETS = [
  { city: 'Yaoundé', neighborhood: 'Bastos', lat: 3.886, lng: 11.517 },
  { city: 'Yaoundé', neighborhood: 'Ngoa-Ekellé (Univ)', lat: 3.856, lng: 11.498 },
  { city: 'Yaoundé', neighborhood: 'Omnisports', lat: 3.888, lng: 11.539 },
  { city: 'Yaoundé', neighborhood: 'Biyem-Assi', lat: 3.834, lng: 11.487 },
  { city: 'Douala', neighborhood: 'Akwa', lat: 4.051, lng: 9.704 },
  { city: 'Douala', neighborhood: 'Bonanjo', lat: 4.043, lng: 9.688 },
  { city: 'Douala', neighborhood: 'Bonamoussadi', lat: 4.085, lng: 9.734 },
  { city: 'Douala', neighborhood: 'Deido', lat: 4.062, lng: 9.715 },
  { city: 'Buea', neighborhood: 'Molyko (Univ)', lat: 4.156, lng: 9.288 },
  { city: 'Dschang', neighborhood: 'Centre / Univ', lat: 5.448, lng: 10.053 },
  { city: 'Bafoussam', neighborhood: 'Centre-ville', lat: 5.477, lng: 10.418 },
  { city: 'Kribi', neighborhood: 'Plage & Centre', lat: 2.939, lng: 9.911 },
]

export function LocationPicker({
  latitude,
  longitude,
  city,
  neighborhood,
  onChange,
  label = 'Localisation géographique (GPS)'
}: LocationPickerProps) {
  const [lat, setLat] = useState<string>(latitude ? String(latitude) : '')
  const [lng, setLng] = useState<string>(longitude ? String(longitude) : '')
  const [isLocating, setIsLocating] = useState(false)

  useEffect(() => {
    setLat(latitude ? String(latitude) : '')
    setLng(longitude ? String(longitude) : '')
  }, [latitude, longitude])

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toastError('La géolocalisation n\'est pas supportée par votre navigateur.')
      return
    }

    setIsLocating(true)
    toastInfo('Recherche de votre position GPS...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
        const newLat = position.coords.latitude.toFixed(6)
        const newLng = position.coords.longitude.toFixed(6)
        setLat(newLat)
        setLng(newLng)
        onChange({ latitude: newLat, longitude: newLng, city, neighborhood })
        toastSuccess('Position GPS détectée avec succès ! 📍')
      },
      (error) => {
        setIsLocating(false)
        let msg = 'Impossible d\'accéder à votre position GPS.'
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Autorisation GPS refusée. Vous pouvez sélectionner un quartier ci-dessous.'
        } else if (error.code === error.TIMEOUT) {
          msg = 'Délai d\'attente GPS dépassé. Veuillez choisir un quartier prédéfini.'
        }
        toastError('Géolocalisation', msg)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  const handleSelectPreset = (preset: typeof CAMEROON_PRESETS[0]) => {
    const newLat = String(preset.lat)
    const newLng = String(preset.lng)
    setLat(newLat)
    setLng(newLng)
    onChange({
      latitude: newLat,
      longitude: newLng,
      city: preset.city,
      neighborhood: preset.neighborhood
    })
    toastSuccess(`Coordonnées définies : ${preset.city} (${preset.neighborhood})`)
  }

  const handleManualChange = (newLat: string, newLng: string) => {
    setLat(newLat)
    setLng(newLng)
    onChange({ latitude: newLat, longitude: newLng, city, neighborhood })
  }

  const currentLatNum = Number(lat) || (city === 'Douala' ? 4.051 : 3.868)
  const currentLngNum = Number(lng) || (city === 'Douala' ? 9.704 : 11.521)

  const mapMarker: MapMarkerItem[] = lat && lng ? [{
    id: 'current-pos',
    title: neighborhood ? `${neighborhood} (${city || 'Cameroun'})` : 'Position sélectionnée',
    type: 'housing',
    latitude: Number(lat),
    longitude: Number(lng),
    subtitle: `Lat: ${lat}, Lng: ${lng}`,
  }] : []

  return (
    <div className="space-y-3 p-4 rounded-2xl bg-card border border-border/80 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="font-bold text-foreground flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-emerald-400" /> {label}
        </label>
        <Button
          type="button"
          size="sm"
          onClick={handleGeolocate}
          disabled={isLocating}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-8 gap-1.5"
        >
          <Navigation className={cn("w-3.5 h-3.5", isLocating && "animate-spin")} />
          {isLocating ? 'Détection en cours...' : 'Me géolocaliser (GPS) 📍'}
        </Button>
      </div>

      {/* Manual Coordinates */}
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Latitude"
          type="number"
          step="any"
          placeholder="Ex: 3.868000"
          value={lat}
          onChange={e => handleManualChange(e.target.value, lng)}
        />
        <Input
          label="Longitude"
          type="number"
          step="any"
          placeholder="Ex: 11.521000"
          value={lng}
          onChange={e => handleManualChange(lat, e.target.value)}
        />
      </div>

      {/* Cameroon Quick Presets */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
          <Compass className="w-3 h-3 text-primary" /> Raccourcis quartiers populaires au Cameroun :
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CAMEROON_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all border",
                (lat === String(p.lat) && lng === String(p.lng))
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                  : "bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {p.city} - {p.neighborhood}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Map Preview */}
      {lat && lng && (
        <div className="pt-2">
          <LeafletMap
            markers={mapMarker}
            center={[currentLatNum, currentLngNum]}
            zoom={14}
            height="180px"
          />
        </div>
      )}
    </div>
  )
}
