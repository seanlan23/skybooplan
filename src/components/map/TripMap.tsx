'use client';

import { useEffect, useMemo, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Itinerary } from '@/lib/types';

type MapPoint = { id: string; name: string; lat: number; lng: number };

interface TripMapProps {
  itinerary: Itinerary;
}

function dedupeAdjacent(points: MapPoint[]): MapPoint[] {
  return points.filter((p, i) => {
    if (i === 0) return true;
    const prev = points[i - 1];
    return prev.lat !== p.lat || prev.lng !== p.lng;
  });
}

/** Origin/destination iz letov (from/to), koordinate iz days.places po vrstnem redu dni. */
export function extractMapPoints(itinerary: Itinerary): MapPoint[] {
  const orderedPlaces = [...itinerary.days]
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .flatMap((day) => day.places);

  const firstFlight = itinerary.flights[0];
  const lastFlight = itinerary.flights[itinerary.flights.length - 1];

  if (orderedPlaces.length > 0) {
    const originPlace = orderedPlaces[0];
    const destPlace = orderedPlaces[orderedPlaces.length - 1];

    const points: MapPoint[] = [
      {
        id: `origin-${originPlace.id}`,
        name: firstFlight?.from ?? originPlace.name,
        lat: originPlace.coordinates.lat,
        lng: originPlace.coordinates.lng,
      },
    ];

    for (let i = 1; i < orderedPlaces.length - 1; i++) {
      const place = orderedPlaces[i];
      points.push({
        id: place.id,
        name: place.name,
        lat: place.coordinates.lat,
        lng: place.coordinates.lng,
      });
    }

    if (orderedPlaces.length === 1) {
      return points;
    }

    points.push({
      id: `destination-${destPlace.id}`,
      name: lastFlight?.to ?? firstFlight?.to ?? destPlace.name,
      lat: destPlace.coordinates.lat,
      lng: destPlace.coordinates.lng,
    });

    return dedupeAdjacent(points);
  }

  if (itinerary.hotels.length > 0) {
    const hotelPoints = itinerary.hotels.map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      lat: hotel.coordinates.lat,
      lng: hotel.coordinates.lng,
    }));
    return dedupeAdjacent(hotelPoints);
  }

  return [];
}

export function TripMap({ itinerary }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const points = useMemo(() => extractMapPoints(itinerary), [itinerary]);
  const pointsKey = useMemo(
    () => points.map((p) => `${p.id}:${p.lat}:${p.lng}`).join('|'),
    [points]
  );

  useEffect(() => {
    if (!containerRef.current || !token || points.length === 0) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [points[0].lng, points[0].lat],
      zoom: 2,
    });
    mapRef.current = map;

    map.on('load', () => {
      points.forEach((point, index) => {
        const isEndpoint = index === 0 || index === points.length - 1;
        new mapboxgl.Marker({ color: isEndpoint ? '#000000' : '#3b82f6' })
          .setLngLat([point.lng, point.lat])
          .setPopup(new mapboxgl.Popup().setText(point.name))
          .addTo(map);
      });

      if (points.length >= 2) {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: points.map((p) => [p.lng, p.lat]),
            },
          },
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#000000',
            'line-width': 2.5,
            'line-dasharray': [2, 2],
          },
        });
      }

      const bounds = new mapboxgl.LngLatBounds();
      points.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 60, duration: 0, maxZoom: points.length === 1 ? 12 : 6 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [points, pointsKey, token]);

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

  if (points.length === 0) {
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
      className="h-full w-full rounded-lg"
      style={{ height: '100%', width: '100%' }}
    />
  );
}
