import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { MobileNav } from '@/components/mobile-nav';
import { demoMode } from '@/lib/config';
import { createClient } from '@/lib/supabase/server';
import { FlashMessage } from '@/components/flash-message';
import { ProductTour } from '@/components/product-tour';
import { getProfile } from '@/lib/data';

export default async function AppLayout({children}:{children:React.ReactNode}){
  let role='OWNER';
  if(!demoMode){
    const supabase=await createClient();
    const {data:{user}}=await supabase.auth.getUser();
    if(!user)redirect('/login');
    await supabase.rpc('activate_my_invitations');
    const {data:membership}=await supabase.from('business_members').select('id,status,role').eq('user_id',user.id).limit(1).maybeSingle();
    if(!membership)redirect('/onboarding');
    if(membership.status==='SUSPENDED')redirect('/login?error=Your staff access has been suspended.');
    if(membership.status!=='ACTIVE')redirect('/login?error=Your invitation is not active yet.');
    role=membership.role;
  }
  const profile=await getProfile();
  return <div className="app-shell"><Sidebar role={role}/><main className="main"><Topbar/><Suspense fallback={null}><FlashMessage/></Suspense>{children}</main><MobileNav role={role}/><ProductTour enabled={!profile?.preferences?.tourCompleted}/></div>;
}
