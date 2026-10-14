import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const checks=[
  ['Operations calendar','src/app/(app)/calendar/page.tsx',['Rent due','Lease expiry','Inspection','Maintenance','Schedule inspection']],
  ['Calendar data sources','src/lib/data.ts',['getCalendarEvents','RENT_DUE','LEASE_END','INSPECTION','MAINTENANCE']],
  ['First-run product tour','src/components/product-tour.tsx',['dashboard','tenants','leases','payments','reports','completeProductTour']],
  ['Dashboard personalization','src/components/dashboard-widget-customizer.tsx',['Customize dashboard','widgets','Save layout']],
  ['Dashboard preferences storage','supabase/schema.sql',['profiles add column if not exists preferences']],
  ['Entity activity timeline','src/components/activity-timeline.tsx',['Activity','occurredAt']],
  ['Timeline database','supabase/schema.sql',['activity_events','capture_activity_event','sanitized chronological history']],
  ['Payment reversal UI','src/app/(app)/payments/[id]/page.tsx',['Reverse payment','reversal reason','does not delete']],
  ['Payment reversal transaction','supabase/schema.sql',['reverse_rent_payment','Only an Owner or Admin can reverse payments','voided_at','delete from public.payment_allocations']],
  ['Reversed cash excluded from reports','src/lib/data.ts',['activePayments=pp.filter(p=>!p.reversedAt)']],
  ['Freshness indicators','src/components/freshness-badge.tsx',['Updated','freshness','relative']],
  ['PWA manifest','public/manifest.webmanifest',['standalone','/icons/icon-192.png','/icons/icon-512.png']],
  ['PWA service worker','public/sw.js',['offline','cache']],
  ['PWA registration/install','src/components/pwa-client.tsx',['serviceWorker','beforeinstallprompt','Add to Home Screen']],
  ['Offline field capture','src/components/offline-maintenance-drafts.tsx',['localStorage','Offline field drafts','syncOfflineMaintenanceDraft']],
  ['Demo reset','src/components/demo-reset-button.tsx',['rentflow:','caches','Reset']],
  ['Demo fixture reset semantics','src/lib/demo.ts',['Sunrise Apartments','inspections','sampleActivity']],
  ['Upgrade migration','supabase/migrations/20261014_v1_launch_polish.sql',['activity_events','reverse_rent_payment','inspections','preferences']],
];
const failures=[];
for(const [name,path,tokens] of checks){
  if(!fs.existsSync(path)){failures.push(`${name}: missing ${path}`);continue;}
  const text=read(path).toLowerCase();
  for(const token of tokens) if(!text.includes(token.toLowerCase())) failures.push(`${name}: missing marker "${token}" in ${path}`);
}
for(const icon of ['public/icons/icon-192.png','public/icons/icon-512.png','public/icons/icon-512-maskable.png']) if(!fs.existsSync(icon)||fs.statSync(icon).size<500)failures.push(`PWA icon missing/invalid: ${icon}`);
if(failures.length){console.error('V1 polish audit failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`V1 polish audit passed: ${checks.length}/${checks.length} launch-polish capability groups verified.`);
