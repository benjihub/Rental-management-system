import { X } from "lucide-react";
export { SearchBox } from "@/components/search-box";
export function PageHead({title,description,action}:{title:string;description:string;action?:React.ReactNode}){return <div className="page-head"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>}
export function Status({value}:{value:string}){return <span className={`status ${value}`}><i className="dot"/>{value.replaceAll("_"," ")}</span>}
export function Modal({id,title,children}:{id:string;title:string;children:React.ReactNode}){return <div id={id} className="modal-backdrop hide"><div className="modal"><div className="modal-head"><h2>{title}</h2><button className="icon-btn" type="button" data-close={id}><X size={18}/></button></div><div className="modal-body">{children}</div></div></div>}
