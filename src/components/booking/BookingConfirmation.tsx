'use client'
import { CheckCircle2, Copy } from 'lucide-react'
import type { PackageQuoteResponse } from '@/types/booking.types'
import type { FlightOffer } from '@/types/flight.types'
import { Button } from '@/components/ui/Button'

interface BookingConfirmationProps {
  offer: FlightOffer
  result: PackageQuoteResponse
  onClose: () => void
}

export function BookingConfirmation({ offer, result, onClose }: BookingConfirmationProps) {
  const ref = result.reference ?? '—'

  function copyRef() {
    if (result.reference) {
      void navigator.clipboard.writeText(result.reference)
    }
  }

  return (
    <div className="text-center py-4">
      <div className="w-14 h-14 bg-leaf-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-8 h-8 text-leaf-600" />
      </div>
      <h3 className="font-display font-bold text-xl text-slate-900 mb-1">
        Zahteva shranjena
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        {offer.origin} → {offer.destination} · {offer.airline}
        <br />
        Podatke lahko uporabite za pošiljanje predračuna stranki.
      </p>

      <div className="bg-slate-50 rounded-2xl p-4 mb-4 text-left">
        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1 text-center">
          Referenčna številka
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="font-mono text-2xl font-bold text-slate-900 tracking-wide">{ref}</span>
          {result.reference && (
            <button
              type="button"
              onClick={copyRef}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"
              aria-label="Kopiraj referenco"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
        </div>
        {result.message && (
          <p className="text-sm text-slate-600 mt-3 text-center">{result.message}</p>
        )}
        {result.quoteId && (
          <p className="text-xs text-slate-400 mt-2 text-center">ID: {result.quoteId}</p>
        )}
      </div>

      <Button fullWidth onClick={onClose}>
        Zapri
      </Button>
    </div>
  )
}
