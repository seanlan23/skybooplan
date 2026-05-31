'use client';

import { ShoppingCart } from 'lucide-react';

export function BookTripCta({ onBook }: { onBook?: () => void }) {
  return (
    <div className="pointer-events-none sticky bottom-0 z-10 -mx-6 bg-gradient-to-t from-white via-white/95 to-transparent px-6 pb-6 pt-10">
      <button
        type="button"
        onClick={onBook}
        className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 active:scale-[0.98]"
      >
        <ShoppingCart className="h-5 w-5" />
        Book this trip
      </button>
    </div>
  );
}
