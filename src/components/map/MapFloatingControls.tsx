'use client';

import { Maximize2, Pause, Play } from 'lucide-react';

export function MapFloatingControls({
  playing,
  onTogglePlay,
  onExpand,
}: {
  playing: boolean;
  onTogglePlay: () => void;
  onExpand: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={playing ? 'Pause route animation' : 'Play route animation'}
        className="absolute bottom-6 left-6 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-600/40 transition hover:bg-violet-700 active:scale-95"
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 pl-0.5" />}
      </button>
      <button
        type="button"
        onClick={onExpand}
        aria-label="Expand map"
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl bg-white/95 text-slate-700 shadow-md backdrop-blur transition hover:bg-white active:scale-95"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
    </>
  );
}
