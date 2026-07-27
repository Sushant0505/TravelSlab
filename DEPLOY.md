# Deploying TripSlab

The app is a standard Next.js 15 app and deploys to **Vercel** with zero config.
Every data repository has an in-memory fallback, so it runs **with or without** a
database — pick one of the two paths below.

---

## Path A — Quick shareable demo (no database)

Runs on the seeded in-memory demo dataset. Fastest way to get a live link.

1. Deploy:
   ```bash
   npm i -g vercel
   vercel login
   vercel            # preview URL
   vercel --prod     # shareable production URL
   ```
   …or push to GitHub and import the repo at https://vercel.com/new.

2. In Vercel → Project → Settings → Environment Variables, set:

   | Key                    | Value                                  |
   | ---------------------- | -------------------------------------- |
   | `AUTH_SECRET`          | a long random string                   |
   | `NEXT_PUBLIC_SITE_URL` | your Vercel URL (e.g. https://xyz.vercel.app) |

   **Leave `DATABASE_URL` unset** — the app uses in-memory demo data.

3. Redeploy. Demo logins work out of the box:
   - Agency: `wanderlytravels@travel.in` / `agency123`
   - Admin: `admin@tripslab.in` / `admin123`

> ⚠️ Serverless caveat: in-memory writes (registrations, purchases, new leads)
> do **not** persist across cold starts. Each cold start regenerates the same
> 48-lead demo set. Great for showcasing; use Path B for durable data.

---

## Path B — Fully persistent (hosted Postgres + Redis)

1. Create a Postgres (Neon / Vercel Postgres / Supabase) and copy its URL.
   Redis is optional (Upstash `rediss://…`).

2. Push schema + seed the hosted DB (run locally, pointing at the hosted URL):
   ```bash
   DATABASE_URL="<hosted-postgres-url>" npx prisma db push
   DATABASE_URL="<hosted-postgres-url>" npm run db:seed
   ```

3. Set env vars in Vercel:

   | Key                    | Value                                  |
   | ---------------------- | -------------------------------------- |
   | `DATABASE_URL`         | the hosted Postgres URL                |
   | `REDIS_URL`            | Upstash `rediss://…` (optional)        |
   | `AUTH_SECRET`          | a long random string                   |
   | `NEXT_PUBLIC_SITE_URL` | your Vercel URL                        |
   | `RAZORPAY_KEY_ID` etc. | payment keys (payments are stubbed)    |

4. Redeploy.

---

## Gotchas

- **Never** point `DATABASE_URL` at `localhost` in Vercel — there's no local
  Postgres in the cloud. Omit it (Path A) or use a hosted URL (Path B).
- `prisma generate` runs automatically on install via the `postinstall` script.
- Remove `RATE_LIMIT_DISABLED` (or set `"false"`) in production if you want the
  real 3-leads/24h limiter active on the public link.
- Set a strong `AUTH_SECRET` — the code falls back to an insecure dev secret if
  it's missing, which invalidates session security.
- `.env` is gitignored; configure secrets in the Vercel dashboard, not in git.
