'use client';
import Link from 'next/link';import { usePathname } from 'next/navigation';
import { ArrowLeft,Building2,Gauge,GitBranch,Home,Users,FileSignature,WalletCards,ReceiptText,Wrench,BarChart3,UserCog,Settings,DoorOpen,ClipboardList,AlertTriangle,Bell,ScrollText,CalendarDays } from 'lucide-react';
import { APP_NAME,demoMode } from '@/lib/config';
const groups=[
  ['Workspace',[['Dashboard','/dashboard',Gauge],['Calendar','/calendar',CalendarDays],['Notifications','/notifications',Bell]]],
  ['Properties',[['Branches','/branches',GitBranch],['Properties','/properties',Building2],['Units','/units',DoorOpen]]],
  ['Rentals',[['Tenants','/tenants',Users],['Leases','/leases',FileSignature]]],
  ['Finance',[['Rent charges','/rent-charges',ClipboardList],['Payments','/payments',WalletCards],['Arrears','/arrears',AlertTriangle],['Expenses','/expenses',ReceiptText]]],
  ['Operations',[['Maintenance','/maintenance',Wrench],['Reports','/reports',BarChart3],['Staff','/staff',UserCog],['Audit log','/audit',ScrollText],['Settings','/settings',Settings]]]
] as const;
export function Sidebar({role='OWNER'}:{role?:string}){const path=usePathname();const isAdmin=['OWNER','ADMIN'].includes(role);return <aside className="sidebar"><Link href="/dashboard" className="brand"><div className="brand-mark"><Home size={19}/></div><span>{APP_NAME}</span></Link><div className="sidebar-scroll">{groups.map(([group,items])=><div key={group}><div className="nav-section">{group}</div><nav>{items.filter(([label])=>label!=='Audit log'||isAdmin).map(([label,href,Icon])=><Link key={href} href={href} data-tour={label.toLowerCase()} className={`nav-link ${path===href||path.startsWith(href+'/')?'active':''}`}><Icon size={18}/><span>{label}</span></Link>)}</nav></div>)}</div><div className="sidebar-footer"><Link href="/" className="sidebar-home-link"><ArrowLeft size={15}/><span>Back to home</span></Link>{demoMode&&<span className="demo-pill">Demo data active</span>}</div></aside>}
