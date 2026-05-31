import type { Itinerary } from '@/lib/types';
import type { TripMapItinerary, TripMapStop } from '@/components/map/TripMap';

function placeStopType(category: TripMapStop['type'] | string): TripMapStop['type'] {
  if (category === 'hotel') return 'hotel';
  return 'activity';
}

/** Zgradi stops za Layla-style zemljevid iz AI Itinerary sheme. */
export function buildTripMapStops(itinerary: Itinerary): TripMapItinerary {
  const stops: TripMapStop[] = [];
  const sortedDays = [...itinerary.days].sort((a, b) => a.dayNumber - b.dayNumber);

  for (const day of sortedDays) {
    if (day.places.length === 0) continue;

    const anchor = day.places[0];
    const cityPhoto =
      anchor.images?.[0] ??
      day.places.find((p) => p.images?.length)?.images?.[0];

    stops.push({
      id: `city-${day.dayNumber}`,
      name: day.title || anchor.name,
      lat: anchor.coordinates.lat,
      lng: anchor.coordinates.lng,
      day: day.dayNumber,
      type: 'city',
      photo: cityPhoto,
    });

    for (const place of day.places) {
      stops.push({
        id: place.id,
        name: place.name,
        lat: place.coordinates.lat,
        lng: place.coordinates.lng,
        day: day.dayNumber,
        type: placeStopType(place.category),
        category: place.category,
        photo: place.images?.[0],
      });
    }
  }

  for (const hotel of itinerary.hotels) {
    stops.push({
      id: `hotel-${hotel.id}`,
      name: hotel.name,
      lat: hotel.coordinates.lat,
      lng: hotel.coordinates.lng,
      day: sortedDays[0]?.dayNumber ?? 1,
      type: 'hotel',
    });
  }

  return { stops: dedupeStops(stops) };
}

function dedupeStops(stops: TripMapStop[]): TripMapStop[] {
  const seen = new Set<string>();
  return stops.filter((stop) => {
    const key = `${stop.id}|${stop.lat}|${stop.lng}|${stop.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
