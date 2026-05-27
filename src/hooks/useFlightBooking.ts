'use client'
import { useState } from 'react'
import type { PackageQuoteResponse, PassengerFormData, BookingContact } from '@/types/booking.types'
import type { FlightOffer } from '@/types/flight.types'
import { useSearchStore } from '@/store/useSearchStore'

function emptyPassenger(): PassengerFormData {
  return {
    givenName: '',
    familyName: '',
    bornOn: '',
    gender: 'male',
    title: 'mr',
    passportNumber: '',
    passportIssuingCountry: 'SI',
    passportExpiresOn: '',
  }
}

export function useFlightBooking(passengerCount: number) {
  const tripType = useSearchStore((s) => s.tripType)
  const [selectedOffer, setSelectedOffer] = useState<FlightOffer | null>(null)
  const [passengers, setPassengers] = useState<PassengerFormData[]>([emptyPassenger()])
  const [contact, setContact] = useState<BookingContact>({ email: '', phone: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<PackageQuoteResponse | null>(null)

  function openBooking(offer: FlightOffer) {
    setSelectedOffer(offer)
    setConfirmation(null)
    setError(null)
    setPassengers(
      Array.from({ length: Math.max(1, passengerCount) }, () => emptyPassenger())
    )
  }

  function closeBooking() {
    setSelectedOffer(null)
    setError(null)
    setIsSubmitting(false)
  }

  function updatePassenger(index: number, patch: Partial<PassengerFormData>) {
    setPassengers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    )
  }

  async function submitBooking() {
    if (!selectedOffer) return

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/flights/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offer: selectedOffer,
          passengers,
          contact,
          tripType,
        }),
      })
      const data: PackageQuoteResponse = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error ?? 'Shranjevanje zahteve ni uspelo.')
        return
      }

      setConfirmation(data)
    } catch {
      setError('Povezava s strežnikom ni uspela. Poskusi znova.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    selectedOffer,
    passengers,
    contact,
    isBooking: isSubmitting,
    error,
    confirmation,
    openBooking,
    closeBooking,
    updatePassenger,
    setContact,
    submitBooking,
  }
}
