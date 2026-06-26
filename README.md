# Survivor Systems

Survivor Systems is a privacy-first web application with planning, escape, and rebuilding resources for survivors of domestic violence.

## Product principles

- No survivor accounts.
- No tracking, behavioral analytics, or marketing cookies.
- No survivor personal data collection.
- Free urgent safety resources first.
- Optional low-cost downloads through Stripe Checkout.
- Supabase is reserved for public metadata, private file storage, and webhook fulfillment only when needed.

## Stack

- React + Vite + TypeScript
- Vercel hosting
- Stripe Checkout for paid downloads
- Supabase for future public resource metadata and private download fulfillment
- GitHub for source control

## Local development

```bash
npm install
npm run dev
```

## First integrations

1. Create a Stripe account and product prices for paid downloads.
2. Add a serverless checkout endpoint before accepting payments.
3. Use Stripe-hosted checkout so Survivor Systems never handles card data.
4. Add Supabase storage only if paid files need controlled access.
5. Keep safety-critical resources free and directly downloadable.
