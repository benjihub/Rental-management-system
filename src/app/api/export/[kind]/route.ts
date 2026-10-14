import { NextResponse } from 'next/server';
import { getExpenses,getPayments,getRentCharges,getReports,getTenants } from '@/lib/data';
function esc(v:unknown){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replaceAll('"','""')}"`:s}
function csv(headers:string[],rows:unknown[][]){return [headers,...rows].map(r=>r.map(esc).join(',')).join('\n')}
export async function GET(req:Request,{params}:{params:Promise<{kind:string}>}){const {kind}=await params;const url=new URL(req.url);let body='';
  if(kind==='tenants'){const rows=await getTenants();body=csv(['Name','Phone','Email','Branch','Property','Unit','Rent','Outstanding','Status'],rows.map(x=>[x.name,x.phone,x.email,x.branch,x.property,x.unit,x.rent,x.balance,x.status]));}
  else if(kind==='payments'){const rows=await getPayments();body=csv(['Receipt','Tenant','Property','Unit','Amount','Method','Date','Reference','Recorded by','Status','Reversal reason'],rows.map(x=>[x.receipt,x.tenant,x.property,x.unit,x.amount,x.method,x.date,x.reference,x.recordedBy,x.status||'RECEIVED',x.reversalReason||'']));}
  else if(kind==='arrears'){const rows=(await getRentCharges()).filter(x=>x.status==='OVERDUE'&&x.balance>0);body=csv(['Tenant','Phone','Property','Unit','Due date','Amount','Paid','Balance','Status'],rows.map(x=>[x.tenant,x.tenantPhone,x.property,x.unit,x.dueDate,x.amount,x.paid,x.balance,x.status]));}
  else if(kind==='rent-charges'){const rows=await getRentCharges();body=csv(['Tenant','Property','Unit','Period','Due date','Amount','Paid','Balance','Status'],rows.map(x=>[x.tenant,x.property,x.unit,x.period,x.dueDate,x.amount,x.paid,x.balance,x.status]));}
  else if(kind==='expenses'){const rows=await getExpenses();body=csv(['Description','Category','Branch','Property','Date','Method','Amount'],rows.map(x=>[x.description,x.category,x.branch,x.property,x.date,x.method,x.amount]));}
  else if(kind==='reports'){const r=await getReports(url.searchParams.get('from')||undefined,url.searchParams.get('to')||undefined);body=csv(['Property','Branch','Income','Expenses','Outstanding','Occupancy %','Net cash'],r.byProperty.map(x=>[x.property,x.branch,x.income,x.expenses,x.outstanding,x.occupancy,x.net]));}
  else return NextResponse.json({error:'Unknown export type'},{status:404});
  return new NextResponse('\uFEFF'+body,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="rentflow-${kind}-${new Date().toISOString().slice(0,10)}.csv"`,'Cache-Control':'no-store'}});
}
