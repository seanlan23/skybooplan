'use client'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useRef } from 'react'
import {
  buildItineraryRouteSegments,
  segmentsToGeoJson,
  type ItineraryDayRouteInput,
  type RoutePoint,
  type RouteSegment,
} from '@/lib/mapTransportRoutes'
import type { TransportFromPrevious } from '@/types/itinerary.types'

const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''
if (token) {
  mapboxgl.accessToken = token
}

const AIRPORT_COORDS: Record<string, [number, number]> = {
  MXP: [8.7122, 45.6306],
  MIL: [9.19, 45.46],
  LIN: [9.278, 45.445],
  LJU: [14.4576, 46.2237],
  ZAG: [15.9367, 45.7429],
  VIE: [16.5698, 48.1103],
  FCO: [12.2389, 41.8003],
  CDG: [2.5479, 49.0097],
  AMS: [4.7683, 52.3086],
  FRA: [8.5622, 50.0333],
  BCN: [2.0785, 41.2971],
  MAD: [-3.5673, 40.4936],
  LON: [-0.1276, 51.5074],
  LHR: [-0.4543, 51.47],
  SGN: [106.652, 10.8185],
  HAN: [105.8044, 21.2187],
  DAD: [108.1993, 16.0439],
  BKK: [100.7501, 13.6811],
  MNL: [121.0197, 14.5086],
  DPS: [115.1667, -8.7482],
  KUL: [101.7099, 2.7456],
  SIN: [103.9915, 1.3644],
  CNX: [98.9629, 18.768],
  HKT: [98.3167, 8.1132],
  DXB: [55.3647, 25.2532],
  AUH: [54.6511, 24.433],
  NRT: [140.3864, 35.7647],
  SYD: [151.1772, -33.9399],
  JFK: [-73.7781, 40.6413],
  LAX: [-118.4085, 33.9425],
}

const DEFAULT_FROM: [number, number] = [15, 45]
const DEFAULT_TO: [number, number] = [100, 15]
const FIT_PADDING = 80
const FIT_DURATION = 1500
const FIT_MAX_ZOOM = 8
const SAME_CITY_LAT_OFFSET = 0.01
const ROUTE_SOURCE_ID = 'itinerary-routes'

export interface MapViewItineraryDay {
  dayNumber: number
  location: string
  transportFromPrevious?: TransportFromPrevious | null
}

export interface MapViewProps {
  fromCode: string
  toCode: string
  itineraryDays?: MapViewItineraryDay[]
  className?: string
}

function airportCoords(code: string): [number, number] | null {
  const key = code.trim().toUpperCase()
  return AIRPORT_COORDS[key] ?? null
}

function cityNameFromLocation(location: string): string {
  return location.split(',')[0]?.trim() ?? ''
}

async function geocodeCity(cityName: string): Promise<[number, number] | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?limit=1&access_token=${encodeURIComponent(token)}`
  const res = await fetch(url)
  const data = (await res.json()) as {
    features?: { geometry?: { coordinates?: [number, number] } }[]
  }
  return data.features?.[0]?.geometry?.coordinates ?? null
}

function waitForMapLoad(instance: mapboxgl.Map): Promise<void> {
  if (instance.loaded()) return Promise.resolve()
  return new Promise((resolve) => {
    instance.once('load', () => resolve())
  })
}

function fitMapToItinerary(
  instance: mapboxgl.Map,
  bounds: mapboxgl.LngLatBounds
): void {
  if (bounds.isEmpty()) return
  instance.fitBounds(bounds, {
    padding: FIT_PADDING,
    duration: FIT_DURATION,
    maxZoom: FIT_MAX_ZOOM,
  })
}

function removeRouteLayers(map: mapboxgl.Map): void {
  for (const layerId of [
    'routes-flight',
    'routes-ferry',
    'routes-car',
    'routes-bus',
    'route',
  ]) {
    if (map.getLayer(layerId)) map.removeLayer(layerId)
  }
  for (const sourceId of [ROUTE_SOURCE_ID, 'route']) {
    if (map.getSource(sourceId)) map.removeSource(sourceId)
  }
}

function applyRouteSegments(map: mapboxgl.Map, segments: RouteSegment[]): void {
  removeRouteLayers(map)
  if (segments.length === 0) return

  map.addSource(ROUTE_SOURCE_ID, {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: segmentsToGeoJson(segments),
    },
  })

  map.addLayer({
    id: 'routes-bus',
    type: 'line',
    source: ROUTE_SOURCE_ID,
    filter: ['==', ['get', 'transport'], 'bus'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#f59e0b',
      'line-width': 2,
      'line-opacity': 0.9,
    },
  })

  map.addLayer({
    id: 'routes-car',
    type: 'line',
    source: ROUTE_SOURCE_ID,
    filter: ['==', ['get', 'transport'], 'car'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#94a3b8',
      'line-width': 2,
      'line-opacity': 0.9,
    },
  })

  map.addLayer({
    id: 'routes-ferry',
    type: 'line',
    source: ROUTE_SOURCE_ID,
    filter: ['==', ['get', 'transport'], 'ferry'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#14b8a6',
      'line-width': 2,
      'line-opacity': 0.9,
      'line-dasharray': [2, 2],
    },
  })

  map.addLayer({
    id: 'routes-flight',
    type: 'line',
    source: ROUTE_SOURCE_ID,
    filter: ['==', ['get', 'transport'], 'flight'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': '#3b82f6',
      'line-width': 2,
      'line-opacity': 0.9,
      'line-dasharray': [2, 2],
    },
  })
}

function createTransportIconMarker(
  segment: RouteSegment
): mapboxgl.Marker {
  const el = document.createElement('div')
  el.title = segment.tooltip
  el.setAttribute('aria-label', segment.tooltip)
  el.style.cssText = `
    width:28px;height:28px;border-radius:50%;
    background:#fff;color:inherit;
    display:flex;align-items:center;justify-content:center;
    font-size:20px;line-height:1;
    box-shadow:0 2px 8px rgba(15,23,42,0.28);
    cursor:default;pointer-events:auto;
  `
  el.textContent = segment.emoji
  return new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(segment.midpoint)
}

export default function MapView({
  fromCode,
  toCode,
  itineraryDays = [],
  className,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const dayMarkers = useRef<mapboxgl.Marker[]>([])
  const transportMarkers = useRef<mapboxgl.Marker[]>([])
  const departureMarker = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current || !token) return

    const fromCoords = airportCoords(fromCode) ?? DEFAULT_FROM
    const toCoords = airportCoords(toCode) ?? DEFAULT_TO
    const centerLng = (fromCoords[0] + toCoords[0]) / 2
    const centerLat = (fromCoords[1] + toCoords[1]) / 2

    const instance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [centerLng, centerLat],
      zoom: 4,
      pitch: 0,
      bearing: 0,
      projection: 'mercator',
    })

    map.current = instance

    instance.on('load', () => {
      if (!map.current) return

      departureMarker.current = new mapboxgl.Marker({ color: '#6366f1' })
        .setLngLat(fromCoords)
        .setPopup(new mapboxgl.Popup().setText('Odhod'))
        .addTo(map.current)

      if (!itineraryDays.length) {
        const segments = buildItineraryRouteSegments(
          {
            coords: fromCoords,
            cityName: fromCode,
            kind: 'departure',
          },
          [],
          {
            coords: toCoords,
            cityName: toCode,
            kind: 'destination',
          }
        )
        applyRouteSegments(map.current, segments)
        transportMarkers.current = segments.map((seg) =>
          createTransportIconMarker(seg).addTo(map.current!)
        )
      }
    })

    return () => {
      dayMarkers.current.forEach((m) => m.remove())
      dayMarkers.current = []
      transportMarkers.current.forEach((m) => m.remove())
      transportMarkers.current = []
      departureMarker.current?.remove()
      departureMarker.current = null
      instance.remove()
      map.current = null
    }
  }, [fromCode, toCode])

  useEffect(() => {
    if (!map.current || !token) return
    if (!itineraryDays.length) return

    const mapInstance = map.current
    let cancelled = false

    dayMarkers.current.forEach((m) => m.remove())
    dayMarkers.current = []
    transportMarkers.current.forEach((m) => m.remove())
    transportMarkers.current = []

    const fromCoords = airportCoords(fromCode) ?? DEFAULT_FROM
    const toCoords = airportCoords(toCode) ?? DEFAULT_TO
    const bounds = new mapboxgl.LngLatBounds()
    bounds.extend(toCoords)

    const geocodeAndMark = async () => {
      await waitForMapLoad(mapInstance)
      if (cancelled || !map.current) return

      const geocodeCache = new Map<string, [number, number]>()
      const cityOccurrence = new Map<string, number>()
      const dayPoints: ItineraryDayRouteInput[] = []

      for (const day of itineraryDays) {
        const cityName = cityNameFromLocation(day.location ?? '')
        if (!cityName) continue

        let baseCoords = geocodeCache.get(cityName)
        if (!baseCoords) {
          try {
            const fetched = await geocodeCity(cityName)
            if (!fetched) continue
            baseCoords = fetched
            geocodeCache.set(cityName, baseCoords)
          } catch (e) {
            console.error('Geocoding failed for', cityName, e)
            continue
          }
        }

        const occurrence = cityOccurrence.get(cityName) ?? 0
        cityOccurrence.set(cityName, occurrence + 1)

        const markerCoords: [number, number] = [
          baseCoords[0],
          baseCoords[1] + occurrence * SAME_CITY_LAT_OFFSET,
        ]

        if (cancelled || !map.current) return

        dayPoints.push({
          dayNumber: day.dayNumber,
          coords: markerCoords,
          cityName: day.location?.trim() || cityName,
          transportFromPrevious: day.transportFromPrevious,
        })

        const el = document.createElement('div')
        el.style.cssText = `
          width:32px;height:32px;border-radius:50%;
          background:#3b82f6;color:white;font-weight:bold;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,0.3);
          cursor:pointer;
        `
        el.textContent = String(day.dayNumber)

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat(markerCoords)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(
              `<strong>Dan ${day.dayNumber}</strong><br/>${cityName}`
            )
          )
          .addTo(map.current)

        dayMarkers.current.push(marker)
        bounds.extend(markerCoords)
      }

      if (cancelled || !map.current) return

      const departure: RoutePoint = {
        coords: fromCoords,
        cityName: fromCode,
        kind: 'departure',
      }
      const destination: RoutePoint = {
        coords: toCoords,
        cityName: toCode,
        kind: 'destination',
      }

      const segments = buildItineraryRouteSegments(departure, dayPoints, destination)
      applyRouteSegments(map.current, segments)

      transportMarkers.current = segments.map((seg) =>
        createTransportIconMarker(seg).addTo(map.current!)
      )

      fitMapToItinerary(map.current, bounds)
    }

    void geocodeAndMark()

    return () => {
      cancelled = true
    }
  }, [itineraryDays, fromCode, toCode])

  if (!token) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: '100%',
          minHeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f1f5f9',
          color: '#64748b',
          fontSize: 14,
        }}
      >
        Mapbox token ni nastavljen.
      </div>
    )
  }

  return (
    <div
      ref={mapContainer}
      className={className}
      style={{ width: '100%', height: '100%', minHeight: 400 }}
    />
  )
}
