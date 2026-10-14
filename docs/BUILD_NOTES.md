# Build notes

## Core accounting decisions

- Properties and units are separate.
- Unit occupancy is synchronized from active lease state.
- Rent owed is represented by rent charges, not a manually edited balance.
- A payment can be allocated across multiple charges.
- Arrears are derived from overdue outstanding charges.
- Grace periods affect overdue status.
- Monthly, quarterly and yearly leases are supported; `rent_amount` is the monthly rate and quarterly/yearly charge amounts are multiplied by 3/12.
- Active backdated leases generate obligations from the start month through the current month.
- Receipt numbering is isolated by business and calendar year.

## Security decisions

- `business_id` is present on business-owned tables.
- RLS is the customer boundary.
- Managers/Agents receive explicit branch access.
- Tenant/expense Storage objects are private and branch scoped.
- Service-role operations are guarded by an Owner/Admin check before the admin client is created.
- Records with history are archived instead of hard-deleted in normal UI workflows.

## External integrations intentionally requiring owner credentials

- Supabase project keys
- Supabase service-role key
- Production SMTP
- Future MTN MoMo/Airtel/bank APIs
- Future outbound SMS/WhatsApp provider

## V1 launch-quality hardening

- High-volume operational lists use server-side pagination.
- Financial reports fetch only the selected charge/payment/expense date range in live mode.
- Common search/filter columns have PostgreSQL indexes.
- Global search covers tenant identity/contact, units, properties, receipts and payment references.
- Vacant units support both assigning an existing tenant and registering a new tenant directly into a pre-filled lease.
- Payment capture includes tenant search, automatic active-lease selection and allocation preview.
- Advance payment is retained as unallocated credit and automatically applied by the rent engine to the next generated obligation.
- Consequential archive/waive/lease actions require confirmation.
- Successful form mutations return visible feedback banners; production errors are handled by a friendly error boundary.
- The public surface includes a full landing page, product preview, workflow/security explanations, FAQ, privacy and terms templates.
- `npm run check:v1` audits all 24 launch-quality requirements in addition to accounting and RLS tests.
