'use client'
import { FlightLegSummary } from '@/components/search/FlightLegSummary'
import type { BookingContact, PassengerFormData } from '@/types/booking.types'
import type { FlightOffer } from '@/types/flight.types'
import { Button } from '@/components/ui/Button'
import { useTranslations } from '@/i18n/LocaleProvider'

interface FlightBookingFormProps {
  offer: FlightOffer
  passengers: PassengerFormData[]
  contact: BookingContact
  isBooking: boolean
  error: string | null
  onPassengerChange: (index: number, patch: Partial<PassengerFormData>) => void
  onContactChange: (patch: Partial<BookingContact>) => void
  onSubmit: () => void
  onCancel: () => void
}

const inputClass =
  'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent'

const labelClass = 'block text-xs font-medium text-slate-500 mb-1'

export function FlightBookingForm({
  offer,
  passengers,
  contact,
  isBooking,
  error,
  onPassengerChange,
  onContactChange,
  onSubmit,
  onCancel,
}: FlightBookingFormProps) {
  const { t } = useTranslations()

  function handleGenderChange(index: number, gender: PassengerFormData['gender']) {
    onPassengerChange(index, {
      gender,
      title: gender === 'male' ? 'mr' : 'mrs',
    })
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold text-slate-800">{offer.airline}</p>
          <p className="font-bold text-slate-900">
            {offer.price} {offer.currency}
          </p>
        </div>
        <FlightLegSummary
          label="Odhod"
          segments={offer.segments}
          duration={offer.duration}
          stops={offer.stops}
        />
        {offer.returnSegments && offer.returnSegments.length > 0 && (
          <FlightLegSummary
            label="Povratek"
            segments={offer.returnSegments}
            duration={offer.returnDuration ?? ''}
            stops={offer.returnStops ?? 0}
            variant="return"
          />
        )}
        <p className="text-xs text-slate-500">
          Brez plačila — po potrditvi shranimo zahtevo za predračun.
        </p>
      </div>

      {passengers.map((p, index) => (
        <fieldset key={index} className="border border-slate-100 rounded-2xl p-4 space-y-3">
          <legend className="text-sm font-semibold text-slate-700 px-1">
            Potnik {index + 1}
          </legend>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Ime</label>
              <input
                required
                className={inputClass}
                value={p.givenName}
                onChange={(e) => onPassengerChange(index, { givenName: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>{t('flightBooking.lastName')}</label>
              <input
                required
                className={inputClass}
                value={p.familyName}
                onChange={(e) => onPassengerChange(index, { familyName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('flightBooking.dateOfBirth')}</label>
              <input
                required
                type="date"
                className={inputClass}
                value={p.bornOn}
                onChange={(e) => onPassengerChange(index, { bornOn: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Spol</label>
              <select
                className={inputClass}
                value={p.gender}
                onChange={(e) =>
                  handleGenderChange(index, e.target.value as PassengerFormData['gender'])
                }
              >
                <option value="male">{t('flightBooking.male')}</option>
                <option value="female">{t('flightBooking.female')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>{t('flightBooking.passportNumber')}</label>
              <input
                required
                className={inputClass}
                value={p.passportNumber}
                onChange={(e) => onPassengerChange(index, { passportNumber: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>{t('flightBooking.countryIso')}</label>
              <input
                required
                maxLength={2}
                className={inputClass}
                value={p.passportIssuingCountry}
                onChange={(e) =>
                  onPassengerChange(index, {
                    passportIssuingCountry: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('flightBooking.passportExpiry')}</label>
            <input
              required
              type="date"
              className={inputClass}
              value={p.passportExpiresOn}
              onChange={(e) => onPassengerChange(index, { passportExpiresOn: e.target.value })}
            />
          </div>
        </fieldset>
      ))}

      <fieldset className="border border-slate-100 rounded-2xl p-4 space-y-3">
        <legend className="text-sm font-semibold text-slate-700 px-1">Kontakt</legend>
        <div>
          <label className={labelClass}>E-pošta</label>
          <input
            required
            type="email"
            className={inputClass}
            value={contact.email}
            onChange={(e) => onContactChange({ email: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Telefon</label>
          <input
            required
            type="tel"
            placeholder="+38640123456"
            className={inputClass}
            value={contact.phone}
            onChange={(e) => onContactChange({ phone: e.target.value })}
          />
        </div>
      </fieldset>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <Button type="button" variant="secondary" fullWidth onClick={onCancel} disabled={isBooking}>
          Prekliči
        </Button>
        <Button type="submit" fullWidth loading={isBooking}>
          Potrdi rezervacijo paketa
        </Button>
      </div>
    </form>
  )
}
