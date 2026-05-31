'use client';

import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const BULLETS = [
  'Popoln PDF z dnevnim itinerarijem',
  'Zemljevid in koordinate vseh točk',
  'Offline dostopen kjerkoli',
  'Doživljenjski dostop do tega plana',
];

interface PdfPaywallModalProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  loading?: boolean;
}

export function PdfPaywallModal({ open, onClose, onCheckout, loading }: PdfPaywallModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Zapri"
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-900">Prenesi svoj plan kot PDF</h2>
        <div className="mt-4 text-center">
          <p className="text-5xl font-bold text-slate-900 tracking-tight">€6,99</p>
          <p className="text-xs text-slate-500 mt-1">enkratno plačilo, brez naročnine</p>
        </div>
        <ul className="mt-6 space-y-3">
          {BULLETS.map((text) => (
            <li key={text} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              {text}
            </li>
          ))}
        </ul>
        <Button className="mt-6" fullWidth size="lg" onClick={onCheckout} loading={loading}>
          Plačaj in prenesi
        </Button>
        <p className="mt-3 text-center text-xs text-slate-400">🔒 Varno plačilo prek Stripe</p>
      </div>
    </div>
  );
}
