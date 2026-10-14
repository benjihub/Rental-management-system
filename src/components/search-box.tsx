'use client';
import { Search, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';

export function SearchBox({placeholder='Search...', initialValue=''}:{placeholder?:string;initialValue?:string}){
  const [value,setValue]=useState(initialValue); const id=useId();
  useEffect(()=>{
    const input=document.getElementById(id); const scope=input?.closest('.content')||document;
    const needle=value.trim().toLowerCase();
    const rows=Array.from(scope.querySelectorAll('tbody tr, [data-searchable]')) as HTMLElement[];
    rows.forEach(row=>{const hay=(row.dataset.search||row.textContent||'').toLowerCase();row.style.display=!needle||hay.includes(needle)?'':'none';});
    const empty=scope.querySelector('[data-filter-empty]') as HTMLElement|null;
    if(empty){const visible=rows.filter(r=>r.style.display!=='none').length;empty.style.display=needle&&visible===0?'block':'none';}
  },[value,id]);
  return <div className="search"><Search size={16}/><input id={id} value={value} onChange={e=>setValue(e.target.value)} placeholder={placeholder} aria-label={placeholder}/>{value&&<button type="button" className="search-clear" onClick={()=>setValue('')} aria-label="Clear search"><X size={14}/></button>}</div>;
}
