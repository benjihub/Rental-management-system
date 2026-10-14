# Supabase integration regression checklist

Run these against a disposable Supabase project after applying `schema.sql`.

1. Create two owner accounts and two businesses. Confirm Business A cannot select any Business B branch/property/unit/tenant/lease/payment/document row.
2. Add a Manager with access to only Branch A. Confirm Branch B properties, units, tenants, leases, payments, expenses and private files are inaccessible.
3. Activate a monthly lease starting three months in the past and run `generate_rent_charges_range`; confirm one idempotent charge per month.
4. Repeat with quarterly and yearly leases; confirm only 3-month and 12-month boundaries generate obligations and amounts are 3x/12x monthly rent.
5. Set a grace period and verify `refresh_charge_statuses()` does not mark overdue until the grace period has elapsed.
6. Pay only part of a charge; confirm `payment_allocations`, `paid_amount`, charge status and receipt agree.
7. Pay more than the current outstanding amount; generate the next charge and confirm `apply_unallocated_payments()` applies the advance automatically.
8. Attempt to activate overlapping leases for the same unit and confirm the database rejects the second activation.
9. Attempt to archive/deactivate a unit/property/branch with an active lease through the app and confirm the operation is blocked.
10. Upload tenant and expense files as a branch-restricted manager and verify signed access cannot cross into another branch.
