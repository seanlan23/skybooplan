import type { Itinerary } from '@/lib/types';

export type TripDestination = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  photo?: string;
  order: number;
};

/** Destinacije za route chips (ena na dan / mesto). */
export function buildTripDestinations(itinerary: Itinerary): TripDestination[] {
  const sorted = [...itinerary.days].sort((a, b) => a.dayNumber - b.dayNumber);
  const destinations: TripDestination[] = [];

  for (const day of sorted) {
    if (day.places.length === 0) continue;
    const anchor = day.places[0];
    const photo =
      anchor.images?.[0] ??
      day.places.find((p) => p.images?.length)?.images?.[0];

    destinations.push({
      id: `city-${day.dayNumber}`,
      name: day.title || anchor.name,
      lat: anchor.coordinates.lat,
      lng: anchor.coordinates.lng,
      photo,
      order: destinations.length + 1,
    });
  }

  return destinations;
}
