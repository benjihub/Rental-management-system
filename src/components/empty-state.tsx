import Link from 'next/link';
import { Inbox } from 'lucide-react';
export function EmptyState({title,description,href,label}:{title:string;description:string;href?:string;label?:string}){
  return <div className="empty-state"><span className="empty-icon"><Inbox size={24}/></span><h3>{title}</h3><p>{description}</p>{href&&label&&<Link className="btn btn-primary btn-small" href={href}>{label}</Link>}</div>;
}
