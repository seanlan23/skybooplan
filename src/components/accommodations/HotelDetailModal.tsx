'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { format } from 'date-fns'
import { sl } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Star,
  X,
  MapPin,
  Coffee,
  Waves,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { BookingRatingBadge } from '@/components/accommodations/BookingRatingBadge'
import { buildBookingUrl } from '@/lib/affiliateLinks'
import { formatCalendarDate } from '@/lib/calendarDate'
import { formatHotelDisplayLocation } from '@/lib/bookingLocation'
import { dedupePhotoUrls, parseBookingHotelId } from '@/lib/hotelGallery'
import { useSearchStore } from '@/store/useSearchStore'
import { cn } from '@/lib/utils'
import type { Accommodation } from '@/types/accommodation.types'

const MODAL_THUMB_COUNT = 5
const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'

interface HotelDetailModalProps {
  hotel: Accommodation | null
  open: boolean
  onClose: () => void
}

export function HotelDetailModal({ hotel, open, onClose }: HotelDetailModalProps) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [galleryUrls, setGalleryUrls] = useState<string[]>([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const { adults, children, rooms } = useSearchStore()

  const locationLabel = hotel ? formatHotelDisplayLocation(hotel.location) : ''

  const bookingReserveUrl = useMemo(() => {
    if (!hotel) return ''
    const checkIn = hotel.checkIn instanceof Date ? hotel.checkIn : new Date(hotel.checkIn)
    const checkOut = hotel.checkOut instanceof Date ? hotel.checkOut : new Date(hotel.checkOut)
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return hotel.affiliateUrl

    const bookingId = parseBookingHotelId(hotel.id)
    const city = formatHotelDisplayLocation(hotel.location) || hotel.location

    return buildBookingUrl({
      location: city,
      checkIn,
      checkOut,
      adults,
      children,
      rooms,
      hotelId: bookingId ?? undefined,
      hotelPageUrl: hotel.affiliateUrl.includes('/hotel/') ? hotel.affiliateUrl : undefined,
    })
  }, [hotel, adults, children, rooms])

  useEffect(() => {
    if (!open || !hotel) {
      setGalleryUrls([])
      setPhotoIndex(0)
      return
    }

    const fallback = dedupePhotoUrls([...(hotel.gallery ?? []), hotel.imageUrl])
    const bookingId = parseBookingHotelId(hotel.id)

    if (!bookingId) {
      setGalleryUrls(
        fallback.length > 0 ? fallback : [hotel.imageUrl || PLACEHOLDER_IMAGE]
      )
      setPhotoIndex(0)
      return
    }

    const controller = new AbortController()
    setGalleryLoading(true)

    const params = new URLSearchParams({
      hotelId: bookingId,
      checkIn: formatCalendarDate(hotel.checkIn),
      checkOut: formatCalendarDate(hotel.checkOut),
      adults: String(adults),
      children: String(children),
      rooms: String(rooms),
    })

    fetch(`/api/hotels/gallery?${params}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const remote = dedupePhotoUrls((data.gallery ?? []) as string[])
        const merged = dedupePhotoUrls([...remote, ...fallback], 15)
        setGalleryUrls(
          merged.length > 0 ? merged : [hotel.imageUrl || PLACEHOLDER_IMAGE]
        )
        setPhotoIndex(0)
      })
      .catch(() => {
        setGalleryUrls(
          fallback.length > 0 ? fallback : [hotel.imageUrl || PLACEHOLDER_IMAGE]
        )
        setPhotoIndex(0)
      })
      .finally(() => setGalleryLoading(false))

    return () => controller.abort()
  }, [open, hotel?.id, hotel?.checkIn, hotel?.checkOut, adults, children, rooms])

  const photos = useMemo(() => {
    if (!hotel) return []
    const unique = dedupePhotoUrls(galleryUrls.length > 0 ? galleryUrls : [hotel.imageUrl])
    return unique.length > 0 ? unique : [PLACEHOLDER_IMAGE]
  }, [galleryUrls, hotel])

  const thumbPhotos = photos.slice(0, MODAL_THUMB_COUNT)
  const currentPhoto = photos[photoIndex] ?? photos[0] ?? PLACEHOLDER_IMAGE

  function prevPhoto() {
    setPhotoIndex((i) => (i <= 0 ? photos.length - 1 : i - 1))
  }

  function nextPhoto() {
    setPhotoIndex((i) => (i >= photos.length - 1 ? 0 : i + 1))
  }

  if (!hotel) return null

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setPhotoIndex(0)
          onClose()
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[61] -translate-x-1/2 -translate-y-1/2',
            'w-[75vw] max-w-[1200px] max-h-[90vh] overflow-y-auto',
            'rounded-3xl bg-white shadow-2xl focus:outline-none'
          )}
        >
          <div className="relative h-[min(55vh,480px)] bg-slate-100">
            <img
              key={currentPhoto}
              src={currentPhoto}
              alt={hotel.name}
              className="w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            {galleryLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 text-white text-sm font-medium">
                Nalagam galerijo …
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />

            <Dialog.Close asChild>
              <button
                type="button"
                className="absolute top-4 right-4 p-2 rounded-full bg-white/90 text-slate-700 hover:bg-white shadow-md"
                aria-label="Zapri"
              >
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-md hover:bg-white"
                  aria-label="Prejšnja slika"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-md hover:bg-white"
                  aria-label="Naslednja slika"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {photos.map((url, i) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setPhotoIndex(i)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        i === photoIndex ? 'bg-white' : 'bg-white/50'
                      )}
                      aria-label={`Slika ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {thumbPhotos.length > 1 && (
            <div
              className={cn(
                'grid gap-2 px-4 py-4 border-b border-slate-100 bg-slate-50/80',
                thumbPhotos.length >= 5
                  ? 'grid-cols-5'
                  : 'grid-cols-4 sm:grid-cols-5'
              )}
            >
              {thumbPhotos.map((url, i) => (
                  <button
                    key={`${url}-${i}`}
                    type="button"
                    onClick={() => setPhotoIndex(i)}
                    className={cn(
                      'aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all',
                      i === photoIndex
                        ? 'border-sky-500 ring-2 ring-sky-200 scale-[1.02]'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    )}
                  >
                    <img
                      src={url}
                      alt={`${hotel.name} — fotografija ${i + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </button>
              ))}
            </div>
          )}

          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 pr-8">
              <Dialog.Title className="font-display text-2xl md:text-3xl font-bold text-slate-900 flex-1 min-w-0">
                {hotel.name}
              </Dialog.Title>
              <BookingRatingBadge
                rating={hotel.rating}
                reviewCount={hotel.reviewCount}
                size="md"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4 text-sky-500" />
                {hotel.neighborhood ?? locationLabel}
              </span>
              <span>
                {format(hotel.checkIn, 'd. MMM', { locale: sl })} –{' '}
                {format(hotel.checkOut, 'd. MMM yyyy', { locale: sl })}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-4">
              {hotel.stars && (
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: hotel.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              )}
              {hotel.hasBreakfast && (
                <span className="inline-flex items-center gap-1 text-sm text-leaf-700">
                  <Coffee className="w-4 h-4" /> Zajtrk
                </span>
              )}
              {hotel.isBeachfront && (
                <span className="inline-flex items-center gap-1 text-sm text-sky-700">
                  <Waves className="w-4 h-4" /> Ob morju
                </span>
              )}
            </div>

            <p className="mt-5 text-slate-600 leading-relaxed text-base">
              {hotel.description ??
                `Udobna namestitev v ${locationLabel}. Preveri podrobnosti in razpoložljivost na Booking.com.`}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              {hotel.amenities.map((a) => (
                <span
                  key={a}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200"
                >
                  {a}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-6 border-t border-slate-100">
              <div>
                <p className="text-sm text-slate-400">Cena od</p>
                <p className="text-3xl font-bold text-slate-900">
                  €{hotel.pricePerNight}
                  <span className="text-lg font-normal text-slate-400">/noč</span>
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Skupaj €{hotel.totalPrice} za izbrane datume
                </p>
              </div>
              <a
                href={bookingReserveUrl || hotel.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  /* BACKUP: 'inline-flex ... bg-sky-500 hover:bg-sky-600 ... shadow-sky-500/25' */
                  'inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl',
                  'bg-sky-600 hover:bg-sky-700 text-white font-semibold text-base',
                  'shadow-lg shadow-sky-600/25 transition-colors'
                )}
              >
                Rezerviraj na Booking.com
                <ExternalLink className="w-5 h-5" />
              </a>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
