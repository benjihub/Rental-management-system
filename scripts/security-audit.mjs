import fs from 'node:fs';import assert from 'node:assert/strict';
const s=fs.readFileSync('supabase/schema.sql','utf8');
const tables=['businesses','business_members','branches','member_branch_access','properties','units','tenants','leases','rent_charges','payments','payment_allocations','receipts','expense_categories','expenses','maintenance_requests','documents','staff_invitations','notifications','audit_logs','inspections','activity_events'];
for(const t of tables)assert.match(s,new RegExp(`alter table public\\.${t} enable row level security`),`RLS missing for ${t}`);
for(const token of ['business_id','can_access_branch','can_access_property','can_access_unit','can_access_tenant','tenant-documents','expense-documents','prevent_overlapping_active_leases','audit_row_change','Only an Owner or Admin can reverse payments','reverse_rent_payment','validate_inspection_scope'])assert.ok(s.includes(token),`Security marker missing: ${token}`);
assert.ok(!/SUPABASE_SERVICE_ROLE_KEY[^\n]*NEXT_PUBLIC/i.test(fs.readFileSync('.env.example','utf8')),'Service role must never be public');
console.log(`Security audit passed: RLS checked on ${tables.length} business tables plus storage, branch-scoping, overlap and audit markers.`);
