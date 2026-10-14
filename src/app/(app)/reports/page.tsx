import Link from 'next/link';
import { PageHead, Status } from '@/components/ui';
import { getBusinessInfo, getReports, getDataFreshness } from '@/lib/data';
import { FreshnessBadge } from '@/components/freshness-badge';
import { money } from '@/lib/utils';

export default async function Reports({searchParams}:{searchParams:Promise<{from?:string;to?:string}>}){
  const q=await searchParams;
  const [business,r,fresh]=await Promise.all([getBusinessInfo(),getReports(q.from,q.to),getDataFreshness()]);
  const c=business?.currency||'UGX';
  return <div className="content">
    <PageHead title="Reports" description="Collection, occupancy, arrears, expenses and property performance for any date range." action={<FreshnessBadge timestamp={fresh.reportsUpdated} label="Report data updated"/>}/>
    <form className="filter-bar">
      <div className="field"><label>From</label><input className="input" name="from" type="date" defaultValue={r.from}/></div>
      <div className="field"><label>To</label><input className="input" name="to" type="date" defaultValue={r.to}/></div>
      <button className="btn btn-primary">Apply period</button>
      <Link className="btn btn-secondary" href={`/api/reports/pdf?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}>Download PDF</Link><a className="btn btn-secondary" href={`/api/export/reports?from=${encodeURIComponent(r.from)}&to=${encodeURIComponent(r.to)}`}>Export CSV</a>
    </form>
    <div className="grid stats">
      <div className="stat-card"><div className="stat-top">Expected rent</div><div className="stat-value">{money(r.expected,c)}</div></div>
      <div className="stat-card"><div className="stat-top">Collected</div><div className="stat-value">{money(r.collected,c)}</div><div className="stat-foot">{r.collectionRate}% collection rate</div></div>
      <div className="stat-card"><div className="stat-top">Outstanding</div><div className="stat-value">{money(r.outstanding,c)}</div></div>
      <div className="stat-card"><div className="stat-top">Expenses / net</div><div className="stat-value">{money(r.expenses,c)}</div><div className="stat-foot">Net cash {money(r.collected-r.expenses,c)}</div></div>
    </div>
    <div className="grid stats">
      <div className="stat-card"><div className="stat-top">Total units</div><div className="stat-value">{r.totalUnits}</div></div>
      <div className="stat-card"><div className="stat-top">Occupied</div><div className="stat-value">{r.occupiedUnits}</div></div>
      <div className="stat-card"><div className="stat-top">Vacant</div><div className="stat-value">{r.vacantUnits}</div></div>
      <div className="stat-card"><div className="stat-top">Occupancy</div><div className="stat-value">{r.occupancy}%</div></div>
    </div>
    <section className="card">
      <div className="card-head"><h2>Property performance</h2><span className="subtle">Income, costs, arrears, occupancy and net cash</span></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Property</th><th>Branch</th><th>Income</th><th>Expenses</th><th>Outstanding</th><th>Occupancy</th><th>Net cash</th></tr></thead><tbody>{r.byProperty.map(x=><tr key={x.property}><td><b>{x.property}</b></td><td>{x.branch}</td><td>{money(x.income,c)}</td><td>{money(x.expenses,c)}</td><td>{money(x.outstanding,c)}</td><td>{x.occupancy}%</td><td><b>{money(x.net,c)}</b></td></tr>)}</tbody></table></div>
    </section>
    <section className="card">
      <div className="card-head"><h2>Branch performance</h2></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>Branch</th><th>Units</th><th>Occupancy</th><th>Income</th><th>Expenses</th><th>Outstanding</th><th>Net</th></tr></thead><tbody>{r.byBranch.map(x=><tr key={x.branch}><td><b>{x.branch}</b></td><td>{x.units}</td><td>{x.occupancy}%</td><td>{money(x.income,c)}</td><td>{money(x.expenses,c)}</td><td>{money(x.outstanding,c)}</td><td><b>{money(x.net,c)}</b></td></tr>)}</tbody></table></div>
    </section>
    <div className="grid two-col">
      <section className="card"><div className="card-head"><h2>Income by day</h2></div><div className="table-wrap"><table className="table"><thead><tr><th>Date</th><th>Collected</th></tr></thead><tbody>{r.byDay.map(x=><tr key={x.period}><td>{x.period}</td><td>{money(x.amount,c)}</td></tr>)}</tbody></table></div></section>
      <section className="card"><div className="card-head"><h2>Monthly movement</h2></div><div className="table-wrap"><table className="table"><thead><tr><th>Month</th><th>Expected</th><th>Income</th><th>Expenses</th></tr></thead><tbody>{r.byMonth.map(x=><tr key={x.period}><td>{x.period}</td><td>{money(x.expected,c)}</td><td>{money(x.income,c)}</td><td>{money(x.expenses,c)}</td></tr>)}</tbody></table></div></section>
    </div>
    <div className="grid two-col">
      <section className="card"><div className="card-head"><h2>Expenses by category</h2></div><div className="card-body">{r.byCategory.length?r.byCategory.map(x=><div className="kpi-line" key={x.category}><strong>{x.category}</strong><span>{money(x.amount,c)}</span></div>):<p className="subtle">No expenses in this period.</p>}</div></section>
      <section className="card"><div className="card-head"><h2>Expenses by period</h2></div><div className="card-body">{r.expenseByMonth.map(x=><div className="kpi-line" key={x.period}><strong>{x.period}</strong><span>{money(x.amount,c)}</span></div>)}</div></section>
    </div>
    <section className="card"><div className="card-head"><h2>Arrears report</h2><span className="subtle">{r.arrears.length} overdue charges</span></div><div className="table-wrap"><table className="table"><thead><tr><th>Tenant</th><th>Property / unit</th><th>Due</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>{r.arrears.map(x=><tr key={x.id}><td><b>{x.tenant}</b></td><td>{x.property} · {x.unit}</td><td>{x.dueDate}</td><td>{money(x.amount,c)}</td><td>{money(x.paid,c)}</td><td>{money(x.balance,c)}</td><td><Status value={x.status}/></td></tr>)}</tbody></table></div></section>
  </div>;
}
