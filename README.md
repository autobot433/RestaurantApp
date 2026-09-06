# Freshly

Freshly is a full-stack restaurant ordering app. Users can create an account, browse the menu, add items to a cart, pay with Stripe, and check out. From there they can save favorite dishes, book a table, and earn loyalty points on every order. Every table in the database is locked down with Row-Level Security, so no user can ever see or touch another user's orders, favorites, or reservations.

## Features

- Browse a categorized menu and add items to a cart
- Create an account and log in (email/password, magic link, or phone OTP)
- Pay securely with Stripe at checkout
- Save dishes to a favorites list
- Book and track table reservations
- Earn loyalty points per order and track your tier
- View full order history with itemized breakdowns
- Installable PWA with an offline app shell

## Tech Stack

- Frontend: React, Next.js (App Router), Redux Toolkit, Framer Motion
- Backend: Next.js Route Handlers (Node.js)
- Database: PostgreSQL (Supabase), Row-Level Security
- Authentication: Supabase Auth (email/password, magic link, phone OTP)
- Payments: Stripe
- Deployment: Vercel

## Project Structure

```text
src/app/                   Routes (App Router)
src/app/(auth)/            Login, signup, magic-link, phone, change-password
src/app/api/               Route handlers (rate-limited, auth-checked)
src/components/            Nav, cart drawer, menu cards, auth shell
src/lib/supabase/          Client (anon key), server (RLS-scoped), admin (service role)
src/lib/repositories/      Data access layer, explicit column selects
src/lib/security/          Rate limiting, input validation
src/lib/stripe/            Server and client Stripe helpers
src/store/                 Redux cart slice
supabase/migrations/       Schema, RLS policies, seed data, rewards RPC
```

## Running Locally

Clone the repository:

```bash
git clone https://github.com/autobot433/RestaurantApp.git
cd RestaurantApp
```

Install dependencies:

```bash
npm install
```

Set up your environment:

```bash
cp .env.example .env.local
```

Add your environment variables to `.env.local` (see below), then set up the database:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Run the app:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

> Without Supabase configured, the storefront still renders a bundled sample menu so you can preview the UI — auth, orders, and payments require the environment variables below.

## Environment Variables

This project uses the following environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

See `.env.example` for a template with descriptions of each.

## Security

Row-Level Security, server-side auth, server-computed pricing, rate limiting, and a verified Content-Security-Policy are all documented in [`SECURITY.md`](./SECURITY.md).
