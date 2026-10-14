'use client';
import { useMemo, useState } from 'react';
import { recordPayment } from '@/app/actions';
import { money } from '@/lib/utils';
import type { Lease, RentCharge, Tenant } from '@/types';
import { SubmitButton } from '@/components/confirm-submit';

export function PaymentForm({tenants,leases,charges,currency='UGX',initialTenant=''}:{tenants:Tenant[];leases:Lease[];charges:RentCharge[];currency?:string;initialTenant?:string}){
  const [tenantId,setTenantId]=useState(initialTenant);
  const [tenantSearch,setTenantSearch]=useState('');
  const visibleTenants=useMemo(()=>{const q=tenantSearch.trim().toLowerCase();return tenants.filter(t=>t.status==='ACTIVE'&&(!q||`${t.name} ${t.phone} ${t.email||''}`.toLowerCase().includes(q)));},[tenants,tenantSearch]);
  const eligible=useMemo(()=>leases.filter(l=>l.tenantId===tenantId&&['ACTIVE','ENDING_SOON'].includes(l.status)),[leases,tenantId]);
  const [leaseId,setLeaseId]=useState(()=>eligible[0]?.id||'');
  const selectedLease=leases.find(l=>l.id===leaseId); const outstanding=charges.filter(c=>c.leaseId===leaseId&&c.balance>0).sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
  const total=outstanding.reduce((s,c)=>s+c.balance,0);
  function tenantChanged(id:string){setTenantId(id);const first=leases.find(l=>l.tenantId===id&&['ACTIVE','ENDING_SOON'].includes(l.status));setLeaseId(first?.id||'');}
  return <form action={recordPayment}>
    <div className="form-grid">
      <div className="field full"><label>Find tenant</label><input className="input" type="search" value={tenantSearch} onChange={e=>setTenantSearch(e.target.value)} placeholder="Type name, phone or email…"/><small>{visibleTenants.length} matching tenant{visibleTenants.length===1?'':'s'}</small></div>
      <div className="field"><label>Tenant</label><select className="select" name="tenant_id" value={tenantId} onChange={e=>tenantChanged(e.target.value)} required><option value="">Select tenant</option>{visibleTenants.map(t=><option key={t.id} value={t.id}>{t.name} · {t.phone}</option>)}</select></div>
      <div className="field"><label>Active lease</label><select className="select" name="lease_id" value={leaseId} onChange={e=>setLeaseId(e.target.value)} required><option value="">Select lease</option>{eligible.map(l=><option key={l.id} value={l.id}>{l.property} · {l.unit}</option>)}</select></div>
      <div className="field"><label>Amount received</label><input className="input" name="amount" type="number" min="1" max="999999999999" defaultValue={total||selectedLease?.rent||''} required/></div>
      <div className="field"><label>Payment date</label><input className="input" name="payment_date" type="date" defaultValue={new Date().toISOString().slice(0,10)} required/></div>
      <div className="field"><label>Method</label><select className="select" name="payment_method" defaultValue="MTN Mobile Money"><option>Cash</option><option>MTN Mobile Money</option><option>Airtel Money</option><option>Bank transfer</option><option>Card</option><option>Other</option></select></div>
      <div className="field"><label>Reference</label><input className="input" name="reference" placeholder="MoMo / bank reference"/></div>
      <div className="field full"><label>Notes</label><textarea className="textarea" name="notes" placeholder="Optional payment note"/></div>
    </div>
    {leaseId&&<div className="allocation-preview"><div><b>Outstanding on this lease</b><strong>{money(total,currency)}</strong></div>{outstanding.length?<ul>{outstanding.slice(0,4).map(c=><li key={c.id}><span>{new Date(c.dueDate).toLocaleDateString()} · {c.status.replaceAll('_',' ')}</span><b>{money(c.balance,currency)}</b></li>)}</ul>:<p className="subtle">No unpaid rent charges. Any excess becomes advance credit and will automatically apply to the next generated rent charge.</p>}<small>Payments allocate automatically to the oldest unpaid charge first.</small></div>}
    <div className="form-actions"><SubmitButton pendingText="Recording payment…">Record payment & issue receipt</SubmitButton></div>
  </form>;
}
