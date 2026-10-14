'use client';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
export function GlobalSearch(){const router=useRouter();const [q,setQ]=useState('');return <form className="top-search" onSubmit={e=>{e.preventDefault();if(q.trim().length>=2)router.push(`/search?q=${encodeURIComponent(q.trim())}`)}}><Search size={15}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search tenant, unit, receipt…" aria-label="Global search"/></form>}
