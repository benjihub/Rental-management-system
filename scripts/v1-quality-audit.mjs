import fs from 'node:fs';

const read=(p)=>fs.readFileSync(p,'utf8');
const checks=[
  ['Guided onboarding', 'src/components/onboarding-wizard.tsx', ['Step','Finish setup now','optional']],
  ['Dashboard drill-down', 'src/app/(app)/dashboard/page.tsx', ['/arrears','/payments','/units?status=VACANT']],
  ['Tenant 360 profile', 'src/app/(app)/tenants/[id]/page.tsx', ['Payment history','Lease history','Maintenance','Documents','Notes']],
  ['Lease safety/workflow', 'supabase/schema.sql', ['prevent_overlapping_active_leases','prevent_overlapping_lease']],
  ['Rent engine regression coverage', 'scripts/test-rent-engine.mjs', ['QUARTERLY','YEARLY','advance','grace']],
  ['Fast payment capture', 'src/components/payment-form.tsx', ['Find tenant','allocation-preview','Record payment & issue receipt']],
  ['Branded PDF/share receipt', 'src/app/(app)/receipts/[id]/page.tsx', ['/api/receipts/','wa.me/','Advance credit']],
  ['Arrears direct actions', 'src/app/(app)/arrears/page.tsx', ['Record payment','View tenant','WhatsApp reminder']],
  ['Vacancy to tenant/lease', 'src/app/(app)/units/page.tsx', ['Assign existing','New tenant','status=VACANT']],
  ['Global search', 'src/lib/data.ts', ['getGlobalSearch','receipt_number','reference']],
  ['Mobile navigation', 'src/components/mobile-nav.tsx', ['mobile-bottom-nav','mobile-menu-sheet']],
  ['Form quality', 'src/app/actions.ts', ['tenantSchema.parse','leaseSchema.parse','paymentSchema.parse','message=']],
  ['Role permissions', 'supabase/schema.sql', ['business_members','member_branch_access','can_access_branch']],
  ['RLS/storage security', 'scripts/security-audit.mjs', ['row level security','storage','tenant-documents']],
  ['Archive/data safety', 'src/app/actions.ts', ['archiveTenant','archiveProperty','archiveUnit','End the active lease']],
  ['Accurate reports', 'src/lib/data.ts', ['getReports','byProperty','byBranch','arrears']],
  ['CSV/PDF exports', 'src/app/api/export/[kind]/route.ts', ['tenants','payments','arrears','rent-charges','expenses','reports']],
  ['In-app notifications', 'src/lib/data.ts', ['getNotifications','refresh_operational_alerts']],
  ['Actionable empty states', 'src/components/empty-state.tsx', ['EmptyState']],
  ['Friendly error handling', 'src/app/error.tsx', ['Something went wrong','Try again']],
  ['Pagination/performance', 'src/lib/data.ts', ['getTenantsPage','getPaymentsPage','getRentChargesPage','getExpensesPage']],
  ['Consistent brand surface', 'src/app/globals.css', ['#177245','#10251b','#46b87a']],
  ['Commercial landing/legal', 'src/app/page.tsx', ['FAQ','Privacy','Terms','security']],
  ['Realistic demo mode', 'src/lib/demo.ts', ['Sunrise Apartments','payments','maintenance','dashboard']],
];
let failed=[];
for(const [name,path,tokens] of checks){
  if(!fs.existsSync(path)){failed.push(`${name}: missing ${path}`);continue;}
  const text=read(path).toLowerCase();
  for(const token of tokens){if(!text.includes(token.toLowerCase()))failed.push(`${name}: missing marker ${token} in ${path}`);}
}
if(failed.length){console.error('V1 quality audit failed:\n- '+failed.join('\n- '));process.exit(1);}
console.log(`V1 quality audit passed: ${checks.length}/24 requested launch-quality areas have implementation markers.`);
