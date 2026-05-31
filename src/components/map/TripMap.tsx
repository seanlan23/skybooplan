'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Place = { id: string; name: string; lat: number; lng: number };

interface TripMapProps {
  origin: Place;
  destination: Place;
  stops?: Place[];
}

export function TripMap({ origin, destination, stops = [] }: TripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    if (!containerRef.current || !token) return;
    mapboxgl.accessToken = token;

    const allPoints = [origin, ...stops, destination];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [origin.lng, origin.lat],
      zoom: 2,
    });
    mapRef.current = map;

    map.on('load', () => {
      // Markerji
      allPoints.forEach((p, i) => {
        const isEndpoint = i === 0 || i === allPoints.length - 1;
        new mapboxgl.Marker({ color: isEndpoint ? '#000000' : '#3b82f6' })
          .setLngLat([p.lng, p.lat])
          .setPopup(new mapboxgl.Popup().setText(p.name))
          .addTo(map);
      });

      // ČRNA ČRTA med točkami
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: allPoints.map((p) => [p.lng, p.lat]),
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

      // FIT BOUNDS — pokaže oba konca + padding
      const bounds = new mapboxgl.LngLatBounds();
      allPoints.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, { padding: 60, duration: 0, maxZoom: 6 });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng, token, stops]);

  if (!token) {
    return (
      <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
        Manjka NEXT_PUBLIC_MAPBOX_TOKEN
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full rounded-lg" />;
}
