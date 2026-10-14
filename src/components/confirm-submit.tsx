'use client';
import { useFormStatus } from 'react-dom';
export function ConfirmSubmit({children,confirm,className='btn btn-danger'}:{children:React.ReactNode;confirm:string;className?:string}){
  const {pending}=useFormStatus();
  return <button type="submit" className={className} disabled={pending} onClick={e=>{if(!window.confirm(confirm))e.preventDefault();}}>{pending?'Working…':children}</button>;
}
export function SubmitButton({children,className='btn btn-primary',pendingText='Saving…'}:{children:React.ReactNode;className?:string;pendingText?:string}){
  const {pending}=useFormStatus(); return <button type="submit" className={className} disabled={pending}>{pending?pendingText:children}</button>;
}
