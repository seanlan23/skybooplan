'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { ItineraryView } from '@/components/ItineraryView';
import { PdfPaywallModal } from '@/components/paywall/PdfPaywallModal';
import { Button } from '@/components/ui/Button';
import { downloadTripPdf, fetchTripById, startStripeCheckout } from '@/lib/trips';
import type { TripRow } from '@/types/trip.types';

export function TripDetailClient({ tripId }: { tripId: string }) {
  const searchParams = useSearchParams();
  const [trip, setTrip] = useState<TripRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadTrip = useCallback(async () => {
    const row = await fetchTripById(tripId);
    setTrip(row);
    setLoading(false);
    return row;
  }, [tripId]);

  useEffect(() => {
    void loadTrip();
  }, [loadTrip]);

  useEffect(() => {
    const paid = searchParams.get('paid') === 'true';
    const canceled = searchParams.get('canceled') === 'true';
    if (canceled) {
      setMessage('Plačilo preklicano.');
      return;
    }
    if (!paid) return;

    let attempts = 0;
    const poll = setInterval(async () => {
      attempts += 1;
      const row = await fetchTripById(tripId);
      if (row?.pdf_unlocked) {
        setTrip(row);
        setMessage('Plačilo uspešno! PDF je odklenjen.');
        clearInterval(poll);
      }
      if (attempts >= 15) clearInterval(poll);
    }, 2000);

    return () => clearInterval(poll);
  }, [searchParams, tripId]);

  async function handlePdfClick() {
    if (!trip) return;
    if (trip.pdf_unlocked) {
      setPdfLoading(true);
      setMessage(null);
      try {
        await downloadTripPdf(trip.itinerary, trip.destination);
        setMessage('PDF zahteva poslana — preveri e-pošto ali Make webhook.');
      } catch (err) {
        setMessage(err instanceof Error ? err.message : 'PDF ni uspel');
      } finally {
        setPdfLoading(false);
      }
      return;
    }
    setPaywallOpen(true);
  }

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      const url = await startStripeCheckout(tripId);
      window.location.href = url;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Checkout ni uspel');
      setCheckoutLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Nalaganje plana…
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-slate-600">Plan ni bil najden.</p>
        <Link href="/dashboard">
          <Button variant="secondary">Nazaj na dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Moji plani
        </Link>
        <Button onClick={handlePdfClick} loading={pdfLoading}>
          <Download className="h-4 w-4" />
          {trip.pdf_unlocked ? 'Prenesi PDF ✓' : 'Prenesi PDF'}
        </Button>
      </div>
      {message && (
        <div className="bg-sky-50 border-b border-sky-100 px-4 py-2 text-sm text-sky-800 text-center">
          {message}
        </div>
      )}
      <div className="flex-1 min-h-0">
        <ItineraryView itinerary={trip.itinerary} />
      </div>
      <PdfPaywallModal
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onCheckout={handleCheckout}
        loading={checkoutLoading}
      />
    </div>
  );
}
