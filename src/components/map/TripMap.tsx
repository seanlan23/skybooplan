'use client';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useMemo, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PhotoMarker } from './PhotoMarker';
import { useTripStore } from '@/lib/tripStore';
import type { Itinerary, Place } from '@/lib/types';

const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200&q=80';

type TripMapProps = {
  itinerary: Itinerary;
  activePlaceId?: string | null;
  onPlaceClick?: (placeId: string) => void;
};

type MarkerEntry = {
  marker: mapboxgl.Marker;
  root: Root;
  placeId: string;
};

function collectPlaces(itinerary: Itinerary): Place[] {
  return itinerary.days.flatMap((day) => day.places);
}

export function TripMap({ itinerary, activePlaceId: activePlaceIdProp, onPlaceClick }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<MarkerEntry[]>([]);

  const storeActivePlaceId = useTripStore((s) => s.activePlaceId);
  const focusTarget = useTripStore((s) => s.focusTarget);
  const setActivePlace = useTripStore((s) => s.setActivePlace);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
  const activePlaceId = activePlaceIdProp ?? storeActivePlaceId;
  const places = useMemo(() => collectPlaces(itinerary), [itinerary]);

  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [0, 20],
      zoom: 2,
      attributionControl: true,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    return () => {
      for (const entry of markersRef.current) {
        entry.root.unmount();
        entry.marker.remove();
      }
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !token) return;

    for (const entry of markersRef.current) {
      entry.root.unmount();
      entry.marker.remove();
    }
    markersRef.current = [];

    if (places.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    for (const place of places) {
      const { lng, lat } = place.coordinates;
      const lngLat: [number, number] = [lng, lat];
      bounds.extend(lngLat);

      const el = document.createElement('div');
      const root = createRoot(el);
      const imageUrl = place.images[0] ?? PLACEHOLDER_IMAGE;
      const isActive = place.id === activePlaceId;

      root.render(
        <PhotoMarker
          imageUrl={imageUrl}
          label={place.name}
          active={isActive}
          onClick={() => {
            onPlaceClick?.(place.id);
            setActivePlace(place.id, place.coordinates);
          }}
        />
      );

      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(lngLat)
        .addTo(map);

      markersRef.current.push({ marker, root, placeId: place.id });
    }

    if (places.length === 1) {
      map.flyTo({
        center: [places[0].coordinates.lng, places[0].coordinates.lat],
        zoom: 12,
        duration: 1200,
        essential: true,
      });
    } else {
      map.fitBounds(bounds, { padding: 64, maxZoom: 13, duration: 1200 });
    }
  }, [places, token, onPlaceClick, setActivePlace]);

  useEffect(() => {
    for (const entry of markersRef.current) {
      const place = places.find((p) => p.id === entry.placeId);
      if (!place) continue;
      entry.root.render(
        <PhotoMarker
          imageUrl={place.images[0] ?? PLACEHOLDER_IMAGE}
          label={place.name}
          active={entry.placeId === activePlaceId}
          onClick={() => {
            onPlaceClick?.(place.id);
            setActivePlace(place.id, place.coordinates);
          }}
        />
      );
    }
  }, [activePlaceId, places, onPlaceClick, setActivePlace]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (activePlaceId) {
      const place = places.find((p) => p.id === activePlaceId);
      if (place) {
        map.flyTo({
          center: [place.coordinates.lng, place.coordinates.lat],
          zoom: 14,
          duration: 1500,
          essential: true,
        });
        return;
      }
    }

    if (focusTarget) {
      map.flyTo({
        center: [focusTarget.lng, focusTarget.lat],
        zoom: 13,
        duration: 1500,
        essential: true,
      });
    }
  }, [activePlaceId, focusTarget, places]);

  if (!token) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-6 text-center text-sm text-amber-900">
        Mapbox token manjka — nastavi <code className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</code> v
        .env.local
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl shadow-lg shadow-slate-900/10">
      <div ref={containerRef} className="h-full w-full min-h-[320px]" />
    </div>
  );
}
