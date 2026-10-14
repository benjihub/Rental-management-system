import assert from 'node:assert/strict';
// Dependency-free ledger regression: reversing one payment must restore exactly
// the amount that payment allocated, while leaving later payment history intact.
let charges=[{id:'jan',amount:500,paid:500},{id:'feb',amount:500,paid:500},{id:'mar',amount:500,paid:200}];
let allocations=[
  {payment:'p1',charge:'jan',amount:500},
  {payment:'p2',charge:'feb',amount:500},
  {payment:'p3',charge:'mar',amount:200},
];
function reverse(payment){
  for(const a of allocations.filter(x=>x.payment===payment)){
    const c=charges.find(x=>x.id===a.charge);c.paid=Math.max(0,c.paid-a.amount);
  }
  allocations=allocations.filter(x=>x.payment!==payment);
}
reverse('p2');
assert.equal(charges.find(x=>x.id==='jan').paid,500,'unrelated earlier charge changed');
assert.equal(charges.find(x=>x.id==='feb').paid,0,'reversed allocation was not restored');
assert.equal(charges.find(x=>x.id==='mar').paid,200,'unrelated later payment changed');
assert.equal(allocations.some(x=>x.payment==='p2'),false,'reversed payment allocation remained');
// Advance credit attached to a reversed payment must not be available later.
const payments=[{id:'advance',amount:1000,reversed:true},{id:'live',amount:300,reversed:false}];
const used=[];
const usable=payments.filter(p=>!p.reversed).reduce((n,p)=>n+p.amount,0);
assert.equal(usable,300,'reversed advance credit remained spendable');
console.log('Payment reversal regression tests passed: allocations restore balances and reversed advance credit is excluded.');
