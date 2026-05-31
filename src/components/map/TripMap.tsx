'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import greatCircle from '@turf/great-circle';
import { point } from '@turf/helpers';
import type { Feature, LineString, Point } from 'geojson';
import { firstFlightLine, positionAlongLine } from '@/lib/tripMapAnimation';
import { MapFloatingControls } from './MapFloatingControls';

export type TripMapStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  day: number;
  type: 'city' | 'activity' | 'hotel';
  photo?: string;
  category?: 'attraction' | 'hotel' | 'restaurant' | 'activity';
};

export type TripMapItinerary = {
  stops: TripMapStop[];
};

interface TripMapProps {
  itinerary: TripMapItinerary;
  selectedStopId?: string | null;
  selectedDay?: number | null;
  onStopClick?: (id: string) => void;
  fullBleed?: boolean;
}

type SegmentKind = 'flight' | 'transfer' | 'local';

type MarkerRecord = {
  stop: TripMapStop;
  marker: mapboxgl.Marker;
  element: HTMLElement;
  labelEl: HTMLElement | null;
};

const ROUTE_LAYERS = ['route-flight', 'route-transfer', 'route-local'] as const;
const ROUTE_SOURCES = ['route-flight', 'route-transfer', 'route-local'] as const;
const POI_SOURCE = 'trip-poi';
const POI_LAYER = 'trip-poi-symbols';

function haversineKm(a: TripMapStop, b: TripMapStop): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function segmentKind(distanceKm: number): SegmentKind {
  if (distanceKm > 500) return 'flight';
  if (distanceKm >= 50) return 'transfer';
  return 'local';
}

function lineFeature(coords: [number, number][]): Feature<LineString> {
  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'LineString', coordinates: coords },
  };
}

function buildSegmentFeatures(stops: TripMapStop[]) {
  const grouped: Record<SegmentKind, Feature<LineString>[]> = {
    flight: [],
    transfer: [],
    local: [],
  };

  for (let i = 0; i < stops.length - 1; i++) {
    const from = stops[i];
    const to = stops[i + 1];
    const kind = segmentKind(haversineKm(from, to));

    if (kind === 'flight') {
      const arc = greatCircle(
        point([from.lng, from.lat]),
        point([to.lng, to.lat]),
        { npoints: 64 }
      );
      if (arc?.geometry?.type === 'LineString') {
        grouped.flight.push(arc as Feature<LineString>);
      } else {
        grouped.flight.push(
          lineFeature([
            [from.lng, from.lat],
            [to.lng, to.lat],
          ])
        );
      }
    } else {
      grouped[kind].push(
        lineFeature([
          [from.lng, from.lat],
          [to.lng, to.lat],
        ])
      );
    }
  }

  return grouped;
}

function poiIcon(category?: TripMapStop['category'], type?: TripMapStop['type']): string {
  if (type === 'hotel' || category === 'hotel') return '🏨';
  if (category === 'restaurant') return '🍽';
  if (category === 'activity') return '☕';
  return '📍';
}

function createPhotoMarkerElement(
  stop: TripMapStop,
  selected: boolean,
  onClick?: () => void
): HTMLElement {
  const wrap = document.createElement('button');
  wrap.type = 'button';
  wrap.title = stop.name;
  wrap.className = 'trip-photo-marker';
  wrap.style.cssText =
    'background:none;border:none;padding:0;cursor:pointer;transform-origin:center bottom;';
  wrap.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick?.();
  });

  const scale = selected ? 1.15 : 1;
  wrap.style.transform = `scale(${scale})`;
  wrap.style.animation = 'trip-marker-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

  const outer = document.createElement('div');
  outer.style.cssText =
    'position:relative;width:48px;height:48px;border-radius:9999px;border:2px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.25);overflow:hidden;' +
    (selected ? 'box-shadow:0 0 0 3px #fbbf24, 0 4px 14px rgba(0,0,0,.25);' : '');

  if (stop.photo) {
    const img = document.createElement('img');
    img.src = stop.photo;
    img.alt = stop.name;
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
    outer.appendChild(img);
  } else {
    outer.style.background = '#111';
    outer.style.display = 'flex';
    outer.style.alignItems = 'center';
    outer.style.justifyContent = 'center';
    outer.style.color = '#fff';
    outer.style.fontWeight = '700';
    outer.textContent = String(stop.day);
  }

  const badge = document.createElement('span');
  badge.textContent = String(stop.day);
  badge.style.cssText =
    'position:absolute;top:-4px;right:-4px;width:20px;height:20px;border-radius:9999px;background:#000;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;';

  outer.appendChild(badge);
  wrap.appendChild(outer);
  return wrap;
}

function createPoiMarkerElement(
  stop: TripMapStop,
  selected: boolean,
  zoom: number,
  onClick?: () => void
): { el: HTMLElement; labelEl: HTMLElement | null } {
  const wrap = document.createElement('button');
  wrap.type = 'button';
  wrap.title = stop.name;
  wrap.style.cssText =
    'background:none;border:none;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;transform-origin:center bottom;';
  wrap.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick?.();
  });

  const scale = selected ? 1.2 : 1;
  wrap.style.transform = `scale(${scale})`;

  const pin = document.createElement('div');
  pin.style.cssText = [
    'width:28px;height:28px;border-radius:9999px',
    stop.type === 'hotel' ? 'background:#2563eb' : 'background:#f97316',
    'color:#fff;display:flex;align-items:center;justify-content:center',
    'font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.2)',
    selected ? 'box-shadow:0 0 0 3px #fbbf24' : '',
  ].join(';');
  pin.textContent = poiIcon(stop.category, stop.type);
  wrap.appendChild(pin);

  let labelEl: HTMLElement | null = null;
  if (zoom > 12) {
    labelEl = document.createElement('span');
    labelEl.textContent = stop.name;
    labelEl.style.cssText =
      'margin-top:4px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:600;color:#0f172a;text-shadow:0 1px 2px #fff;';
    wrap.appendChild(labelEl);
  }

  return { el: wrap, labelEl };
}

function buildPoiFeatures(stops: TripMapStop[]): Feature<Point>[] {
  return stops
    .filter((s) => s.type !== 'city')
    .map((stop) => ({
      type: 'Feature' as const,
      properties: {
        id: stop.id,
        type: stop.type === 'hotel' ? 'hotel' : stop.category ?? 'activity',
        icon: poiIcon(stop.category, stop.type),
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [stop.lng, stop.lat],
      },
    }));
}

function applyZoomVisibility(markers: MarkerRecord[], zoom: number) {
  for (const record of markers) {
    const { stop, element } = record;
    if (stop.type === 'city') {
      element.style.display = 'flex';
      continue;
    }
    element.style.display = zoom >= 10 ? 'flex' : 'none';
  }
}

function syncRouteLayerVisibility(map: mapboxgl.Map, zoom: number) {
  if (map.getLayer('route-flight')) {
    map.setLayoutProperty('route-flight', 'visibility', 'visible');
  }
  if (map.getLayer('route-transfer')) {
    map.setLayoutProperty('route-transfer', 'visibility', zoom >= 4 ? 'visible' : 'none');
  }
  if (map.getLayer('route-local')) {
    map.setLayoutProperty('route-local', 'visibility', zoom > 10 ? 'visible' : 'none');
  }
  if (map.getLayer(POI_LAYER)) {
    map.setLayoutProperty(POI_LAYER, 'visibility', zoom >= 10 ? 'visible' : 'none');
  }
}

function hideBasePoiLabels(map: mapboxgl.Map) {
  const style = map.getStyle();
  if (!style?.layers) return;
  for (const layer of style.layers) {
    if (layer.type !== 'symbol') continue;
    const id = layer.id.toLowerCase();
    if (id.includes('poi') || id.includes('place-label')) {
      try {
        map.setLayerZoomRange(layer.id, 12, 24);
      } catch {
        /* layer may not support zoom range */
      }
    }
  }
}

function removeRouteLayers(map: mapboxgl.Map) {
  for (const id of ROUTE_LAYERS) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  for (const id of ROUTE_SOURCES) {
    if (map.getSource(id)) map.removeSource(id);
  }
  if (map.getLayer(POI_LAYER)) map.removeLayer(POI_LAYER);
  if (map.getSource(POI_SOURCE)) map.removeSource(POI_SOURCE);
}

function addRouteLayers(map: mapboxgl.Map, stops: TripMapStop[]) {
  removeRouteLayers(map);
  const grouped = buildSegmentFeatures(stops);
  if (stops.length < 2) return grouped;
  const specs: Array<{ id: SegmentKind; paint: mapboxgl.LinePaint }> = [
    {
      id: 'flight',
      paint: {
        'line-color': '#000000',
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    },
    {
      id: 'transfer',
      paint: {
        'line-color': '#94a3b8',
        'line-width': 2,
      },
    },
    {
      id: 'local',
      paint: {
        'line-color': '#3b82f6',
        'line-width': 1.5,
      },
    },
  ];

  for (const spec of specs) {
    const sourceId = `route-${spec.id}`;
    map.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: grouped[spec.id] },
    });
    map.addLayer({
      id: sourceId,
      type: 'line',
      source: sourceId,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: spec.paint,
    });
  }

  const poiFeatures = buildPoiFeatures(stops);
  if (poiFeatures.length > 0) {
    map.addSource(POI_SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: poiFeatures },
    });
    map.addLayer({
      id: POI_LAYER,
      type: 'symbol',
      source: POI_SOURCE,
      minzoom: 10,
      layout: {
        'text-field': ['get', 'icon'],
        'text-size': 16,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      filter: ['any',
        ['==', ['get', 'type'], 'hotel'],
        ['==', ['get', 'type'], 'restaurant'],
        ['==', ['get', 'type'], 'activity'],
      ],
    });
  }

  return grouped;
}

export function TripMap({
  itinerary,
  selectedStopId = null,
  selectedDay = null,
  onStopClick,
  fullBleed = true,
}: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<MarkerRecord[]>([]);
  const planeMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const planeElRef = useRef<HTMLDivElement | null>(null);
  const flightCoordsRef = useRef<[number, number][] | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const dashPhaseRef = useRef(0);
  const planeProgressRef = useRef(0);
  const playingRef = useRef(true);
  const onStopClickRef = useRef(onStopClick);
  onStopClickRef.current = onStopClick;

  const [playing, setPlaying] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const stops = itinerary.stops;
  const stopsKey = useMemo(
    () => stops.map((s) => `${s.id}:${s.lat}:${s.lng}:${s.type}:${s.day}:${s.photo ?? ''}`).join('|'),
    [stops]
  );

  const tickAnimation = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    dashPhaseRef.current = (dashPhaseRef.current + 0.04) % 4;
    if (map.getLayer('route-flight')) {
      const phase = dashPhaseRef.current;
      map.setPaintProperty('route-flight', 'line-dasharray', [
        2 + Math.sin(phase) * 0.5,
        2 - Math.sin(phase) * 0.5,
      ]);
    }

    if (playingRef.current && flightCoordsRef.current && planeElRef.current) {
      planeProgressRef.current = (planeProgressRef.current + 0.0015) % 1;
      const pos = positionAlongLine(flightCoordsRef.current, planeProgressRef.current);
      planeMarkerRef.current?.setLngLat([pos.lng, pos.lat]);
      planeElRef.current.style.transform = `rotate(${pos.rotation - 90}deg)`;
    }

    animFrameRef.current = requestAnimationFrame(tickAnimation);
  }, []);

  const startAnimation = useCallback(() => {
    if (animFrameRef.current != null) return;
    animFrameRef.current = requestAnimationFrame(tickAnimation);
  }, [tickAnimation]);

  const stopAnimationLoop = useCallback(() => {
    if (animFrameRef.current != null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    if (!containerRef.current || !token) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [0, 20],
      zoom: 2,
    });
    mapRef.current = map;

    map.on('load', () => hideBasePoiLabels(map));

    return () => {
      stopAnimationLoop();
      for (const record of markersRef.current) {
        record.marker.remove();
      }
      markersRef.current = [];
      planeMarkerRef.current?.remove();
      planeMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [token, stopAnimationLoop]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !token || stops.length === 0) return;

    const render = () => {
      for (const record of markersRef.current) {
        record.marker.remove();
      }
      markersRef.current = [];
      planeMarkerRef.current?.remove();
      planeMarkerRef.current = null;

      const zoom = map.getZoom();
      const grouped = addRouteLayers(map, stops);
      syncRouteLayerVisibility(map, zoom);

      flightCoordsRef.current = firstFlightLine(grouped.flight);
      if (flightCoordsRef.current) {
        const planeEl = document.createElement('div');
        planeEl.textContent = '✈️';
        planeEl.style.cssText =
          'font-size:22px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3));transform-origin:center center;';
        planeElRef.current = planeEl;
        const mid = positionAlongLine(flightCoordsRef.current, 0.5);
        planeMarkerRef.current = new mapboxgl.Marker({ element: planeEl, anchor: 'center' })
          .setLngLat([mid.lng, mid.lat])
          .addTo(map);
      }

      for (const stop of stops) {
        const selected = stop.id === selectedStopId;
        const onClick = () => onStopClickRef.current?.(stop.id);

        if (stop.type === 'city') {
          const el = createPhotoMarkerElement(stop, selected, onClick);
          const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([stop.lng, stop.lat])
            .addTo(map);
          markersRef.current.push({ stop, marker, element: el, labelEl: null });
        } else {
          const { el, labelEl } = createPoiMarkerElement(stop, selected, zoom, onClick);
          const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
            .setLngLat([stop.lng, stop.lat])
            .addTo(map);
          markersRef.current.push({ stop, marker, element: el, labelEl });
        }
      }

      applyZoomVisibility(markersRef.current, zoom);
      startAnimation();
    };

    if (map.isStyleLoaded()) {
      render();
    } else {
      map.once('load', render);
    }

    const onZoom = () => {
      const z = map.getZoom();
      applyZoomVisibility(markersRef.current, z);
      syncRouteLayerVisibility(map, z);
      for (const record of markersRef.current) {
        const selected = record.stop.id === selectedStopId;
        record.element.style.transform = `scale(${selected ? (record.stop.type === 'city' ? 1.15 : 1.2) : 1})`;
        if (record.labelEl) {
          record.labelEl.style.display = z > 12 ? 'block' : 'none';
        }
      }
    };

    map.on('zoom', onZoom);
    return () => {
      map.off('zoom', onZoom);
      stopAnimationLoop();
    };
  }, [stops, stopsKey, token, selectedStopId, startAnimation, stopAnimationLoop]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || stops.length === 0) return;

    const run = () => {
      if (selectedStopId) {
        const stop = stops.find((s) => s.id === selectedStopId);
        if (stop) {
          map.flyTo({
            center: [stop.lng, stop.lat],
            zoom: 13,
            duration: 1200,
            essential: true,
          });
          return;
        }
      }

      if (selectedDay != null) {
        const dayStops = stops.filter((s) => s.day === selectedDay);
        if (dayStops.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          dayStops.forEach((s) => bounds.extend([s.lng, s.lat]));
          map.fitBounds(bounds, { padding: 80, duration: 1200, maxZoom: 12 });
          return;
        }
      }

      const bounds = new mapboxgl.LngLatBounds();
      stops.forEach((s) => bounds.extend([s.lng, s.lat]));
      map.fitBounds(bounds, { padding: 60, duration: 1200, maxZoom: 6 });
    };

    if (map.isStyleLoaded()) run();
    else map.once('load', run);
  }, [selectedStopId, selectedDay, stops, stopsKey]);

  const handleExpand = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      void el.requestFullscreen?.();
      setExpanded(true);
    } else {
      void document.exitFullscreen?.();
      setExpanded(false);
    }
  }, []);

  useEffect(() => {
    const onFs = () => setExpanded(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  if (!token) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
        Manjka NEXT_PUBLIC_MAPBOX_TOKEN
      </div>
    );
  }

  if (stops.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
        Ni koordinat za prikaz poti
      </div>
    );
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${fullBleed ? '' : 'rounded-2xl shadow-lg'} ${expanded ? 'bg-black' : ''}`}
    >
      <style>{`
        @keyframes trip-marker-pop {
          0% { transform: scale(0); opacity: 0; }
          70% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <MapFloatingControls
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
        onExpand={handleExpand}
      />
    </div>
  );
}

export type { TripMapItinerary as TripMapItineraryInput };
