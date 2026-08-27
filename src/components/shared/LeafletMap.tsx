import React, { useEffect, useRef } from 'react'
import L from 'leaflet'

export interface MapMarkerItem {
  id: string
  title: string
  type: 'shop' | 'housing' | 'landmark' | 'reference'
  latitude: number
  longitude: number
  price?: string
  subtitle?: string
  image_url?: string
  link_url?: string
  distanceKm?: number
}

interface LeafletMapProps {
  markers: MapMarkerItem[]
  referencePoint?: { latitude: number; longitude: number; label: string; website?: string } | null
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
  onMarkerClick?: (marker: MapMarkerItem) => void
  onMapClick?: (lat: number, lng: number) => void
}

export default function LeafletMap({
  markers,
  referencePoint,
  center = [3.868, 11.521], // Default Yaoundé
  zoom = 12,
  height = '480px',
  className = '',
  onMarkerClick,
  onMapClick,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletInstance = useRef<L.Map | null>(null)
  const markerGroupRef = useRef<L.LayerGroup | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize Map if not initialized
    if (!leafletInstance.current) {
      const map = L.map(mapRef.current).setView(center, zoom)

      // Utilisation des tuiles CartoDB Voyager ultra-rapides et légères
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 2
      }).addTo(map)

      markerGroupRef.current = L.layerGroup().addTo(map)
      leafletInstance.current = map

      // Map Click Event
      map.on('click', (e: L.LeafletMouseEvent) => {
        if (onMapClick) {
          onMapClick(Number(e.latlng.lat.toFixed(5)), Number(e.latlng.lng.toFixed(5)))
        }
      })

      setTimeout(() => map.invalidateSize(), 200)
    } else {
      leafletInstance.current.invalidateSize()
    }

    const map = leafletInstance.current
    const markerGroup = markerGroupRef.current

    if (markerGroup) {
      markerGroup.clearLayers()
    }

    if (map && markerGroup) {
      const bounds = L.latLngBounds([])

      // 1. Render Reference Point Marker (🎯 Point de repère sélectionné par l'utilisateur)
      if (referencePoint && referencePoint.latitude && referencePoint.longitude) {
        const refIcon = L.divIcon({
          className: 'reference-point-marker',
          html: `
            <div style="
              background: linear-gradient(135deg, #f59e0b, #d97706);
              color: #000;
              padding: 6px 12px;
              border-radius: 24px;
              font-size: 11px;
              font-weight: 900;
              display: flex;
              align-items: center;
              gap: 5px;
              box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.4), 0 4px 14px rgba(0,0,0,0.4);
              border: 2px solid white;
              white-space: nowrap;
              cursor: grab;
            ">
              <span>🎯</span>
              <span>${referencePoint.label || 'Point de Repère'}</span>
            </div>
          `,
          iconSize: [140, 34],
          iconAnchor: [70, 17]
        })

        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${referencePoint.latitude},${referencePoint.longitude}`
        const osmUrl = `https://www.openstreetmap.org/?mlat=${referencePoint.latitude}&mlon=${referencePoint.longitude}#map=16/${referencePoint.latitude}/${referencePoint.longitude}`

        const refMarker = L.marker([referencePoint.latitude, referencePoint.longitude], { icon: refIcon })
        refMarker.bindPopup(`
          <div style="font-family: system-ui, sans-serif; padding: 6px; text-align: center; max-width: 240px;">
            <p style="margin: 0; font-weight: 900; font-size: 13px; color: #b45309;">🎯 Point de Repère Actif</p>
            <p style="margin: 4px 0 2px 0; font-weight: 700; font-size: 12px; color: #111;">${referencePoint.label}</p>
            <p style="margin: 0 0 6px 0; font-size: 10px; color: #666;">GPS Réel : ${referencePoint.latitude}, ${referencePoint.longitude}</p>
            
            ${referencePoint.website ? `<a href="${referencePoint.website}" target="_blank" rel="noopener noreferrer" style="display: block; margin-bottom: 6px; color: #2563eb; font-size: 11px; text-decoration: underline; font-weight: bold;">🌐 Site Officiel (${referencePoint.website.replace('https://', '')})</a>` : ''}

            <div style="display: flex; flex-direction: column; gap: 4px; margin-top: 6px;">
              <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: block; background: #ea4335; color: white; padding: 5px 10px; border-radius: 6px; text-decoration: none; font-size: 11px; font-weight: bold;">🗺️ Vérifier sur Google Maps</a>
              <a href="${osmUrl}" target="_blank" rel="noopener noreferrer" style="display: block; background: #7092BF; color: white; padding: 4px 10px; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: bold;">🌐 Ouvrir OpenStreetMap</a>
            </div>
          </div>
        `)
        markerGroup.addLayer(refMarker)
        bounds.extend([referencePoint.latitude, referencePoint.longitude])
      }

      // 2. Render all Housing and Shop markers
      markers.forEach(m => {
        if (!m.latitude || !m.longitude) return

        const isShop = m.type === 'shop'
        const colorClass = isShop ? '#d97706' : '#10b981'
        const iconSymbol = isShop ? '🏬' : '🏠'

        // Custom HTML Marker Icon
        const customIcon = L.divIcon({
          className: 'custom-leaflet-marker',
          html: `
            <div style="
              background-color: ${colorClass};
              color: white;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 800;
              display: flex;
              align-items: center;
              gap: 5px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.3);
              border: 2px solid white;
              white-space: nowrap;
              cursor: pointer;
            ">
              <span>${iconSymbol}</span>
              <span>${m.price || m.title}</span>
              ${m.distanceKm !== undefined ? `<span style="background: rgba(0,0,0,0.35); padding: 1px 5px; border-radius: 10px; font-size: 9px;">${m.distanceKm} km</span>` : ''}
            </div>
          `,
          iconSize: [120, 30],
          iconAnchor: [60, 15]
        })

        const marker = L.marker([m.latitude, m.longitude], { icon: customIcon })

        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${m.latitude},${m.longitude}`

        // Popup HTML
        const popupContent = `
          <div style="font-family: system-ui, sans-serif; max-width: 230px; padding: 4px;">
            ${m.image_url ? `<img src="${m.image_url}" alt="${m.title}" style="width: 100%; height: 95px; object-fit: cover; border-radius: 8px; margin-bottom: 6px;"/>` : ''}
            <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #111;">${m.title}</h4>
            ${m.subtitle ? `<p style="margin: 0 0 6px 0; font-size: 11px; color: #555; line-height: 1.3;">${m.subtitle}</p>` : ''}
            ${m.distanceKm !== undefined ? `<p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 700; color: #d97706;">📍 Distance : ${m.distanceKm} km (~${Math.round(m.distanceKm * 12)} min à pied)</p>` : ''}
            ${m.price ? `<p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: ${colorClass};">${m.price}</p>` : ''}
            
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${m.link_url && m.link_url !== '#' ? `<a href="${m.link_url}" style="display: block; text-align: center; background: ${colorClass}; color: white; padding: 6px 12px; border-radius: 8px; text-decoration: none; font-size: 11px; font-weight: 800;">Consulter la fiche</a>` : ''}
              <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: block; text-align: center; background: #f1f5f9; color: #334155; padding: 4px 8px; border-radius: 6px; text-decoration: none; font-size: 10px; font-weight: bold; border: 1px solid #cbd5e1;">🗺️ Voir sur Google Maps</a>
            </div>
          </div>
        `

        marker.bindPopup(popupContent)

        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(m))
        }

        markerGroup.addLayer(marker)
        bounds.extend([m.latitude, m.longitude])
      })

      if (bounds.isValid()) {
        if (markers.length > 1 || (referencePoint && markers.length >= 1)) {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
        } else if (markers.length === 1) {
          map.setView([markers[0].latitude, markers[0].longitude], 14)
        } else if (referencePoint) {
          map.setView([referencePoint.latitude, referencePoint.longitude], 14)
        }
      }
    }
  }, [markers, referencePoint, center, zoom])

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
    <div className={`relative rounded-3xl overflow-hidden shadow-lg border border-border ${className}`}>
      <div ref={mapRef} style={{ height, width: '100%' }} />
    </div>
  )
}
