# Stripe Library Webhook Setup

The deployed endpoint is:

```text
https://YOUR-PRODUCTION-DOMAIN/api/stripe-webhook
```

## Vercel Environment Variables

Configure these for Production, Preview, and Development:

```text
VITE_STRIPE_SUBSCRIPTION_URL=https://buy.stripe.com/...
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://nwpqdpfhburdeprbfkqi.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

Never prefix a secret with `VITE_`. Never commit secret values to the repository.

## Supabase Migration

Run `supabase/migrations/20260818000000_stripe_library_entitlements.sql` in the Supabase SQL Editor before sending webhook tests.

## Stripe Events

Register the production endpoint for:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
```

After saving the endpoint in Stripe, copy its `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET` in Vercel and redeploy.

## Access Rules

- `active`, `trialing`, and `past_due` subscriptions retain access.
- `canceled`, `unpaid`, `incomplete_expired`, and paused subscriptions do not retain access.
- Owner entitlements are never changed by Stripe events.
- The webhook creates a minimal Supabase Auth user for a new subscriber email so the subscriber can later request a magic sign-in link.
