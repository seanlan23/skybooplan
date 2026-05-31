import type { Itinerary, DayPlan, Place, FlightSuggestion } from '@/lib/types';
import type { ItineraryDay, ItineraryTripSummary } from '@/types/itinerary.types';
import type { SelectedFlightForAI } from '@/types/selectedFlight.types';

function uid(prefix: string, n: number) {
  return `${prefix}-${n}`;
}

export function convertPlannerDaysToItinerary(
  days: ItineraryDay[],
  destination: string,
  selectedFlight: SelectedFlightForAI | null,
  tripSummary?: ItineraryTripSummary | null
): Itinerary {
  const startDate =
    selectedFlight?.outboundDepartureAt?.slice(0, 10) ??
    days[0]?.date?.slice(0, 10) ??
    new Date().toISOString().slice(0, 10);

  const endDay = days[days.length - 1];
  const endDate =
    endDay?.date?.slice(0, 10) ??
    selectedFlight?.returnDepartureAt?.slice(0, 10) ??
    startDate;

  const dayPlans: DayPlan[] = days.map((day) => {
    const lat = day.locationLat ?? 0;
    const lng = day.locationLon ?? 0;

    const places: Place[] = (day.suggestions ?? []).map((s, i) => ({
      id: uid(`place-d${day.day}`, i),
      name: s.name,
      description: s.description,
      category: 'attraction' as const,
      coordinates: { lat, lng },
      images: [],
      priceEstimateEUR: undefined,
    }));

    if (places.length === 0 && day.location) {
      places.push({
        id: uid(`place-d${day.day}`, 0),
        name: day.location,
        description: day.description || day.title,
        category: 'activity',
        coordinates: { lat, lng },
        images: [],
      });
    }

    return {
      dayNumber: day.day,
      date: day.date ?? day.estimatedDate?.toISOString?.()?.slice(0, 10) ?? startDate,
      title: day.title || day.location,
      summary: day.description,
      places,
    };
  });

  const flights: FlightSuggestion[] = selectedFlight
    ? [
        {
          from: selectedFlight.origin,
          to: selectedFlight.destination,
          airline: selectedFlight.airline ?? '—',
          departISO: selectedFlight.outboundDepartureAt,
          arriveISO: selectedFlight.outboundArrivalAt,
          priceEUR: selectedFlight.price ?? 0,
        },
      ]
    : [];

  const budgetMatch = tripSummary?.totalCostEstimate?.match(/[\d.]+/);
  const budgetEUR = budgetMatch ? Math.round(parseFloat(budgetMatch[0])) : 0;

  return {
    id: crypto.randomUUID(),
    destination,
    startDate,
    endDate,
    budgetEUR,
    days: dayPlans,
    flights,
    hotels: [],
  };
}
