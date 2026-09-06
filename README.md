# Ahar

An elegant restaurant ordering, rewards, and reservations PWA built with
Next.js 14 (App Router), Supabase (auth + Postgres with Row-Level Security), and
Stripe.

## Features

- **Storefront** — seasonal menu grouped by category, add-to-cart, favorites.
- **Cart & checkout** — persistent cart (Redux + localStorage), Stripe Elements
  payment, tip and fulfillment selection.
- **Accounts** — email/password, magic-link, and phone (OTP) sign-in; profile
  management; password change.
- **Orders** — full order history with itemized breakdowns.
- **Rewards** — points per dollar spent, tiers, and perks.
- **Reservations** — book and track tables.
- **PWA** — installable, offline app shell via service worker.
- **Security-first** — see [`SECURITY.md`](./SECURITY.md).

## Tech stack

Next.js 14 · React 18 · Supabase · Stripe · Redux Toolkit · Framer Motion ·
lucide-react · react-hot-toast

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in your values. Only `NEXT_PUBLIC_*` keys are exposed to the browser;
everything else is server-only (never commit `.env.local`).

### 3. Set up the database

Apply the migrations to your Supabase project (they create the schema, enable
Row-Level Security with per-user policies, seed a sample menu, and add the
rewards RPC):

```bash
supabase link --project-ref <your-ref>
supabase db push
```

Enable the auth methods you want (email, phone) in the Supabase dashboard. Phone
sign-in requires an SMS provider.

### 4. Stripe (payments)

- Set `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- Create a webhook endpoint pointing at `/api/stripe/webhook` for the
  `payment_intent.succeeded` event, and set `STRIPE_WEBHOOK_SECRET`.
- Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

### 5. Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint
```

> Without Supabase configured, the storefront still renders a bundled **sample
> menu** so you can preview the UI; auth, orders, and payments require the
> backend keys above.

## Project structure

```
src/
  app/                     # routes (App Router)
    (auth)/                # login, signup, magic-link, phone, change-password
    api/                   # rate-limited, auth-checked route handlers
    menu, checkout, orders, favorites, rewards, reservations, account
  components/              # Nav, CartDrawer, MenuItemCard, auth shell, providers
  lib/
    supabase/              # client (anon), server (RLS), admin (service role)
    repositories/          # data access (explicit column selects)
    security/              # rateLimit, validation
    stripe/                # server + client Stripe helpers
  store/                   # Redux cart slice
supabase/migrations/       # schema, RLS policies, seed, rewards RPC
```

## Security

Security is a first-class concern in this project. Row-Level Security, server-
side auth and pricing, rate limiting, input validation, secret hygiene, and a
verified Content-Security-Policy are all documented and mapped to their
implementation in [`SECURITY.md`](./SECURITY.md).
