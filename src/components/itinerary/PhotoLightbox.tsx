'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export function PhotoLightbox({
  images, startIndex, onClose,
}: { images: string[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx((i) => (i + 1) % images.length);
      if (e.key === 'ArrowLeft') setIdx((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95">
      <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white">
        <X className="h-6 w-6" />
      </button>
      <button onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
        className="absolute left-4 rounded-full bg-white/10 p-3 text-white">
        <ChevronLeft className="h-6 w-6" />
      </button>
      <img src={images[idx]} className="max-h-[90vh] max-w-[90vw] object-contain" />
      <button onClick={() => setIdx((i) => (i + 1) % images.length)}
        className="absolute right-4 top-1/2 rounded-full bg-white/10 p-3 text-white">
        <ChevronRight className="h-6 w-6" />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
        {idx + 1} / {images.length}
      </div>
    </div>
  );
}
