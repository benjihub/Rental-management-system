# RentFlow — Specification Coverage

This file maps the 33-section MVP specification to the implementation.

| Section | Status | Implementation |
|---|---|---|
| 1 Product vision | Complete | Multi-business rental operations app and dashboard |
| 2 Core hierarchy | Complete | businesses, branches, properties, units, tenants, leases, charges, payments |
| 3 User roles | Complete | OWNER, ADMIN, MANAGER, AGENT + branch-scoped RLS; tenant portal remains later exactly as specified |
| 4 Navigation | Complete | Desktop grouped sidebar + mobile bottom nav/module sheet |
| 5 Authentication | Complete | signup, verification callback, login, logout, forgot/reset/change password |
| 6 Business onboarding | Complete | Four-step onboarding wizard + logo + bulk initial units |
| 7 Dashboard | Complete | property/unit counts, occupancy, expected/collected/outstanding, expenses, recent payments, arrears, vacancies, expirations |
| 8 Branch management | Complete | list, manager, counts, create/edit/archive |
| 9 Property management | Complete | types, branch, address, floors, description, image, archive |
| 10 Unit management | Complete | type/floor/bed/bath/rent/deposit/status/description + bulk create; occupancy follows lease |
| 11 Tenant management | Complete | full profile, emergency fields, active rental/balance, history, documents, maintenance |
| 12 Lease management | Complete | terms, deposits, monthly/quarterly/yearly, due day/grace, statuses, activation/termination/cancel/renewal |
| 13 Rent charges | Complete | generated obligations, backfill, status refresh, grace period and unique charge periods |
| 14 Payments | Complete | cash/MoMo/bank/card/other, references, notes, date and recorder |
| 15 Allocation | Complete | atomic oldest-first partial allocation + over-allocation guard |
| 16 Receipts | Complete | unique receipt numbers, logo/business/tenant/unit/amount/method/date/balance/recorder/footer, PDF/WhatsApp/email/print |
| 17 Arrears | Complete | derived from overdue charges with total, tenant, property/unit, due date, days overdue and record-payment action |
| 18 Expenses | Complete | categories, branch/property, method/date/receipt upload, reports |
| 19 Maintenance | Complete | issue/description/priority/status/date/assignment/estimated/actual costs/history |
| 20 Reports | Complete | rent collection, occupancy, arrears, income day/month/property/branch, expense category/property/branch/period, property performance + PDF |
| 21 Staff | Complete | invitations, roles, status, branch assignments, UI and RLS checks |
| 22 Notifications | Complete for MVP | in-app due/overdue/lease/payment/maintenance alerts; external SMS/WhatsApp/email remain future as specified |
| 23 Settings | Complete | business identity/logo/contact/currency/footer/default due/grace + profile/photo/email/password + staff access |
| 24 Database schema | Complete | all specified tables plus operational support tables (counter/invitations/notifications) |
| 25 Multi-tenant security | Complete | business_id + RLS + branch-scoped helpers + Storage scoping |
| 26 Constraints | Complete | one active lease/unit, positive values, allocation guards, unique receipts/memberships, archive flows |
| 27 Technology stack | Complete | Next.js/TS/Tailwind/shadcn-compatible primitives/Supabase/Postgres/Auth/Storage/Vercel-ready/PDF/Recharts/Zod/RHF |
| 28 Project structure | Complete | route/component/lib/service-equivalent data/actions/types separation |
| 29 Development phases | Complete | all Phase 1–10 capabilities are represented in the final repository |
| 30 First version definition | Complete | all 16 completion criteria implemented |
| 31 Excluded features | Honored | intentionally not added to MVP |
| 32 Product principle | Honored | dashboard/workflows center occupancy, debt, payments and performance |
| 33 First milestone | Superseded/complete | project includes the first milestone and all subsequent MVP phases |

## Credential-dependent items

The code is complete for these flows, but the deployed environment must supply external credentials:

- Supabase URL/publishable key
- Supabase service-role key for staff invitations
- Production SMTP settings if using real email delivery

No source-code rewrite is required when those values are added.

# V1 Perfection Pass — Required Launch Quality

The following items were promoted from refinement ideas into required V1 scope and are implemented in this repository.

| # | V1 requirement | Implementation |
|---|---|---|
| 1 | Guided onboarding | Four-step progress wizard; branch/property/unit steps can be skipped after the business is created; clear optional labels and completion path |
| 2 | Dashboard clarity | Outstanding, collected, vacancy and portfolio metrics are prioritized; cards drill into arrears, payments, vacant units and properties; quick actions added |
| 3 | Tenant 360° | Profile includes contact/identity, current rental, balance, lease/payment history, private documents, maintenance, notes and direct actions |
| 4 | Lease workflow | Create/draft/activate/end/terminate/cancel/renew flows; pre-filled tenant/unit handoff; database overlap trigger prevents double booking |
| 5 | Rent engine quality | Monthly/quarterly/yearly generation, backfill, due dates/grace periods, partial payments, arrears and advance credit; regression suite included |
| 6 | Fast payment recording | Tenant search, active-lease selection, amount/method/reference, allocation preview, oldest-first allocation and automatic receipt redirect |
| 7 | Professional receipts | Branded responsive receipt, real server PDF, print, email and tenant-targeted WhatsApp share, outstanding and advance-credit display |
| 8 | Arrears management | Total overdue, tenant/property/unit, oldest due date, days overdue and direct record-payment/profile/reminder actions |
| 9 | Vacancy visibility | Unit status filters, vacancy counts, assign-existing-tenant action and register-new-tenant → pre-filled lease handoff |
| 10 | Search | Global search across tenants/phones, properties, units, receipts and payment references plus page-level table filtering |
| 11 | Mobile usability | Responsive dashboard/forms/tables/receipts/landing page, mobile bottom navigation and compact module access |
| 12 | Form quality | Server-side Zod validation on critical financial/tenancy flows, native field constraints, pending states, confirmation prompts and success banners |
| 13 | Permissions | Owner/Admin/Manager/Agent role-aware navigation/actions plus branch restrictions; security checklist included for live multi-account testing |
| 14 | Security | RLS on business tables, storage bucket policies, business isolation, branch-access helpers and automated security marker audit |
| 15 | Data safety | Archive/deactivate instead of destructive deletes for core records; active-lease guards; confirmations for consequential actions |
| 16 | Reports | Collection, arrears, occupancy, income, expenses, branch/property performance and period filters |
| 17 | Exports | CSV for tenants, payments, arrears, rent charges, expenses and report summaries; PDF for receipts and reports |
| 18 | Notifications | In-app overdue, rent-due, lease-expiry, payment and maintenance notifications with read state |
| 19 | Empty states | Actionable empty-state messages across core operational modules and filtered tables |
| 20 | Error handling | Root error boundary and 404 UI hide raw production framework/database errors; auth flows return user-readable messages |
| 21 | Performance | Server pagination on high-volume tenant/payment/charge/expense views, query limits and indexes for common lookup/filter columns |
| 22 | Branding | Consistent forest/emerald green design tokens, cards, tables, forms, navigation, receipts and public marketing surface |
| 23 | Landing page | Public marketing page with product positioning, feature showcase, workflow explanation, security, visual product preview, CTAs, FAQ, privacy and terms |
| 24 | Demo mode | Read-only realistic rental portfolio with properties, units, tenants, leases, payments, arrears, maintenance, reports and dashboard metrics |

## V1 validation included

Run the dependency-independent checks:

```bash
npm run check:v1
```

This performs repository structure validation, rent-engine regression tests and a security/RLS policy audit. After `npm install`, also run:

```bash
npm run typecheck
npm run lint
npm run build
```

The rent-engine regression suite covers monthly, quarterly and yearly schedules, backdated generation, grace periods, partial allocation and advance credit carried into the next rent charge.

# V1 Launch Polish — October 2026

These capabilities are also part of V1 and are implemented end-to-end:

| Capability | V1 implementation |
|---|---|
| Operations calendar | Monthly calendar combines rent due dates, lease expiries, scheduled inspections and maintenance deadlines. Inspections can be scheduled, assigned, completed or cancelled. |
| First-run product tour | Five-step guided tour highlights Dashboard, Tenants, Leases, Payments and Reports. Completion is stored per user and can be replayed from Settings. |
| Custom dashboard widgets | Owners can choose and order KPI cards; the layout is stored in the profile `preferences` JSON. |
| Activity timelines | Sanitized chronological activity is available on tenant, property, unit, lease and payment detail pages without exposing raw audit JSON. |
| Payment reversal | Owner/Admin-only reversal restores rent-charge balances, removes allocations, voids the receipt, excludes reversed cash from reporting and retains the reason in audit/activity history. The database RPC enforces the role as well as the UI. |
| Data freshness | Dashboard and Reports show relative freshness based on the newest rent/financial/maintenance data. |
| Installable PWA | Web manifest, icons, service worker registration, browser install prompt and iOS Add-to-Home-Screen guidance are included. Authenticated dynamic HTML is deliberately not cached. |
| Offline field capture | Maintenance issues/notes can be drafted to local device storage without connectivity and synced into the live workspace when online. |
| Clean demo reset | Demo data is immutable source fixtures. Reset clears local tour/offline/cache state and reloads the known sample portfolio. |

## Existing-database upgrade

For a new Supabase project, run `supabase/schema.sql` as usual.

For a database that already had the earlier V1 schema, apply:

```text
supabase/migrations/20261014_v1_launch_polish.sql
```

The migration adds profile preferences, inspection scheduling, maintenance deadlines, activity events, payment reversal fields/functions and the related indexes/RLS policies without deleting existing rental records.
