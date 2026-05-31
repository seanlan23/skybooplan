'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { getSupabaseBrowserClient } from '@/integrations/supabase/client';
import { isSupabaseConfigured } from '@/integrations/supabase/config';
import { SupabaseSetupNotice } from '@/components/auth/SupabaseSetupNotice';
import { fetchUserTrips } from '@/lib/trips';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { TripCard } from '@/components/dashboard/TripCard';
import { Button } from '@/components/ui/Button';
import type { TripRow } from '@/types/trip.types';

export default function DashboardPage() {
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  const [loadError, setLoadError] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        const meta = user?.user_metadata as { full_name?: string } | undefined;
        setUserName(meta?.full_name ?? user?.email?.split('@')[0] ?? 'Potnik');

        const rows = await fetchUserTrips();
        setTrips(rows);
      } catch (err) {
        console.error('[dashboard]', err);
        setLoadError(err instanceof Error ? err.message : 'Napaka pri nalaganju planov');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [configured]);

  if (!configured) {
    return <SupabaseSetupNotice />;
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            Pozdravljen, {userName}
          </h1>
          <p className="text-slate-500 mt-1">Tvoji shranjeni potovalni plani</p>
        </div>
        <Link href="/">
          <Button>
            <Plus className="h-4 w-4" />
            Nov plan
          </Button>
        </Link>
      </header>

      {!loading && trips.length > 0 && <DashboardStats trips={trips} />}

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {loadError}. Preveri Supabase migracijo tabele <code>trips</code> in prijavo na{' '}
          <Link href="/login" className="font-medium underline">
            /login
          </Link>
          .
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-400 py-12 text-center">Nalaganje planov…</div>
      ) : trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
          <p className="text-lg font-medium text-slate-700">
            Še nimaš planov. Ustvari prvega →
          </p>
          <Link href="/" className="inline-block mt-4">
            <Button>Nov plan</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      )}
    </div>
  );
}
