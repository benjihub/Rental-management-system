'use client';
import { useEffect,useMemo,useState,useTransition } from 'react';
import { usePathname,useRouter } from 'next/navigation';
import { CheckCircle2,ChevronLeft,ChevronRight,X } from 'lucide-react';
import { completeProductTour } from '@/app/actions';

const steps=[
  {key:'dashboard',path:'/dashboard',title:'Your control centre',body:'Start here for rent owed, collections, vacancies and items that need attention.'},
  {key:'tenants',path:'/tenants',title:'Tenant records',body:'Open a tenant to see their lease, balance, payments, documents, maintenance and activity in one place.'},
  {key:'leases',path:'/leases',title:'Lease lifecycle',body:'Create, renew, end or terminate leases. Unit occupancy follows the active lease automatically.'},
  {key:'payments',path:'/payments',title:'Fast rent collection',body:'Search a tenant, record the amount and method, then let RentFlow allocate charges and issue a receipt.'},
  {key:'reports',path:'/reports',title:'Know how the portfolio performs',body:'Use reports for collection, arrears, occupancy, expenses and property performance.'}
] as const;

export function ProductTour({enabled}:{enabled:boolean}){
  const pathname=usePathname(),router=useRouter();
  const [open,setOpen]=useState(false),[step,setStep]=useState(0),[busy,startTransition]=useTransition();
  const current=steps[step];
  const [pos,setPos]=useState<{top:number;left:number}|null>(null);
  useEffect(()=>{const forced=new URLSearchParams(window.location.search).get('tour')==='1';if(forced){sessionStorage.removeItem('rentflow:tour-session-dismissed');setStep(0);setOpen(true);window.history.replaceState({},'',pathname);return;}if(!enabled)return;const dismissed=sessionStorage.getItem('rentflow:tour-session-dismissed');if(!dismissed){const t=setTimeout(()=>setOpen(true),500);return()=>clearTimeout(t)}},[enabled,pathname]);
  useEffect(()=>{
    if(!open)return;
    if(pathname!==current.path){router.push(current.path);return;}
    const t=setTimeout(()=>{
      const el=document.querySelector(`[data-tour="${current.key}"]`) as HTMLElement|null;
      document.querySelectorAll('.tour-focus').forEach(x=>x.classList.remove('tour-focus'));
      if(el){el.classList.add('tour-focus');const r=el.getBoundingClientRect();setPos({top:Math.min(window.innerHeight-250,Math.max(88,r.top)),left:Math.min(window.innerWidth-390,Math.max(270,r.right+14))});}
      else setPos(null);
    },120);
    return()=>{clearTimeout(t);document.querySelectorAll('.tour-focus').forEach(x=>x.classList.remove('tour-focus'));};
  },[open,step,pathname,current.key,current.path,router]);
  const progress=useMemo(()=>Math.round(((step+1)/steps.length)*100),[step]);
  function finish(){startTransition(async()=>{await completeProductTour();sessionStorage.setItem('rentflow:tour-session-dismissed','1');setOpen(false);document.querySelectorAll('.tour-focus').forEach(x=>x.classList.remove('tour-focus'));});}
  if(!open)return null;
  return <div className="tour-layer" aria-live="polite"><div className="tour-scrim"/><aside className="tour-card" style={pos?{top:pos.top,left:pos.left}:undefined}>
    <div className="tour-progress"><i style={{width:`${progress}%`}}/></div>
    <div className="tour-card-head"><span>Getting started · {step+1}/{steps.length}</span><button aria-label="Skip tour" onClick={finish}><X size={17}/></button></div>
    <h3>{current.title}</h3><p>{current.body}</p>
    <div className="tour-actions"><button className="btn btn-secondary btn-small" disabled={step===0||busy} onClick={()=>setStep(x=>Math.max(0,x-1))}><ChevronLeft size={14}/> Back</button>{step<steps.length-1?<button className="btn btn-primary btn-small" onClick={()=>setStep(x=>x+1)}>Next <ChevronRight size={14}/></button>:<button className="btn btn-primary btn-small" disabled={busy} onClick={finish}><CheckCircle2 size={14}/> Finish</button>}</div>
  </aside></div>;
}
