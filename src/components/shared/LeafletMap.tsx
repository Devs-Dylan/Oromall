import React, { useEffect, useRef } from 'react'
import L from 'leaflet'

export interface MapMarkerItem {
  id: string
  title: string
  type: 'shop' | 'housing'
  latitude: number
  longitude: number
  price?: string
  subtitle?: string
  image_url?: string
  link_url?: string
}

interface LeafletMapProps {
  markers: MapMarkerItem[]
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
  onMarkerClick?: (marker: MapMarkerItem) => void
}

export default function LeafletMap({
  markers,
  center = [3.868, 11.521], // Default Yaoundé
  zoom = 12,
  height = '400px',
  className = '',
  onMarkerClick
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletInstance = useRef<L.Map | null>(null)
  const markerGroupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize Map if not initialized
    if (!leafletInstance.current) {
      const map = L.map(mapRef.current).setView(center, zoom)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map)

      markerGroupRef.current = L.layerGroup().addTo(map)
      leafletInstance.current = map
    }

    const map = leafletInstance.current
    const markerGroup = markerGroupRef.current

    if (markerGroup) {
      markerGroup.clearLayers()
    }

    if (markers.length > 0 && map && markerGroup) {
      const bounds = L.latLngBounds([])

      markers.forEach(m => {
        if (!m.latitude || !m.longitude) return

        const isShop = m.type === 'shop'
        const colorClass = isShop ? '#f97316' : '#10b981'
        const iconSymbol = isShop ? '🏪' : '🏠'

        // Custom HTML Marker Icon
        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div style="
              background-color: ${colorClass};
              color: white;
              padding: 4px 8px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: bold;
              display: flex;
              align-items: center;
              gap: 4px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              border: 2px solid white;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span>${iconSymbol}</span>
              <span>${m.price || m.title}</span>
            </div>
          `,
          iconSize: [110, 30],
          iconAnchor: [55, 15]
        })

        const marker = L.marker([m.latitude, m.longitude], { icon: customIcon })

        // Popup HTML
        const popupContent = `
          <div style="font-family: system-ui, sans-serif; max-width: 200px; padding: 4px;">
            ${m.image_url ? `<img src="${m.image_url}" alt="${m.title}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 8px; margin-bottom: 6px;"/>` : ''}
            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #111;">${m.title}</h4>
            ${m.subtitle ? `<p style="margin: 0 0 6px 0; font-size: 12px; color: #666;">${m.subtitle}</p>` : ''}
            ${m.price ? `<p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: ${colorClass};">${m.price}</p>` : ''}
            ${m.link_url ? `<a href="${m.link_url}" style="display: block; text-align: center; background: ${colorClass}; color: white; padding: 6px 12px; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: bold;">Voir la fiche</a>` : ''}
          </div>
        `

        marker.bindPopup(popupContent)

        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(m))
        }

        markerGroup.addLayer(marker)
        bounds.extend([m.latitude, m.longitude])
      })

      if (markers.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      } else if (markers.length === 1) {
        map.setView([markers[0].latitude, markers[0].longitude], 14)
      }
    }
  }, [markers, center, zoom])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (leafletInstance.current) {
        leafletInstance.current.remove()
        leafletInstance.current = null
      }
    }
  }, [])

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className={`w-full rounded-2xl overflow-hidden border border-border shadow-md z-0 relative ${className}`}
    />
  )
}
