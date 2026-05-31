'use client';

import { useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import greatCircle from '@turf/great-circle';
import { point } from '@turf/helpers';
import type { Feature, LineString } from 'geojson';

export type TripMapStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  day: number;
  type: 'city' | 'activity' | 'hotel';
};

export type TripMapItinerary = {
  stops: TripMapStop[];
};

interface TripMapProps {
  itinerary: TripMapItinerary;
  selectedStopId?: string | null;
  selectedDay?: number | null;
  onStopClick?: (id: string) => void;
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
        { npoints: 72 }
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

function createMarkerElement(
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

  const scale = selected ? 1.3 : 1;
  wrap.style.transform = `scale(${scale})`;

  let labelEl: HTMLElement | null = null;

  if (stop.type === 'city') {
    const dot = document.createElement('div');
    dot.style.cssText = [
      'width:40px;height:40px;border-radius:9999px',
      'background:#111;color:#fff',
      'display:flex;align-items:center;justify-content:center',
      'font-weight:700;font-size:14px',
      'box-shadow:0 4px 14px rgba(0,0,0,.25)',
      selected ? 'box-shadow:0 0 0 4px #fbbf24, 0 4px 14px rgba(0,0,0,.25)' : '',
    ].join(';');
    dot.textContent = String(stop.day);
    wrap.appendChild(dot);
  } else if (stop.type === 'hotel') {
    const pin = document.createElement('div');
    pin.style.cssText = [
      'width:28px;height:28px;border-radius:9999px',
      'background:#2563eb;color:#fff',
      'display:flex;align-items:center;justify-content:center',
      'font-size:14px',
      'box-shadow:0 2px 8px rgba(37,99,235,.45)',
      selected ? 'box-shadow:0 0 0 3px #fbbf24, 0 2px 8px rgba(37,99,235,.45)' : '',
    ].join(';');
    pin.textContent = '🛏';
    wrap.appendChild(pin);
  } else {
    const pin = document.createElement('div');
    const size = zoom >= 4 && zoom <= 10 ? 10 : 22;
    pin.style.cssText = [
      `width:${size}px;height:${size}px;border-radius:9999px`,
      'background:#f97316',
      'box-shadow:0 2px 6px rgba(249,115,22,.45)',
      selected ? 'box-shadow:0 0 0 3px #fbbf24, 0 2px 6px rgba(249,115,22,.45)' : '',
    ].join(';');
    wrap.appendChild(pin);
  }

  if (zoom > 10) {
    labelEl = document.createElement('span');
    labelEl.textContent = stop.name;
    labelEl.style.cssText =
      'margin-top:4px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:600;color:#0f172a;text-shadow:0 1px 2px #fff;';
    wrap.appendChild(labelEl);
  }

  return { el: wrap, labelEl };
}

function applyZoomVisibility(markers: MarkerRecord[], zoom: number) {
  for (const record of markers) {
    const { stop, element } = record;
    if (stop.type === 'city') {
      element.style.display = 'flex';
      continue;
    }
    if (stop.type === 'activity') {
      if (zoom < 4) {
        element.style.display = 'none';
      } else {
        element.style.display = 'flex';
      }
      continue;
    }
    if (stop.type === 'hotel') {
      element.style.display = zoom < 4 ? 'none' : 'flex';
    }
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
}

function removeRouteLayers(map: mapboxgl.Map) {
  for (const id of ROUTE_LAYERS) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
  for (const id of ROUTE_SOURCES) {
    if (map.getSource(id)) map.removeSource(id);
  }
}

function addRouteLayers(map: mapboxgl.Map, stops: TripMapStop[]) {
  removeRouteLayers(map);
  if (stops.length < 2) return;

  const grouped = buildSegmentFeatures(stops);
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
}

export function TripMap({
  itinerary,
  selectedStopId = null,
  selectedDay = null,
  onStopClick,
}: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<MarkerRecord[]>([]);
  const onStopClickRef = useRef(onStopClick);
  onStopClickRef.current = onStopClick;

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const stops = itinerary.stops;
  const stopsKey = useMemo(
    () => stops.map((s) => `${s.id}:${s.lat}:${s.lng}:${s.type}:${s.day}`).join('|'),
    [stops]
  );

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

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    return () => {
      for (const record of markersRef.current) {
        record.marker.remove();
      }
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !token || stops.length === 0) return;

    const render = () => {
      for (const record of markersRef.current) {
        record.marker.remove();
      }
      markersRef.current = [];

      const zoom = map.getZoom();
      addRouteLayers(map, stops);
      syncRouteLayerVisibility(map, zoom);

      for (const stop of stops) {
        const selected = stop.id === selectedStopId;
        const { el, labelEl } = createMarkerElement(stop, selected, zoom, () => {
          onStopClickRef.current?.(stop.id);
        });
        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([stop.lng, stop.lat])
          .addTo(map);
        markersRef.current.push({ stop, marker, element: el, labelEl });
      }

      applyZoomVisibility(markersRef.current, zoom);
    };

    if (map.isStyleLoaded()) {
      render();
    } else {
      map.once('load', render);
    }

    const onZoom = () => {
      const zoom = map.getZoom();
      applyZoomVisibility(markersRef.current, zoom);
      syncRouteLayerVisibility(map, zoom);
      for (const record of markersRef.current) {
        const selected = record.stop.id === selectedStopId;
        record.element.style.transform = `scale(${selected ? 1.3 : 1})`;
        if (record.labelEl) {
          record.labelEl.style.display = zoom > 10 ? 'block' : 'none';
        } else if (zoom > 10 && record.stop.type !== 'city') {
          const labelEl = document.createElement('span');
          labelEl.textContent = record.stop.name;
          labelEl.style.cssText =
            'margin-top:4px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:600;color:#0f172a;text-shadow:0 1px 2px #fff;';
          record.element.appendChild(labelEl);
          record.labelEl = labelEl;
        }
      }
    };

    map.on('zoom', onZoom);
    return () => {
      map.off('zoom', onZoom);
    };
  }, [stops, stopsKey, token, selectedStopId]);

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

  if (!token) {
    return (
      <div
        className="flex h-full w-full items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500"
        style={{ height: '100%', width: '100%' }}
      >
        Manjka NEXT_PUBLIC_MAPBOX_TOKEN
      </div>
    );
  }

  if (stops.length === 0) {
    return (
      <div
        className="flex h-full w-full items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500"
        style={{ height: '100%', width: '100%' }}
      >
        Ni koordinat za prikaz poti
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden rounded-2xl shadow-lg"
      style={{ height: '100%', width: '100%' }}
    />
  );
}

// Backward compat — stari importi
export type { TripMapItinerary as TripMapItineraryInput };
