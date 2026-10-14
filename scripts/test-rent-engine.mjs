import assert from 'node:assert/strict';

function monthStart(s){const d=new Date(`${s}T00:00:00Z`);return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),1));}
function monthsBetween(a,b){return (b.getUTCFullYear()-a.getUTCFullYear())*12+(b.getUTCMonth()-a.getUTCMonth())}
function chargeMonths(start,to,frequency){const first=monthStart(start),last=monthStart(to),step=frequency==='MONTHLY'?1:frequency==='QUARTERLY'?3:12;const out=[];for(let d=new Date(first);d<=last;d=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1))){if(monthsBetween(first,d)%step===0)out.push(d.toISOString().slice(0,10));}return out;}
function amount(monthly,frequency){return monthly*(frequency==='MONTHLY'?1:frequency==='QUARTERLY'?3:12)}
function status({due,grace,paid,total,today}){if(paid>=total)return 'PAID';const overdueAt=new Date(`${due}T00:00:00Z`);overdueAt.setUTCDate(overdueAt.getUTCDate()+grace);const now=new Date(`${today}T00:00:00Z`);if(overdueAt<now)return 'OVERDUE';if(paid>0)return 'PARTIALLY_PAID';if(new Date(`${due}T00:00:00Z`)>now)return 'UPCOMING';return 'UNPAID';}
function allocate(payment,charges){let remaining=payment;const allocations=[];for(const c of charges){if(remaining<=0)break;const due=Math.max(0,c.amount-c.paid);const use=Math.min(remaining,due);if(use>0){c.paid+=use;remaining-=use;allocations.push([c.id,use]);}}return {remaining,allocations};}

assert.deepEqual(chargeMonths('2026-01-15','2026-04-30','MONTHLY'),['2026-01-01','2026-02-01','2026-03-01','2026-04-01'],'monthly backfill');
assert.deepEqual(chargeMonths('2026-01-15','2026-10-31','QUARTERLY'),['2026-01-01','2026-04-01','2026-07-01','2026-10-01'],'quarterly schedule');
assert.deepEqual(chargeMonths('2026-01-15','2027-02-01','YEARLY'),['2026-01-01','2027-01-01'],'yearly schedule');
assert.equal(amount(700000,'MONTHLY'),700000);assert.equal(amount(700000,'QUARTERLY'),2100000);assert.equal(amount(700000,'YEARLY'),8400000);
assert.equal(status({due:'2026-10-05',grace:5,paid:0,total:700000,today:'2026-10-10'}),'UNPAID','grace period holds overdue status');
assert.equal(status({due:'2026-10-05',grace:5,paid:0,total:700000,today:'2026-10-11'}),'OVERDUE','overdue after grace period');
assert.equal(status({due:'2026-10-05',grace:5,paid:200000,total:700000,today:'2026-10-08'}),'PARTIALLY_PAID');
let charges=[{id:'jan',amount:500000,paid:0},{id:'feb',amount:500000,paid:0}];let r=allocate(700000,charges);assert.deepEqual(r.allocations,[['jan',500000],['feb',200000]]);assert.equal(charges[1].paid,200000);assert.equal(r.remaining,0);
charges=[{id:'oct',amount:700000,paid:0}];r=allocate(1000000,charges);assert.equal(r.remaining,300000,'advance remains after current charge');charges.push({id:'nov',amount:700000,paid:0});r=allocate(r.remaining,[charges[1]]);assert.equal(charges[1].paid,300000,'advance applies to next generated charge');assert.equal(charges[1].amount-charges[1].paid,400000);
console.log('Rent engine regression tests passed: monthly/quarterly/yearly schedules, backfill, grace periods, partial allocation and advance credit.');
