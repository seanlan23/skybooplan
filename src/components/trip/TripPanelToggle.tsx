'use client';

import { cn } from '@/lib/utils';

type PanelMode = 'trip' | 'chat';

export function TripPanelToggle({
  mode,
  onChange,
}: {
  mode: PanelMode;
  onChange: (mode: PanelMode) => void;
}) {
  return (
    <div className="inline-flex rounded-full bg-slate-100 p-1">
      {(['chat', 'trip'] as const).map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            'rounded-full px-5 py-2 text-sm font-medium capitalize transition-all',
            mode === tab
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {tab === 'chat' ? 'Chat' : 'Trip'}
        </button>
      ))}
    </div>
  );
}
