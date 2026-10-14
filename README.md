# RentFlow — Complete Rental Management Platform

RentFlow is a web-first, mobile-responsive, multi-business rental management system built with Next.js 16, TypeScript, Tailwind CSS/shadcn-compatible UI primitives, Supabase Auth, PostgreSQL, Supabase Storage, Recharts and server-generated PDFs.

The repository implements the full MVP specification plus the 24-item V1 launch-quality/perfection pass in `docs/SPEC_COVERAGE.md`.

## What is implemented

- Email/password registration, verification callback, login, logout, password reset and password change
- Four-step onboarding: business → branch → property → units, including a business logo
- Owner, Admin, Manager and Agent roles
- Branch-restricted staff access enforced by PostgreSQL Row Level Security
- Branch, property and unit creation/editing/archiving with property images and bulk unit creation
- Full tenant profiles, emergency/contact fields, tenant archiving and private tenant documents
- Lease creation, drafts, activation, ending/termination/cancellation, renewals, deposits, due day and grace period
- Monthly, quarterly and yearly rent charge generation, including back-filled charges for backdated active leases
- Automatic lease-expiry and unit-occupancy synchronization
- Full and partial payments allocated oldest-charge-first, including advance credit that auto-applies to the next generated charge
- Unique per-business/year receipt numbering
- Receipt screen, print, server-generated PDF download, WhatsApp share and email share
- Derived arrears with days overdue
- Expense categories, branch/property expenses and private receipt/document uploads
- Maintenance requests with priorities, assignments, statuses, estimated/actual costs and history
- Priority dashboard for outstanding rent, collections and vacancies with drill-down cards and quick actions
- Reports by period, property, branch, day, month and expense category, plus a server-generated PDF report
- Staff invitation flow through Supabase Auth, roles, status and branch access management
- In-app rent due, overdue, lease, payment and maintenance notifications
- Business/profile settings, logo/profile photos, receipt defaults and password controls
- Audit history
- Supabase Storage buckets and policies
- Scheduled rent/status jobs via optional `pg_cron`
- Realistic read-only demo mode for reviewing properties, tenants, leases, payments, arrears, maintenance and reports before Supabase credentials are connected
- Global search across tenants/phones, properties, units, receipt numbers and payment references
- Server pagination on high-volume tables plus CSV exports for tenants, payments, arrears, charges, expenses and reports
- Actionable empty states, destructive-action confirmations, pending states, friendly error boundaries and visible success feedback
- Commercial landing page with feature showcase, workflow, security, FAQ, privacy and terms
- Desktop sidebar and mobile bottom navigation/full module menu

## 1. Run the UI immediately in demo mode

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000` and use the demo link. Demo mode is intentionally read-only.

## 2. Connect Supabase

Create a fresh Supabase project and run `supabase/schema.sql` in the SQL Editor. The schema creates the tables, functions, triggers, RLS policies and Storage buckets/policies.

Set `.env.local`:

```env
NEXT_PUBLIC_APP_NAME=RentFlow
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
DEMO_MODE=false
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only. Never expose it with a `NEXT_PUBLIC_` prefix or commit it to Git.

## 3. Configure Supabase Auth

Enable Email authentication. Add these redirect URLs in Supabase Auth URL Configuration:

```text
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm
http://localhost:3000/update-password
```

Add the same paths for your production domain when deploying.

The app supports both PKCE `code` callbacks (`/auth/callback`) and token-hash verification (`/auth/confirm`). For production staff invitations/password emails, configure a production SMTP provider in Supabase.

## 4. First live run

1. Start the app with `DEMO_MODE=false`.
2. Register an owner account.
3. Verify the email if confirmation is enabled.
4. Complete the four-step onboarding wizard.
5. Add tenants and leases.
6. Rent charges are generated when an active lease is created/activated and by the monthly scheduler thereafter.
7. Record rent payments; allocation and receipt creation are atomic in PostgreSQL.

## 5. Scheduled jobs

After enabling the `pg_cron` extension in Supabase, run `supabase/cron.sql`.

It schedules:

- rent obligation generation on the first day of each month
- daily charge/lease status refresh and operational notifications

All charge generation is idempotent through the unique `(lease_id, charge_period)` constraint.

## 6. Rent and payment model

Rent is not represented by a single mutable tenant balance.

```text
Lease
  └─ Rent charges
       └─ Payment allocations
            └─ Payment
                 └─ Receipt
```

This allows partial payments, historical arrears, quarterly/yearly obligations, receipts and reliable reporting. The payment RPC locks outstanding charges, allocates oldest first and prevents over-allocation.

## 7. Security model

Every business record carries `business_id`.

- Owner/Admin: all branches in their business
- Manager/Agent: only branches granted in `member_branch_access`
- Tenant documents follow tenant branch permissions
- Expense documents follow expense branch permissions
- Owner membership cannot be changed by another staff account
- Staff invitation uses the server-only Supabase Admin client and verifies the actor is Owner/Admin first
- Cross-business access is denied by RLS, not frontend filtering

For a production launch, test RLS with two separate businesses and at least one branch-restricted manager account.

## 8. File storage

`schema.sql` creates:

- `business-assets` — public business/property/profile images; writes require business membership
- `tenant-documents` — private; scoped to the tenant's branch access
- `expense-documents` — private; scoped to the expense branch

The app generates signed URLs for private files.

## 9. PDFs

Receipt PDF:

```text
/api/receipts/<payment-id>/pdf
```

Report PDF:

```text
/api/reports/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD
```

Both are generated server-side with `pdf-lib`.

## 10. Staff invitations

Staff invitation requires `SUPABASE_SERVICE_ROLE_KEY`. Owners/Admins can invite Admin, Manager or Agent users. Managers/Agents can be assigned one or more branches. Invited memberships remain `INVITED` until the invited user authenticates, when `activate_my_invitations()` marks them active.

## 11. Deploy to Vercel

Push the project to GitHub, import it into Vercel and configure all variables from `.env.example`. Set `NEXT_PUBLIC_APP_URL` to the production origin and add production redirect URLs in Supabase Auth.

Do not expose the service-role key to client code.

## 12. Validation

After dependencies are installed:

```bash
npm run typecheck
npm run lint
npm run build
```

A dependency-independent V1 validation suite is also included:

```bash
npm run check:v1
```

It validates required project capabilities, exercises the rent-engine regression cases and audits RLS/storage/security markers.

## Project structure

```text
src/
  app/
    (auth)/             authentication + onboarding
    (app)/              rental management modules
    api/                PDF endpoints
    actions.ts          server mutations
  components/           desktop/mobile UI and charts
  lib/
    supabase/            browser/server/proxy/admin clients
    data.ts              RLS-backed query layer
  types/
supabase/
  schema.sql             database, functions, RLS and Storage policies
  cron.sql               optional schedules
  seed.sql               testing notes
docs/
  SPEC_COVERAGE.md       section-by-section implementation map
scripts/
  validate-project.mjs   dependency-independent repository validation
  test-rent-engine.mjs   rent schedule/allocation regression tests
  security-audit.mjs     RLS/storage/security policy audit
```

## Deliberately outside this MVP

The original specification explicitly postponed the public rental marketplace, AI assistant, automated tenant screening, full accounting/payroll, smart locks/IoT, standalone mobile apps, advanced CRM, property valuation, mortgage management and automated bookkeeping integrations. Provider-specific MTN/Airtel/bank collection APIs and outbound SMS/WhatsApp services also require credentials/commercial accounts and are therefore left as later integrations; manual payment methods and receipt sharing are implemented now.

## 13. V1 launch-polish features

The October V1 polish release adds:

- unified operations calendar for rent due dates, lease expiries, inspections and maintenance deadlines
- first-run five-step product tour with replay from Settings
- owner-customizable dashboard KPI widgets/order
- sanitized activity timelines on tenants, properties, units, leases and payments
- Owner/Admin payment reversal with restored rent balances, voided receipts and permanent audit history
- dashboard/report data-freshness indicators
- installable PWA support for Android/desktop and iOS Add to Home Screen guidance
- offline maintenance/field-note drafts with later sync
- deterministic demo reset back to the bundled sample portfolio

### Upgrading an existing Supabase database

If `supabase/schema.sql` was already deployed before these V1 polish features, **do not wipe your database**. Apply:

```text
supabase/migrations/20261014_v1_launch_polish.sql
```

For a brand-new Supabase project, use the complete `supabase/schema.sql` instead.

### PWA behavior

The service worker caches the offline fallback and static install assets. Authenticated application HTML/API responses are intentionally network-only so private tenant and financial pages are not served from a stale shared cache.

### Demo reset behavior

Demo mode is backed by immutable fixtures in `src/lib/demo.ts`; writes are not persisted to those fixtures. The **Reset demo** action clears local offline drafts, product-tour state and Cache Storage, then reloads the original sample portfolio.

### V1 validation suite

`npm run check:v1` now runs the original 24-point V1 audit plus the launch-polish audit, demo-fixture audit, rent-engine regression cases and RLS/storage/security checks.
