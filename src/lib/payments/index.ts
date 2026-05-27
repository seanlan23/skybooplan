/**
 * Plačilni sloj — trenutno Duffel test balance; kasneje Stripe pred ustvarjanjem orderja.
 */
export type PaymentProviderId = 'duffel_test_balance' | 'stripe'

export interface OrderPaymentContext {
  amount: string
  currency: string
  offerId: string
  stripePaymentIntentId?: string
}

export interface DuffelOrderPayment {
  type: 'balance' | 'card'
  currency: string
  amount: string
}

export interface ResolvedOrderPayments {
  provider: PaymentProviderId
  duffelPayments: DuffelOrderPayment[]
  /** Za audit / kasnejši Stripe webhook */
  externalReference?: string
}

export async function resolveOrderPayments(
  ctx: OrderPaymentContext,
  provider: PaymentProviderId = 'duffel_test_balance'
): Promise<ResolvedOrderPayments> {
  if (provider === 'stripe') {
    if (!ctx.stripePaymentIntentId) {
      throw new Error('Stripe plačilo zahteva stripePaymentIntentId')
    }
    // Ko bo Stripe vključen: preveri PaymentIntent status, nato vrni ustrezno Duffel payment konfiguracijo.
    throw new Error('Stripe plačilo še ni aktivirano. Uporabi testni način.')
  }

  return {
    provider: 'duffel_test_balance',
    duffelPayments: [
      {
        type: 'balance',
        currency: ctx.currency,
        amount: ctx.amount,
      },
    ],
    externalReference: `test_balance:${ctx.offerId}`,
  }
}
