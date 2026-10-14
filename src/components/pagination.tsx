import Link from 'next/link';
export function Pagination({page,total,pageSize,pathname,params={}}:{page:number;total:number;pageSize:number;pathname:string;params?:Record<string,string|undefined>}){
  const pages=Math.max(1,Math.ceil(total/pageSize)); if(pages<=1)return null;
  const href=(p:number)=>{const q=new URLSearchParams();Object.entries(params).forEach(([k,v])=>v&&q.set(k,v));q.set('page',String(p));return `${pathname}?${q.toString()}`};
  const start=Math.max(1,page-2),end=Math.min(pages,page+2);
  return <div className="pagination"><span className="subtle">Page {page} of {pages} · {total} records</span><div>{page>1&&<Link className="btn btn-small btn-secondary" href={href(page-1)}>Previous</Link>}{Array.from({length:end-start+1},(_,i)=>start+i).map(p=><Link key={p} className={`page-number ${p===page?'active':''}`} href={href(p)}>{p}</Link>)}{page<pages&&<Link className="btn btn-small btn-secondary" href={href(page+1)}>Next</Link>}</div></div>;
}
