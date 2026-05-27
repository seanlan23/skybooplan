'use client'

import 'mapbox-gl/dist/mapbox-gl.css'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { Layer, Marker, Popup, Source } from 'react-map-gl/mapbox'
import type { MapRef } from 'react-map-gl/mapbox'
import mapboxgl, { LngLatBounds } from 'mapbox-gl'
import type { LineLayer } from 'mapbox-gl'
import {
  departureCenterFromLocations,
  locationsFromSelectedFlight,
} from '@/lib/mapFlightLocations'
import {
  buildFlightArc,
  coordAtProgress,
  countryBoundsAround,
  FLAT,
  FLIGHT_ANIMATION_MS,
  FIT_PADDING_FLIGHT,
  FIT_PADDING_MARKERS,
  lineFeature,
  MAP_PRIMARY,
  sliceLineToProgress,
} from '@/lib/mapCinematic/geo'
import {
  clearGeocodeCache,
  itineraryDaysKey,
  mergeItineraryDays,
  syncMarkersForDays,
} from '@/lib/mapCinematic/syncItineraryMarkers'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'
import { useCinematicMapStore } from '@/store/useCinematicMapStore'
import type { CinematicMapMarker } from '@/store/useCinematicMapStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import { cn } from '@/lib/utils'

const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

if (typeof window !== 'undefined' && mapboxToken) {
  mapboxgl.accessToken = mapboxToken
}

const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12' as const

export interface Location {
  name: string
  coordinates: [number, number]
}

export interface AnimatedMapProps {
  locations: Location[]
  selectedFlight?: SelectedFlightForAI | null
  className?: string
  pathDurationMs?: number
}

export const DEMO_THAILAND_LOCATIONS: Location[] = [
  { name: 'Bangkok', coordinates: [100.5018, 13.7563] },
  { name: 'Chiang Mai', coordinates: [98.9817, 18.7883] },
  { name: 'Phuket', coordinates: [98.3923, 7.8804] },
]

const FLIGHT_ARC_LAYER: LineLayer = {
  id: 'flight-arc',
  type: 'line',
  source: 'flight-arc',
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': MAP_PRIMARY,
    'line-width': 3,
    'line-opacity': 0.9,
  },
}

const FLIGHT_ARC_STATIC_LAYER: LineLayer = {
  id: 'flight-arc-static',
  type: 'line',
  source: 'flight-arc-static',
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': MAP_PRIMARY,
    'line-width': 2.5,
    'line-opacity': 0.45,
  },
}

const ITINERARY_ROUTE_LAYER: LineLayer = {
  id: 'itinerary-route',
  type: 'line',
  source: 'itinerary-route',
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: {
    'line-color': MAP_PRIMARY,
    'line-width': 3,
    'line-opacity': 0.55,
    'line-dasharray': [2, 2],
  },
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function computeInitialViewState(
  locations: Location[],
  departureCenter: [number, number] | null
) {
  if (departureCenter) {
    return {
      longitude: departureCenter[0],
      latitude: departureCenter[1],
      zoom: 5.5,
      ...FLAT,
    }
  }
  if (locations.length === 0) {
    return { longitude: 0, latitude: 20, zoom: 1.5, ...FLAT }
  }
  const [lng, lat] = locations[0].coordinates
  return { longitude: lng, latitude: lat, zoom: 5, ...FLAT }
}

function resolveEffectiveLocations(
  locations: Location[],
  selectedFlight: SelectedFlightForAI | null | undefined
): Location[] {
  const fromFlight =
    selectedFlight && selectedFlight.origin && selectedFlight.destination
      ? locationsFromSelectedFlight(selectedFlight)
      : []
  if (fromFlight.length >= 2) return fromFlight
  if (locations.length >= 2) return locations
  if (fromFlight.length === 1) return fromFlight
  if (locations.length > 0) return locations
  return DEMO_THAILAND_LOCATIONS
}

function NumberedMarker({
  dayNumber,
  onClick,
}: {
  dayNumber: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full',
        'border-2 border-white text-sm font-bold text-white shadow-lg',
        'transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400'
      )}
      style={{ backgroundColor: MAP_PRIMARY }}
      aria-label={`Dan ${dayNumber}`}
    >
      {dayNumber}
    </button>
  )
}

function DepartureMarker({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 pointer-events-none">
      <span className="text-lg leading-none drop-shadow-md" aria-hidden>
        ✈️
      </span>
      <span className="rounded-md bg-slate-700/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
        {label}
      </span>
    </div>
  )
}

export default function AnimatedMap({
  locations,
  selectedFlight = null,
  className,
}: AnimatedMapProps) {
  const mapRef = useRef<MapRef>(null)
  const flightFrameRef = useRef<number | null>(null)
  const geocodeAbortRef = useRef<AbortController | null>(null)
  const geocodeRunRef = useRef(0)
  const markerCacheRef = useRef(
    new globalThis.Map<number, CinematicMapMarker>()
  )
  const lastDaysKeyRef = useRef('')
  const countryZoomRef = useRef(5.5)

  const [mapReady, setMapReady] = useState(false)
  const [flightProgress, setFlightProgress] = useState(0)
  const [popupDay, setPopupDay] = useState<number | null>(null)

  const sessionId = useCinematicMapStore((s) => s.sessionId)
  const phase = useCinematicMapStore((s) => s.phase)
  const streamingDays = useCinematicMapStore((s) => s.streamingDays)
  const markers = useCinematicMapStore((s) => s.markers)
  const setPhase = useCinematicMapStore((s) => s.setPhase)
  const setMarkers = useCinematicMapStore((s) => s.setMarkers)

  const plannerItinerary = usePlannerStore((s) => s.itinerary)

  const itineraryDays = useMemo(
    () => mergeItineraryDays(streamingDays, plannerItinerary),
    [streamingDays, plannerItinerary]
  )

  const itineraryDaysKeyValue = useMemo(
    () => itineraryDaysKey(itineraryDays),
    [itineraryDays]
  )

  const effectiveLocations = useMemo(
    () => resolveEffectiveLocations(locations, selectedFlight),
    [locations, selectedFlight]
  )

  const departureCenter = useMemo(
    () => departureCenterFromLocations(effectiveLocations),
    [effectiveLocations]
  )

  const origin = effectiveLocations[0]
  const destination = effectiveLocations[1]

  const flightArc = useMemo(() => {
    if (!origin || !destination) return [] as [number, number][]
    return buildFlightArc(origin.coordinates, destination.coordinates)
  }, [origin, destination])

  const fullFlightArcGeoJson = useMemo(
    () => lineFeature(flightArc),
    [flightArc]
  )

  const animatedFlightGeoJson = useMemo(() => {
    const coords = sliceLineToProgress(flightArc, flightProgress)
    return lineFeature(coords)
  }, [flightArc, flightProgress])

  const planePosition = useMemo(
    () => coordAtProgress(flightArc, flightProgress),
    [flightArc, flightProgress]
  )

  const itineraryRouteGeoJson = useMemo(() => {
    const coords = markers.map((m) => m.coordinates)
    return lineFeature(coords)
  }, [markers])

  const initialViewState = useMemo(
    () => computeInitialViewState(effectiveLocations, departureCenter),
    [effectiveLocations, departureCenter]
  )

  const cancelFlightAnimation = useCallback(() => {
    if (flightFrameRef.current !== null) {
      cancelAnimationFrame(flightFrameRef.current)
      flightFrameRef.current = null
    }
  }, [])

  const fitAllMarkers = useCallback(() => {
    const map = mapRef.current
    if (!map) return

    const bounds = new LngLatBounds()
    if (origin) {
      bounds.extend(origin.coordinates)
    }
    for (const m of markers) {
      bounds.extend(m.coordinates)
    }
    if (bounds.isEmpty()) return

    map.fitBounds(bounds, {
      padding: FIT_PADDING_MARKERS,
      duration: 2200,
      maxZoom: 10,
      ...FLAT,
      essential: true,
    })
  }, [markers, origin])

  useEffect(() => {
    if (phase !== 'complete') return
    if (markers.length === 0) return
    if (itineraryDays.length > 0 && markers.length < itineraryDays.length) return
    fitAllMarkers()
  }, [phase, markers.length, itineraryDays.length, fitAllMarkers])

  const runFlightArcAnimation = useCallback(() => {
    cancelFlightAnimation()
    setFlightProgress(0)
    const start = performance.now()

    const tick = (now: number) => {
      const raw = Math.min(1, (now - start) / FLIGHT_ANIMATION_MS)
      setFlightProgress(easeInOutCubic(raw))
      if (raw < 1) {
        flightFrameRef.current = requestAnimationFrame(tick)
      } else {
        flightFrameRef.current = null
        setPhase('country')
      }
    }

    flightFrameRef.current = requestAnimationFrame(tick)
  }, [cancelFlightAnimation, setPhase])

  const runPhase2CountryZoom = useCallback(() => {
    const map = mapRef.current
    if (!map || !destination) {
      setPhase('itinerary')
      return
    }

    const bounds = countryBoundsAround(destination.coordinates)
    map.fitBounds(bounds, {
      padding: { top: 48, bottom: 48, left: 48, right: 48 },
      duration: 0,
      maxZoom: 7,
      ...FLAT,
    })
    const zoom = Math.min(6.2, Math.max(4.8, map.getZoom()))

    map.flyTo({
      center: destination.coordinates,
      zoom,
      speed: 0.8,
      curve: 1.5,
      ...FLAT,
      essential: true,
    })

    const mapInstance = map.getMap()
    const onDone = () => {
      mapInstance.off('moveend', onDone)
      countryZoomRef.current = map.getZoom()
      setPhase('itinerary')
    }
    mapInstance.once('moveend', onDone)
  }, [destination, setPhase])

  const runPhase1 = useCallback(() => {
    const map = mapRef.current
    if (!map || !origin || !destination) return

    setPhase('flight')
    setFlightProgress(0)
    setPopupDay(null)
    markerCacheRef.current = new globalThis.Map()
    setMarkers([])

    const bounds = new LngLatBounds()
    bounds.extend(origin.coordinates)
    bounds.extend(destination.coordinates)

    map.fitBounds(bounds, {
      padding: FIT_PADDING_FLIGHT,
      duration: 2000,
      maxZoom: 6,
      ...FLAT,
      essential: true,
    })

    const mapInstance = map.getMap()
    const onFitDone = () => {
      mapInstance.off('moveend', onFitDone)
      runFlightArcAnimation()
    }
    mapInstance.once('moveend', onFitDone)
  }, [origin, destination, runFlightArcAnimation, setPhase, setMarkers])

  useEffect(() => {
    if (!mapReady || sessionId === 0) return
    clearGeocodeCache()
    markerCacheRef.current = new globalThis.Map()
    lastDaysKeyRef.current = ''
    runPhase1()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nova seja ob sessionId
  }, [sessionId, mapReady])

  useEffect(() => {
    if (phase === 'country') {
      runPhase2CountryZoom()
    }
  }, [phase, runPhase2CountryZoom])

  /** Geokodiraj VSE dni iz planerja (pill lokacija na vsakem DayCard). */
  useEffect(() => {
    if (phase !== 'itinerary' && phase !== 'complete') return
    if (itineraryDays.length === 0) return

    const pendingCount = itineraryDays.length - markerCacheRef.current.size
    const keyUnchanged = itineraryDaysKeyValue === lastDaysKeyRef.current
    if (keyUnchanged && pendingCount <= 0) return

    lastDaysKeyRef.current = itineraryDaysKeyValue
    geocodeAbortRef.current?.abort()
    const ac = new AbortController()
    geocodeAbortRef.current = ac
    const runId = ++geocodeRunRef.current

    void syncMarkersForDays(
      itineraryDays,
      markerCacheRef.current,
      ac.signal,
      (nextMarkers) => {
        if (geocodeRunRef.current !== runId || ac.signal.aborted) return
        markerCacheRef.current = new globalThis.Map(
          nextMarkers.map((m) => [m.day, m])
        )
        setMarkers(nextMarkers)
      }
    ).then((finalMarkers) => {
      if (geocodeRunRef.current !== runId || ac.signal.aborted) return
      markerCacheRef.current = new globalThis.Map(
        finalMarkers.map((m) => [m.day, m])
      )
      setMarkers(finalMarkers)
    })

    return () => {
      ac.abort()
    }
  }, [itineraryDaysKeyValue, itineraryDays, phase, setMarkers])

  const handleMapLoad = useCallback(() => {
    mapRef.current?.getMap()?.resize()
    setMapReady(true)
  }, [])

  useEffect(() => {
    return () => {
      cancelFlightAnimation()
      geocodeAbortRef.current?.abort()
    }
  }, [cancelFlightAnimation])

  const showFlightArcAnimated = phase === 'flight' && flightArc.length >= 2
  const showFlightArcStatic =
    (phase === 'itinerary' || phase === 'complete') && flightArc.length >= 2
  const showPlane =
    phase === 'flight' && flightProgress > 0 && flightProgress < 1
  const showItineraryRoute =
    (phase === 'itinerary' || phase === 'complete') && markers.length >= 2
  const showDeparture =
    !!origin &&
    (phase === 'flight' ||
      phase === 'itinerary' ||
      phase === 'complete' ||
      phase === 'country')
  const mapInteractive = phase === 'itinerary' || phase === 'complete'

  const activePopupMarker = markers.find((m) => m.day === popupDay)

  return (
    <div
      className={cn(
        'animated-map-minimal relative w-full overflow-hidden rounded-2xl border border-slate-200',
        'shadow-md sticky top-4',
        'h-[min(56vh,520px)] min-h-[360px]',
        className
      )}
    >
      <div className="absolute inset-0 h-full w-full min-h-[360px]">
        <Map
          ref={mapRef}
          mapLib={mapboxgl}
          mapboxAccessToken={mapboxToken}
          mapStyle={MAP_STYLE}
          initialViewState={initialViewState}
          renderWorldCopies={false}
          style={{ width: '100%', height: '100%', minHeight: 360 }}
          attributionControl={false}
          interactive={mapInteractive}
          scrollZoom={mapInteractive}
          boxZoom={false}
          dragRotate={false}
          dragPan={mapInteractive}
          doubleClickZoom={false}
          touchZoomRotate={false}
          keyboard={false}
          onLoad={handleMapLoad}
          onClick={() => setPopupDay(null)}
        >
          {showFlightArcStatic && (
            <Source id="flight-arc-static" type="geojson" data={fullFlightArcGeoJson}>
              <Layer {...FLIGHT_ARC_STATIC_LAYER} />
            </Source>
          )}

          {showFlightArcAnimated && (
            <Source id="flight-arc" type="geojson" data={animatedFlightGeoJson}>
              <Layer {...FLIGHT_ARC_LAYER} />
            </Source>
          )}

          {showItineraryRoute && (
            <Source id="itinerary-route" type="geojson" data={itineraryRouteGeoJson}>
              <Layer {...ITINERARY_ROUTE_LAYER} />
            </Source>
          )}

          {showDeparture && (
            <Marker
              longitude={origin.coordinates[0]}
              latitude={origin.coordinates[1]}
              anchor="bottom"
            >
              <DepartureMarker label="Start" />
            </Marker>
          )}

          {destination &&
            phase !== 'itinerary' &&
            phase !== 'complete' &&
            phase !== 'country' && (
              <Marker
                longitude={destination.coordinates[0]}
                latitude={destination.coordinates[1]}
                anchor="center"
              >
                <span
                  className="block h-3 w-3 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: MAP_PRIMARY }}
                  aria-hidden
                />
              </Marker>
            )}

          {showPlane && (
            <Marker longitude={planePosition[0]} latitude={planePosition[1]} anchor="center">
              <span className="text-xl leading-none drop-shadow-md" aria-hidden>
                ✈️
              </span>
            </Marker>
          )}

          {(phase === 'itinerary' || phase === 'complete') &&
            markers.map((m) => (
              <Marker
                key={`day-${m.day}-${m.location}`}
                longitude={m.coordinates[0]}
                latitude={m.coordinates[1]}
                anchor="center"
              >
                <NumberedMarker
                  dayNumber={m.day}
                  onClick={() => setPopupDay(m.day)}
                />
              </Marker>
            ))}

          {activePopupMarker && (
            <Popup
              longitude={activePopupMarker.coordinates[0]}
              latitude={activePopupMarker.coordinates[1]}
              anchor="bottom"
              closeOnClick={false}
              onClose={() => setPopupDay(null)}
              className="[&_.mapboxgl-popup-content]:rounded-xl [&_.mapboxgl-popup-content]:p-3 [&_.mapboxgl-popup-content]:shadow-lg"
            >
              <div className="max-w-[220px]">
                <p className="text-xs font-semibold text-sky-600">
                  Dan {activePopupMarker.day}
                </p>
                <p className="text-sm font-bold text-slate-900">{activePopupMarker.title}</p>
                <p className="mt-0.5 text-xs text-sky-700">{activePopupMarker.location}</p>
                <p className="mt-1 text-xs text-slate-600 line-clamp-3">
                  {activePopupMarker.description}
                </p>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  )
}
