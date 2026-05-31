import bearing from '@turf/bearing';
import { point } from '@turf/helpers';
import type { Feature, LineString } from 'geojson';

/** Pozicija in smer na LineString (indeks segmenta + interpolacija 0–1). */
export function positionAlongLine(
  coords: [number, number][],
  progress: number
): { lng: number; lat: number; rotation: number } {
  if (coords.length === 0) return { lng: 0, lat: 0, rotation: 0 };
  if (coords.length === 1) {
    return { lng: coords[0][0], lat: coords[0][1], rotation: 0 };
  }

  const clamped = Math.max(0, Math.min(1, progress));
  const totalSegments = coords.length - 1;
  const scaled = clamped * totalSegments;
  const segmentIndex = Math.min(Math.floor(scaled), totalSegments - 1);
  const t = scaled - segmentIndex;

  const from = coords[segmentIndex];
  const to = coords[segmentIndex + 1];
  const lng = from[0] + (to[0] - from[0]) * t;
  const lat = from[1] + (to[1] - from[1]) * t;
  const rotation = bearing(point(from), point(to));

  return { lng, lat, rotation };
}

/** Prva letalska linija iz flight segmentov (>500 km). */
export function firstFlightLine(
  features: Feature<LineString>[]
): [number, number][] | null {
  const feature = features[0];
  if (!feature?.geometry?.coordinates?.length) return null;
  return feature.geometry.coordinates as [number, number][];
}
