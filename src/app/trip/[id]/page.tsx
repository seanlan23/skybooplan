import { Suspense } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { TripDetailClient } from '@/components/trip/TripDetailClient';

export default function TripPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-slate-500">
            Nalaganje…
          </div>
        }
      >
        <TripDetailClient tripId={params.id} />
      </Suspense>
    </AuthGuard>
  );
}
