'use client';

import { cn } from '@/lib/utils';

export function PhotoMarker({
  imageUrl, label, active, onClick,
}: { imageUrl: string; label?: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative h-12 w-12 rounded-full border-2 shadow-lg transition-all',
        'overflow-hidden bg-white hover:scale-110',
        active ? 'border-blue-500 scale-125 ring-4 ring-blue-200' : 'border-white'
      )}
      style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      aria-label={label}
    >
      {label && (
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-2 py-0.5 text-xs text-white opacity-0 group-hover:opacity-100">
          {label}
        </span>
      )}
    </button>
  );
}
