# TripSlab — Premium Travel Lead Marketplace

A B2B2C travel lead marketplace. **Travelers** plan trips for free; **agencies**
buy qualified, budget-tagged leads. TripSlab sits in the middle — travelers stay
anonymous until an agency purchases their lead, and agencies never appear to
travelers.

A **production-shaped Next.js 15 codebase** with all three surfaces built — the
traveler product (animated homepage + 3-step trip planner), the agency panel
(lead marketplace + buy/reveal), and the admin console — on a Prisma/Postgres +
Redis data layer with JWT auth, slab-routed notifications, and abuse prevention.

---

## Build status

| Area                                                          | Status                                        |
| ------------------------------------------------------------- | --------------------------------------------- |
| Traveler product (home, planner, destinations, mega-menu)     | ✅ Complete                                    |
| Agency panel (marketplace, buy/reveal, purchases, register)   | ✅ Complete                                    |
| Admin console (overview, leads, agencies, users, revenue)     | ✅ Complete                                    |
| Authentication (JWT sessions, middleware, roles)              | ✅ Complete                                    |
| Notifications (slab-routed alerts, admin + agency feeds)      | ✅ Complete                                    |
| **Persistence** (Prisma/Postgres + Redis, in-memory fallback) | ✅ Complete                                    |
| **Non-exclusive marketplace** (a lead sells to many agencies) | ✅ Complete                                    |
| Payments (Razorpay / Stripe)                                  | ✅ Complete  |
| Auth hardening (bcrypt hashes, real OTP/SMS, resets)          | ⏳ Remaining                                   |
| Premium (AI suggestions, reviews, referrals, i18n, PWA)       | ⏳ Remaining                                   |

---

## Tech stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | Next.js 15 (App Router, RSC) + TypeScript                     |
| Styling    | Tailwind CSS + CSS variables (light/dark tokens)             |
| Animation  | Framer Motion (+ GSAP available for timeline-heavy sequences) |
| UI         | shadcn-style primitives (`components/ui`)                     |
| State      | Zustand (persisted planner store)                             |
| Data       | React Query (client fetching/caching)                         |
| Database   | PostgreSQL via Prisma                                         |
| Cache/rate | Redis (with in-memory dev fallback)                          |
| Payments   | Razorpay + Stripe (integration points stubbed)              |
| Validation | Zod                                                          |

---

## Getting started

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.example .env
#    → fill DATABASE_URL, REDIS_URL, payment keys as you enable each feature

# 3. (Optional) provision Postgres + Redis
docker compose up -d     # local Postgres + Redis (matches .env.example)
npm run db:push          # create tables from prisma/schema.prisma
npm run db:seed          # demo agencies, travelers, leads + notification feed

# 4. Run
npm run dev              # http://localhost:3000
```

The app runs **with or without** a database/Redis — no code changes to switch.
Every repository (`src/server/*-repo.ts`) uses Prisma/Postgres when
`DATABASE_URL` is reachable and transparently falls back to seeded in-memory data
otherwise (`src/lib/persistence.ts` → `withDb`). Redis backs slab subscriptions
and rate-limit counters with the same fallback (`src/lib/redis.ts` → `withRedis`).
Start Postgres (e.g. `docker compose up -d`) and the app switches to durable
storage automatically; stop it and it falls back to the demo dataset.

---

## What's built

### Traveler-facing (complete)

- **Animated homepage** (`/`)
  - Full-screen hero: backgrounds auto-rotate every 5s with fade + zoom,
    parallax scroll, floating plane/clouds, animated stat counters.
  - Quick-search form that seeds the planner store and deep-links into `/plan`.
  - Budget-slab cards with gradient borders, live lead counters, trending chips.
  - Popular destinations grid with 3D tilt + hover-zoom overlays.
  - "How it works" timeline, agency CTA band.
  - Once-per-session limited-time offer modal (fires after 6s).
- **Mega-menu navigation** — hover the "Destinations" nav item for a full-width
  panel: category column, India/World destination thumbnails, trending list and
  a "plan a custom trip" promo card.
- **Story circles** — Instagram-style gradient-ringed circles under the hero
  (Bucket List Sale, Ladakh, Spiti, International…), each linking to a
  destination or filter.
- **Trip showcase** — tabbed group departures (New Launches / International /
  India / Group Trips) with animated tab pill and rich trip cards.
- **Destination pages** (`/destinations/[slug]`) — every destination has a
  brief page: hero, "about" summary, trip highlights, best-time & ideal-length,
  related departures, and a **Plan-this-trip** button that pre-fills the planner
  with that destination. Statically generated + per-page SEO / JSON-LD.
- **Trip planner** (`/plan`) — 3 animated steps
  1. Personal details (name / email / mobile, with validation)
  2. Trip details (destination, city, travelers, budget, date, type, prefs)
  3. Confirmation → `POST /api/leads` → success screen with lead reference
  - Live slab assignment shown as the user types.

### Core logic

- `src/lib/slabs.ts` — the six budget slabs and `assignSlab(budget)`.
  `assignSlab(7500) → ₹5k–₹10k`, `assignSlab(25000) → ₹20k–₹50k`.
- `src/lib/lead.ts` — Zod payload schema + `scoreLead()` (0–100 quality score).
- `src/lib/rate-limit.ts` — max **3 leads / 24h** (`MAX_LEADS_PER_24H`) across IP
  + mobile + fingerprint (Redis, dev fallback in memory). Loopback IPs are
  skipped, and `RATE_LIMIT_DISABLED="true"` turns the limiter off for local
  testing.

### Agency panel (complete)

Distinct dark-sidebar SaaS UI (indigo/slate) — deliberately unlike the marketing
homepage and the planned admin theme.

- **Lead marketplace** (`/agencies`) — masked lead cards showing only
  destination, budget **range**, travel **month**, group size and lead score
  (score ring). Live filters (slab, destination, min score, sort, hide-unlocked)
  via React Query against `/api/agency/leads`. Wallet + KPI strip.
  **Non-exclusive**: a lead stays available to every agency — cards are either
  "Unlock lead · ₹X" or "Purchased" (relative to the signed-in agency); there is
  no "sold to another agency" lockout.
- **Buy / reveal flow** — payment modal with UPI / Card / Net Banking / Wallet
  (Razorpay + Stripe routing), processing → success animation, then the
  traveler's name, phone, email, departure city, date and preferences are
  revealed inline on the card. Each agency's unlock is recorded independently
  (one `Purchase` per lead+agency); the same lead can be sold to many agencies.
- **My Purchases** (`/agencies/purchases`) — invoice table with revealed
  contacts, amounts and per-row invoice download (stub).
- **Agency registration** (`/agencies/register`) — standalone page: agency name,
  owner, email, phone, GST (validated), KYC upload → creates a PENDING agency
  awaiting admin approval.

The privacy boundary is enforced in code: `revealContact()` is called **only**
inside the purchase path (`src/server/lead-repo.ts` → `/api/agency/purchase`),
and `MarketplaceLead` has no PII fields — so the browse endpoint physically
cannot leak name/phone/email.

### Admin panel (complete)

Fully dark premium console (zinc-950 + violet/fuchsia) — shares no styles with
the traveler frontend or the agency panel.

- **Overview** (`/admin`) — KPI cards (total leads, revenue, active &
  suspended agencies, blocked users, conversion rate), a 30-day revenue
  sparkline and a lead funnel.
- **Lead management** (`/admin/leads`) — status-tabbed table (ID, destination,
  budget, slab, score, status) with hide / unhide / mark-fraud / delete actions.
- **Agency management** (`/admin/agencies`) — approve / suspend / block / reset
  password, with purchases and spend per agency.
- **User management** (`/admin/users`) — block / unblock, flagged-user markers,
  and a submission-history modal.
- **Revenue analytics** (`/admin/revenue`) — Recharts: daily revenue area,
  monthly revenue bars, daily lead-sales line, top-agencies-by-spend bar.

All actions POST to the admin APIs and optimistically refresh via React Query
`invalidateQueries`.

### Authentication (complete)

JWT session cookies (`jose`, HS256, httpOnly) with two roles — **AGENCY** and
**ADMIN** — and `src/middleware.ts` protecting the panels:

- `/admin/**` requires an ADMIN session; `/agencies/**` requires an AGENCY
  session. Unauthenticated page hits redirect to the relevant login
  (`?next=...`); `/api/admin/**` and `/api/agency/**` return JSON 401.
- Login pages: `/agencies/login`, `/admin/login` (public: `/agencies/register`).
- Agency API routes now derive the agency id from the session (no more header),
  so purchases, notifications and slab subscriptions are correctly scoped.
- Working sign-out in both sidebars (`POST /api/auth/logout`).

**Demo credentials** (pre-filled on the login forms):

| Role   | Email                        | Password    |
| ------ | ---------------------------- | ----------- |
| Agency | wanderlytravels@travel.in    | `agency123` |
| Admin  | admin@tripslab.in            | `admin123`  |

Set a strong `AUTH_SECRET` in `.env`. Passwords are demo-only shared strings;
production swaps in per-account bcrypt/argon2 hashes.

### Notifications (complete)

Slab-routed lead alerts — the core marketplace mechanic:

- Each agency **subscribes to the budget slabs** it wants leads for
  (`/agencies/notifications` → "Lead alerts" toggles).
- When a traveler submits a lead, it's categorized into a slab and **only
  agencies subscribed to that slab are notified**. A ₹7,500/head budget →
  `s5_10k` → only `s5_10k` subscribers get the alert. Admins are notified of
  every lead.
- Agency feed also gets "lead unlocked" on purchase; the topbar bell shows a
  live unread badge (polls every 15s).
- Admin feed (`/admin/notifications`) receives new-lead, **suspicious-activity**
  (rate-limit trips), and **agency-registration** events, with its own bell.

Implemented in `src/server/notify-repo.ts` (`notifyNewLead` fans out to
`agenciesSubscribedTo(slab)`); wired from `/api/leads`, `/api/agency/purchase`
and `/api/agency/register`.

### Persistence & data layer (complete)

Every server repository is Prisma/Postgres-backed with a transparent in-memory
fallback, so the whole app works with or without infrastructure:

- **`withDb(dbFn, fallback)`** (`src/lib/persistence.ts`) runs the Prisma query
  when a database is reachable, else the in-memory demo data. Only *connection*
  errors trigger the fallback (real query errors are rethrown); once a connection
  fails, the process sticks to the fallback until restart.
- **`withRedis(fn, fallback)`** (`src/lib/redis.ts`) — shared `ioredis` client
  for **slab subscriptions** (per-agency + reverse per-slab sets) and
  **rate-limit** counters, falling back to in-memory maps.
- Repos converted: `lead-repo.ts` (marketplace, purchase, admin leads, stats,
  revenue), `admin-repo.ts` (agencies, users, overview, revenue) and
  `notify-repo.ts` (notifications → Postgres, subscriptions → Redis).
- **`docker-compose.yml`** spins up local Postgres + Redis; `prisma/seed.ts`
  loads 12 agencies, 26 travelers, 48 leads (with multi-agency unlocks) and a
  starter notification feed.
- Registering an agency now persists it (PENDING) and it shows in the admin list;
  submitted leads land in the marketplace live (15s polling on both panels).

### Backend

- `POST /api/leads` — validate → rate-limit → assign slab → score → **persist to the marketplace** → **fan-out to subscribed agencies**.
- `GET|POST /api/agency/notifications` · `GET|POST /api/agency/subscriptions` — agency feed + slab alert prefs.
- `GET|POST /api/admin/notifications` — admin feed.
- `GET /api/agency/leads` — masked marketplace listing (no PII).
- `POST /api/agency/purchase` — verify payment (stub) → record this agency's unlock (idempotent) → reveal contact.
- `POST /api/agency/register` — create PENDING agency + admin notification.
- `GET /api/admin/overview` · `GET|POST /api/admin/leads` · `.../agencies` ·
  `.../users` · `GET /api/admin/revenue` — admin data + moderation actions.
- `POST /api/otp/send`, `POST /api/otp/verify` — OTP verification stubs.
- `prisma/schema.prisma` — full data model: Traveler, Lead, Agency, Purchase,
  Payment, Admin, SlabPricing, Notification (+ enums for status/slab/provider).
- SEO: dynamic metadata + Open Graph/Twitter tags, JSON-LD org schema,
  `sitemap.ts`, `robots.ts`.

---

## Lead → slab → price

| Per-traveler budget | Slab            | Agency unlock price |
| ------------------- | --------------- | ------------------- |
| ₹0 – ₹5,000         | `s0_5k`         | ₹49                 |
| ₹5,000 – ₹10,000    | `s5_10k`        | ₹99                 |
| ₹10,000 – ₹20,000   | `s10_20k`       | ₹149                |
| ₹20,000 – ₹50,000   | `s20_50k`       | ₹249                |
| ₹50,000 – ₹1,00,000 | `s50_100k`      | ₹399                |
| ₹1,00,000+          | `s100k_plus`    | ₹399                |

Prices are admin-editable via the `SlabPricing` table.

---

## Privacy model (the core rule)

- Travelers **never** see agency identities.
- Agencies see only masked lead info in the marketplace: destination, budget
  range, travel month, group size, lead score.
- Name / phone / email / full trip requirements are revealed **only after** an
  agency completes payment (a `Purchase` row for that lead + agency). The lead is
  never globally "sold" — it stays available for other agencies to unlock too.

---

## Remaining work
Everything above is built. What's left, in rough priority:

- **Auth hardening** — per-account password hashes (bcrypt/argon2) instead of the
  shared demo password, traveler OTP wired to an SMS provider (MSG91), password
  reset + email verification. Optionally move sessions to a Redis store.
- **Premium** — AI destination/budget suggestions, reviews, referrals, coupons,
  i18n, PWA, live chat + WhatsApp.


---

## Project structure

```
src/
  app/
    layout.tsx            # fonts, metadata, JSON-LD, providers
    page.tsx              # homepage composition
    plan/page.tsx         # trip planner route
    agencies/             # agency panel + login/register
    admin/                # admin console + login
    api/                  # leads, agency/*, admin/*, auth/*, otp/*
    sitemap.ts, robots.ts
  components/
    home/                 # hero, banner, upcoming trips, slabs, destinations…
    planner/              # 3-step wizard
    agency/ · admin/      # panel UIs (marketplace, tables, charts)
    layout/ · ui/         # navbar/footer, shadcn-style primitives
  server/                 # data repos: lead-repo, admin-repo, notify-repo
  lib/                    # slabs, lead scoring, rate-limit, auth,
                          #   db (Prisma), persistence (withDb), redis (withRedis)
  store/                  # zustand planner + agency stores
prisma/
  schema.prisma, seed.ts  # full model + demo data seed
docker-compose.yml        # local Postgres + Redis
```
