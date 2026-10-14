'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Gauge, Building2, Users, WalletCards, Menu, X, GitBranch, DoorOpen, FileSignature, ClipboardList, AlertTriangle, ReceiptText, Wrench, BarChart3, UserCog, Settings, Bell, ScrollText, CalendarDays, ArrowLeft } from 'lucide-react';

const allLinks=[
  ['Dashboard','/dashboard',Gauge],['Calendar','/calendar',CalendarDays],['Notifications','/notifications',Bell],['Branches','/branches',GitBranch],['Properties','/properties',Building2],['Units','/units',DoorOpen],['Tenants','/tenants',Users],['Leases','/leases',FileSignature],['Rent charges','/rent-charges',ClipboardList],['Payments','/payments',WalletCards],['Arrears','/arrears',AlertTriangle],['Expenses','/expenses',ReceiptText],['Maintenance','/maintenance',Wrench],['Reports','/reports',BarChart3],['Staff','/staff',UserCog],['Audit log','/audit',ScrollText],['Settings','/settings',Settings],['Back to home','/',ArrowLeft]
] as const;
const primary=[['Home','/dashboard',Gauge],['Properties','/properties',Building2],['Tenants','/tenants',Users],['Payments','/payments',WalletCards]] as const;
export function MobileNav({role='OWNER'}:{role?:string}){
  const path=usePathname(); const [open,setOpen]=useState(false); const isAdmin=['OWNER','ADMIN'].includes(role);
  const links=allLinks.filter(([label])=>label!=='Audit log'||isAdmin);
  return <>
    {open&&<div className="mobile-menu-backdrop" onClick={()=>setOpen(false)}><div className="mobile-menu-sheet" onClick={e=>e.stopPropagation()}><div className="mobile-menu-head"><b>All modules</b><button className="icon-btn" onClick={()=>setOpen(false)} aria-label="Close menu"><X size={18}/></button></div><div className="mobile-menu-grid">{links.map(([label,href,Icon])=><Link onClick={()=>setOpen(false)} key={href} href={href} className={`mobile-menu-link ${path===href||path.startsWith(href+'/')?'active':''}`}><Icon size={18}/><span>{label}</span></Link>)}</div></div></div>}
    <nav className="mobile-bottom-nav">{primary.map(([label,href,Icon])=><Link key={href} href={href} className={path===href||path.startsWith(href+'/')?'active':''}><Icon size={20}/><span>{label}</span></Link>)}<button className={open?'active':''} onClick={()=>setOpen(true)}><Menu size={20}/><span>Menu</span></button></nav>
  </>;
}
