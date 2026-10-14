'use client';
import { useState } from 'react';
import { GripVertical,Settings2,ChevronUp,ChevronDown } from 'lucide-react';
import { saveDashboardWidgets } from '@/app/actions';
import { SubmitButton } from '@/components/confirm-submit';

export const widgetCatalog=[
  ['outstanding','Outstanding rent'],['collected','Collected this month'],['vacant','Vacant units'],['properties','Properties'],['occupancy','Occupancy'],['expenses','Expenses this month'],['net','Net cash collected']
] as const;
export function DashboardWidgetCustomizer({current}:{current:string[]}){
  const fallback=widgetCatalog.slice(0,4).map(x=>x[0]);const [open,setOpen]=useState(false);const [items,setItems]=useState<string[]>(current?.length?current:fallback);
  const selected=new Set(items);
  const move=(i:number,d:number)=>setItems(old=>{const n=[...old],j=i+d;if(j<0||j>=n.length)return old;[n[i],n[j]]=[n[j],n[i]];return n});
  const toggle=(key:string)=>setItems(old=>old.includes(key)?old.filter(x=>x!==key):[...old,key]);
  return <><button className="btn btn-secondary" onClick={()=>setOpen(true)}><Settings2 size={16}/> Customize dashboard</button>{open&&<div className="modal-backdrop" onMouseDown={()=>setOpen(false)}><div className="modal" onMouseDown={e=>e.stopPropagation()}><div className="modal-head"><h2>Dashboard widgets</h2><button className="icon-btn" onClick={()=>setOpen(false)}>×</button></div><form action={saveDashboardWidgets} className="modal-body"><p className="subtle">Choose which KPI cards appear and move them into the order you want. Your layout is saved to your account.</p><div className="widget-picker">{widgetCatalog.map(([key,label])=><label key={key} className={`widget-choice ${selected.has(key)?'selected':''}`}><input type="checkbox" checked={selected.has(key)} onChange={()=>toggle(key)}/><span>{label}</span></label>)}</div><div className="widget-order">{items.map((key,i)=>{const label=widgetCatalog.find(x=>x[0]===key)?.[1]||key;return <div key={key}><GripVertical size={16}/><span>{label}</span><button type="button" className="icon-btn tiny" onClick={()=>move(i,-1)} disabled={i===0}><ChevronUp size={14}/></button><button type="button" className="icon-btn tiny" onClick={()=>move(i,1)} disabled={i===items.length-1}><ChevronDown size={14}/></button><input type="hidden" name="widgets" value={key}/></div>})}</div><div className="form-actions"><button type="button" className="btn btn-secondary" onClick={()=>setOpen(false)}>Cancel</button><SubmitButton>Save layout</SubmitButton></div></form></div></div>}</>;
}
