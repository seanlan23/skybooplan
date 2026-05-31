'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Loader2 } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/integrations/supabase/client';
import { isSupabaseConfigured } from '@/integrations/supabase/config';
import { convertPlannerDaysToItinerary } from '@/lib/convertPlannerItinerary';
import { createTrip } from '@/lib/trips';
import { usePlannerStore } from '@/store/usePlannerStore';
import { useSearchStore } from '@/store/useSearchStore';
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore';
import { cn } from '@/lib/utils';

export function SaveTripButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const itinerary = usePlannerStore((s) => s.itinerary);
  const tripSummary = usePlannerStore((s) => s.tripSummary);
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight);
  const destination = useSearchStore((s) => s.destination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = itinerary.length > 0 && !disabled && !loading;

  async function handleSave() {
    if (!canSave) return;
    setError(null);

    if (!isSupabaseConfigured()) {
      setError('Nadzorna plošča ni nastavljena (manjka Supabase).');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?next=/');
      return;
    }

    setLoading(true);
    try {
      const destLabel =
        selectedFlight?.destinationLabel ??
        destination?.city ??
        destination?.displayName ??
        itinerary[0]?.location ??
        'Potovanje';

      const converted = convertPlannerDaysToItinerary(
        itinerary,
        destLabel,
        selectedFlight,
        tripSummary
      );

      const trip = await createTrip({
        title: `${destLabel} — ${itinerary.length} dni`,
        destination: destLabel,
        itinerary: converted,
      });

      router.push(`/trip/${trip.id}`);
    } catch (err) {
      console.error('[save trip]', err);
      setError(err instanceof Error ? err.message : 'Shranjevanje ni uspelo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={!canSave}
        className={cn(
          'inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5',
          'text-sm font-semibold transition-all duration-200',
          'border-sky-200 bg-sky-600 text-white hover:bg-sky-700',
          'shadow-sm disabled:opacity-60 disabled:cursor-not-allowed'
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden />
        ) : (
          <LayoutDashboard className="w-4 h-4 shrink-0" aria-hidden />
        )}
        {loading ? 'Shranjujem…' : 'Shrani plan'}
      </button>
    </div>
  );
}
