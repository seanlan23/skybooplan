'use client'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { BookingConfirmation } from './BookingConfirmation'
import { FlightBookingForm } from './FlightBookingForm'
import type { BookingContact, PackageQuoteResponse, PassengerFormData } from '@/types/booking.types'
import type { FlightOffer } from '@/types/flight.types'

interface FlightBookingModalProps {
  offer: FlightOffer | null
  open: boolean
  passengers: PassengerFormData[]
  contact: BookingContact
  isBooking: boolean
  error: string | null
  confirmation: PackageQuoteResponse | null
  onPassengerChange: (index: number, patch: Partial<PassengerFormData>) => void
  onContactChange: (patch: Partial<BookingContact>) => void
  onSubmit: () => void
  onClose: () => void
}

export function FlightBookingModal({
  offer,
  open,
  passengers,
  contact,
  isBooking,
  error,
  confirmation,
  onPassengerChange,
  onContactChange,
  onSubmit,
  onClose,
}: FlightBookingModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-5 shadow-xl focus:outline-none">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-display font-bold text-lg text-slate-900">
              {confirmation ? 'Zahteva shranjena' : 'Podatki potnika'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
                aria-label="Zapri"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {offer && confirmation ? (
            <BookingConfirmation offer={offer} result={confirmation} onClose={onClose} />
          ) : offer ? (
            <FlightBookingForm
              offer={offer}
              passengers={passengers}
              contact={contact}
              isBooking={isBooking}
              error={error}
              onPassengerChange={onPassengerChange}
              onContactChange={onContactChange}
              onSubmit={onSubmit}
              onCancel={onClose}
            />
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
