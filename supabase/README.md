# Supabase + Stripe setup

## 1. Supabase project
1. Create project at https://supabase.com
2. Run migration: `supabase db push` or paste `supabase/migrations/20260325120000_trips.sql` in SQL editor
3. Enable Email auth + Google provider in Authentication → Providers
4. Add redirect URL: `http://localhost:3000/dashboard` and production URL

## 2. Frontend `.env.local`
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## 3. Edge Function secrets
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set APP_URL=https://www.skybooplan.com
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

## 4. Stripe webhook
Point webhook to: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
Events: `checkout.session.completed`
