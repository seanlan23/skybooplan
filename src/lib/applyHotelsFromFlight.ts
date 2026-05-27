import { hotelSearchFromSelectedFlight } from '@/lib/hotelsFromFlight'
import { useAccomStore } from '@/store/useAccomStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'

/** Duffel let → Booking (destinacija + dan pristanka) */
export function applyHotelsFromFlight(flight: SelectedFlightForAI) {
  const { location, checkIn, checkOut } = hotelSearchFromSelectedFlight(flight)
  usePlannerStore.getState().setActiveLocation(location)
  useAccomStore.getState().setActiveLocation(
    location,
    { checkIn, checkOut },
    { userPicked: false, clearResults: true }
  )
  useAccomStore.getState().triggerHotelSearch()
}

export function clearHotelsFromFlight() {
  usePlannerStore.getState().setActiveLocation(null)
  const accom = useAccomStore.getState()
  accom.setActiveLocation(null)
  accom.clearUserPickedHotel()
  useAccomStore.setState({ searchTrigger: 0, isLoading: false, results: [] })
}
