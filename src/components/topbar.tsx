import Link from 'next/link';
import { Bell } from 'lucide-react';
import { signOut } from '@/app/actions';
import { getBusinessInfo,getNotifications,getProfile } from '@/lib/data';
import { initials } from '@/lib/utils';
import { GlobalSearch } from '@/components/global-search';
import { PwaInstallButton } from '@/components/pwa-client';
export async function Topbar(){const [business,profile,notifications]=await Promise.all([getBusinessInfo(),getProfile(),getNotifications()]);const name=business?.name||'Rental Workspace';const unread=notifications.filter(n=>!n.readAt).length;return <header className="topbar"><div className="topbar-title"><h1>{name}</h1><div className="subtle">Rental operations workspace</div></div><GlobalSearch/><div className="top-actions"><PwaInstallButton/><Link className="icon-btn bell" aria-label="Notifications" href="/notifications"><Bell size={17}/>{unread>0&&<i>{unread>9?'9+':unread}</i>}</Link><form action={signOut}><button className="avatar" title="Sign out">{profile?.avatarUrl?<img src={profile.avatarUrl} alt=""/>:initials(profile?.fullName||name)}</button></form></div></header>}
