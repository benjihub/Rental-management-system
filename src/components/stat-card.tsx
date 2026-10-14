import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
export function StatCard({label,value,foot,icon:Icon,href}:{label:string;value:string;foot:string;icon:LucideIcon;href?:string}){const body=<><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={17}/></span></div><div className="stat-value">{value}</div><div className="stat-foot">{foot}</div>{href&&<div className="stat-drill">Open details →</div>}</>;return href?<Link href={href} className="stat-card stat-link">{body}</Link>:<div className="stat-card">{body}</div>}
