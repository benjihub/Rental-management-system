import { NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getBusinessInfo, getReports } from '@/lib/data';

export async function GET(request:Request){
  const url=new URL(request.url); const from=url.searchParams.get('from')||undefined; const to=url.searchParams.get('to')||undefined;
  const [business,report]=await Promise.all([getBusinessInfo(),getReports(from,to)]);
  if(!business)return new NextResponse('Not found',{status:404});
  const pdf=await PDFDocument.create(); const font=await pdf.embedFont(StandardFonts.Helvetica); const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink=rgb(.08,.13,.1),muted=rgb(.4,.45,.42),green=rgb(.09,.45,.27),line=rgb(.88,.91,.89); const currency=business.currency||'UGX';
  const fmt=(v:number)=>`${currency} ${Math.round(v).toLocaleString('en-US')}`;
  let page=pdf.addPage([595.28,841.89]); let y=790;
  const newPage=()=>{page=pdf.addPage([595.28,841.89]);y=790;};
  const write=(text:string,x=50,size=10,f=font,color=ink,maxWidth=495)=>{if(y<65)newPage();page.drawText(String(text),{x,y,size,font:f,color,maxWidth});};
  const row=(a:string,b:string)=>{write(a,50,10,bold);page.drawText(b,{x:310,y,size:10,font,color:ink,maxWidth:235});y-=23;page.drawLine({start:{x:50,y:y+9},end:{x:545,y:y+9},thickness:.4,color:line});};
  write(business.name,50,22,bold,green); y-=28; write('Rental Management Report',50,14,bold); y-=20; write(`${report.from} to ${report.to}`,50,10,font,muted); y-=30;
  write('Collection summary',50,13,bold); y-=20; row('Expected rent',fmt(report.expected));row('Collected',fmt(report.collected));row('Outstanding',fmt(report.outstanding));row('Collection rate',`${report.collectionRate}%`);row('Expenses',fmt(report.expenses));row('Net cash',fmt(report.collected-report.expenses)); y-=18;
  write('Occupancy summary',50,13,bold);y-=20;row('Total units',String(report.totalUnits));row('Occupied',String(report.occupiedUnits));row('Vacant',String(report.vacantUnits));row('Occupancy rate',`${report.occupancy}%`);y-=18;
  write('Property performance',50,13,bold);y-=20;
  for(const p of report.byProperty){write(p.property,50,10,bold);page.drawText(`${p.branch} · ${p.occupancy}% occupied`,{x:220,y,size:9,font,color:muted});y-=15;write(`Income ${fmt(p.income)}   Expenses ${fmt(p.expenses)}   Outstanding ${fmt(p.outstanding)}   Net ${fmt(p.net)}`,62,8,font,ink);y-=19;}
  y-=10;write('Branch performance',50,13,bold);y-=20;for(const b of report.byBranch){write(b.branch,50,10,bold);page.drawText(`${b.units} units · ${b.occupancy}% occupied`,{x:220,y,size:9,font,color:muted});y-=15;write(`Income ${fmt(b.income)}   Expenses ${fmt(b.expenses)}   Outstanding ${fmt(b.outstanding)}   Net ${fmt(b.net)}`,62,8,font,ink);y-=19;}
  y-=10;write('Expenses by category',50,13,bold);y-=20;for(const x of report.byCategory)row(x.category,fmt(x.amount));
  y-=10;write('Arrears',50,13,bold);y-=20;for(const a of report.arrears){write(`${a.tenant} — ${a.property} / ${a.unit}`,50,9,bold);page.drawText(`${a.dueDate} · ${fmt(a.balance)}`,{x:330,y,size:9,font,color:ink});y-=18;}
  const bytes=await pdf.save(); const safe=business.name.replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase()||'rental';
  return new NextResponse(bytes as any,{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${safe}-report-${report.from}-to-${report.to}.pdf"`,'Cache-Control':'private, no-store'}});
}
