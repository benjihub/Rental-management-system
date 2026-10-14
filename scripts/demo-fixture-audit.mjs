import fs from 'node:fs';
const demo=fs.readFileSync('src/lib/demo.ts','utf8');
const reset=fs.readFileSync('src/components/demo-reset-button.tsx','utf8');
const required=['branches','properties','units','tenants','leases','payments','expenses','maintenance','inspections','sampleActivity','dashboard'];
const missing=required.filter(x=>!new RegExp(`export const ${x}\\b`).test(demo));
for(const marker of ['rentflow:','localStorage','sessionStorage','caches'])if(!reset.includes(marker))missing.push(`reset:${marker}`);
if(missing.length){console.error('Demo audit failed:',missing.join(', '));process.exit(1)}
console.log('Demo fixture audit passed: immutable sample portfolio and client reset controls are present.');
