'use client';
import { useSearchParams } from 'next/navigation';

export function FlashMessage(){
  const params=useSearchParams();
  const message=params.get('message');
  const error=params.get('error');
  if(!message&&!error)return null;
  return <div className={`app-flash ${error?'app-flash-error':'app-flash-success'}`} role="status">{error||message}</div>;
}
