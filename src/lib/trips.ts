import { getSupabaseBrowserClient } from '@/integrations/supabase/client';
import type { Itinerary } from '@/lib/types';
import type { TripInsert, TripRow } from '@/types/trip.types';

export async function fetchUserTrips(): Promise<TripRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as TripRow[];
}

export async function fetchTripById(id: string): Promise<TripRow | null> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.from('trips').select('*').eq('id', id).maybeSingle();

  if (error) throw error;
  return data as TripRow | null;
}

export async function createTrip(input: TripInsert): Promise<TripRow> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Ni prijave');

  const { data, error } = await supabase
    .from('trips')
    .insert({
      user_id: user.id,
      title: input.title,
      destination: input.destination,
      itinerary: input.itinerary,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as TripRow;
}

export async function deleteTrip(id: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.from('trips').delete().eq('id', id);
  if (error) throw error;
}

export function tripDayCount(trip: TripRow): number {
  const itinerary = trip.itinerary as Itinerary;
  return itinerary.days?.length ?? 0;
}

export function tripCoverImage(trip: TripRow): string {
  const itinerary = trip.itinerary as Itinerary;
  for (const day of itinerary.days ?? []) {
    for (const place of day.places ?? []) {
      if (place.images?.[0]) return place.images[0];
    }
  }
  for (const hotel of itinerary.hotels ?? []) {
    if (hotel.images?.[0]) return hotel.images[0];
  }
  return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';
}

export function computeDashboardStats(trips: TripRow[]) {
  const totalTrips = trips.length;
  const totalDays = trips.reduce((sum, t) => sum + tripDayCount(t), 0);
  const countries = new Set<string>();
  for (const trip of trips) {
    const part = trip.destination.split(',').pop()?.trim();
    if (part) countries.add(part.toLowerCase());
  }
  return { totalTrips, totalDays, totalCountries: countries.size };
}

export async function downloadTripPdf(itinerary: Itinerary, destination: string): Promise<void> {
  const url =
    process.env.NEXT_PUBLIC_MAKE_PDF_WEBHOOK_URL ??
    'https://hook.eu1.make.com/uguqczf2ef6svceg84zaksco389milgc';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      exportType: 'pdf',
      destination,
      itinerary,
      exportedAt: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(detail || `PDF export failed (${res.status})`);
  }
}

export async function startStripeCheckout(tripId: string): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { tripId },
  });

  if (error) throw error;
  const url = (data as { url?: string })?.url;
  if (!url) throw new Error('Stripe checkout URL ni na voljo');
  return url;
}
