'use client';
import { useEffect,useState } from 'react';
import { RefreshCcw } from 'lucide-react';
function relative(ts:string){const d=Math.max(0,Date.now()-new Date(ts).getTime());const m=Math.floor(d/60000);if(m<1)return 'just now';if(m<60)return `${m} min${m===1?'':'s'} ago`;const h=Math.floor(m/60);if(h<24)return `${h} hr${h===1?'':'s'} ago`;const days=Math.floor(h/24);return `${days} day${days===1?'':'s'} ago`;}
export function FreshnessBadge({timestamp,label='Updated'}:{timestamp:string;label?:string}){const [text,setText]=useState(()=>relative(timestamp));useEffect(()=>{const tick=()=>setText(relative(timestamp));tick();const i=setInterval(tick,60000);return()=>clearInterval(i)},[timestamp]);return <span className="freshness"><RefreshCcw size={12}/>{label} {text}</span>}
