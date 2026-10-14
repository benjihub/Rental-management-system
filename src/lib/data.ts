import { demoMode } from '@/lib/config';
import * as demo from '@/lib/demo';
import { createClient } from '@/lib/supabase/server';
import type { ActivityItem, AuditLog, Branch, CalendarEvent, Expense, ExpenseCategory, Inspection, Lease, Maintenance, Notification, Payment, Property, RentCharge, Staff, Tenant, TenantDetail, TenantDocument, Unit, UserPreferences } from '@/types';

function singleRelation<T>(value:T|T[]|null|undefined):T|undefined{
  return Array.isArray(value)?value[0]:value??undefined;
}

async function identity(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return {supabase,user:null,businessId:null,member:null};
  const {data:member}=await supabase.from('business_members').select('id,business_id,role,status').eq('user_id',user.id).eq('status','ACTIVE').limit(1).maybeSingle();
  return {supabase,user,businessId:member?.business_id||null,member};
}
export async function getIdentity(){ if(demoMode)return {user:{id:'demo',email:'owner@example.com'},businessId:'demo',member:{id:'s1',role:'OWNER',status:'ACTIVE'}} as any; return identity(); }

export async function getBusinessInfo(){
  if(demoMode) return {id:'demo',name:'Benjamin Rentals',currency:'UGX',phone:'+256 700 000 001',email:'owner@example.com',country:'Uganda',address:'Kampala',logoUrl:'',receiptPrefix:'RCT',receiptFooter:'Thank you for your payment.',dueDay:5,gracePeriod:0};
  const {supabase,businessId}=await identity(); if(!businessId)return null;
  const {data,error}=await supabase.from('businesses').select('id,name,currency,phone,email,country,address,logo_url,receipt_prefix,receipt_footer,default_due_day,default_grace_period').eq('id',businessId).single(); if(error)throw error;
  return {id:data.id,name:data.name,currency:data.currency,phone:data.phone||'',email:data.email||'',country:data.country,address:data.address||'',logoUrl:data.logo_url||'',receiptPrefix:data.receipt_prefix,receiptFooter:data.receipt_footer||'',dueDay:data.default_due_day,gracePeriod:data.default_grace_period};
}

export async function getProfile(){
  if(demoMode)return {id:'demo',fullName:'Benjamin Wamono',email:'owner@example.com',phone:'+256 700 000 001',avatarUrl:'',preferences:{tourCompleted:false,dashboardWidgets:['outstanding','collected','vacant','properties']}};
  const {supabase,user}=await identity(); if(!user)return null;
  const {data,error}=await supabase.from('profiles').select('id,full_name,email,phone,avatar_url,preferences').eq('id',user.id).single(); if(error)throw error;
  return {id:data.id,fullName:data.full_name,email:data.email||user.email||'',phone:data.phone||'',avatarUrl:data.avatar_url||'',preferences:(data.preferences||{}) as UserPreferences};
}

export async function getBranches():Promise<Branch[]> {
  if(demoMode)return demo.branches;
  const {supabase,businessId}=await identity(); if(!businessId)return[];
  const {data,error}=await supabase.from('branches').select('id,name,address,city,phone,email,notes,status,manager_member_id,business_members!branches_manager_member_id_fkey(profiles(full_name)),properties(id,units(id))').eq('business_id',businessId).order('name'); if(error)throw error;
  return (data||[]).map((r:any)=>({id:r.id,name:r.name,address:r.address||'',city:r.city||'',phone:r.phone||'',email:r.email||'',notes:r.notes||'',manager:r.business_members?.profiles?.full_name||'—',managerMemberId:r.manager_member_id||'',properties:r.properties?.length||0,units:(r.properties||[]).reduce((s:number,p:any)=>s+(p.units?.length||0),0),status:r.status}));
}

export async function getProperties():Promise<Property[]> {
  if(demoMode)return demo.properties;
  const {supabase,businessId}=await identity(); if(!businessId)return[];
  const {data,error}=await supabase.from('properties').select('id,branch_id,name,property_type,address,description,floors,image_url,status,branches(name),units(id,status,default_rent)').eq('business_id',businessId).order('name'); if(error)throw error;
  return (data||[]).map((r:any)=>({id:r.id,branchId:r.branch_id,branch:r.branches?.name||'',name:r.name,type:r.property_type,address:r.address||'',description:r.description||'',floors:r.floors,imageUrl:r.image_url||'',units:r.units?.length||0,occupied:(r.units||[]).filter((u:any)=>u.status==='OCCUPIED').length,monthlyIncome:(r.units||[]).filter((u:any)=>u.status==='OCCUPIED').reduce((s:number,u:any)=>s+Number(u.default_rent||0),0),status:r.status}));
}

export async function getUnits():Promise<Unit[]> {
  if(demoMode)return demo.units;
  const {supabase,businessId}=await identity(); if(!businessId)return[];
  const {data,error}=await supabase.from('units').select('id,property_id,name,unit_type,floor,bedrooms,bathrooms,default_rent,default_deposit,description,status,properties(name),leases!left(status,tenants(full_name))').eq('business_id',businessId).order('name'); if(error)throw error;
  return (data||[]).map((r:any)=>({id:r.id,propertyId:r.property_id,property:r.properties?.name||'',name:r.name,type:r.unit_type||'Unit',floor:r.floor||'—',bedrooms:r.bedrooms?Number(r.bedrooms):null,bathrooms:r.bathrooms?Number(r.bathrooms):null,rent:Number(r.default_rent||0),deposit:Number(r.default_deposit||0),description:r.description||'',status:r.status,tenant:(r.leases||[]).find((l:any)=>['ACTIVE','ENDING_SOON'].includes(l.status))?.tenants?.full_name}));
}

export async function getTenants():Promise<Tenant[]> {
  if(demoMode)return demo.tenants;
  const {supabase,businessId}=await identity(); if(!businessId)return[];
  const {data,error}=await supabase.from('tenants').select('id,branch_id,full_name,phone,email,national_id,gender,date_of_birth,occupation,employer,previous_address,emergency_contact_name,emergency_contact_phone,notes,status,branches(name),leases!left(id,status,rent_amount,units(name,properties(name)),rent_charges(amount,paid_amount,status))').eq('business_id',businessId).order('full_name'); if(error)throw error;
  return (data||[]).map((r:any)=>{const l=(r.leases||[]).find((x:any)=>['ACTIVE','ENDING_SOON'].includes(x.status));const balance=(r.leases||[]).flatMap((x:any)=>x.rent_charges||[]).filter((c:any)=>['UPCOMING','UNPAID','PARTIALLY_PAID','OVERDUE'].includes(c.status)).reduce((sum:number,c:any)=>sum+Math.max(0,Number(c.amount)-Number(c.paid_amount)),0);return {id:r.id,branchId:r.branch_id,branch:r.branches?.name||'',name:r.full_name,phone:r.phone,email:r.email||'',nationalId:r.national_id||'',gender:r.gender||'',dateOfBirth:r.date_of_birth||'',occupation:r.occupation||'',employer:r.employer||'',previousAddress:r.previous_address||'',emergencyContactName:r.emergency_contact_name||'',emergencyContactPhone:r.emergency_contact_phone||'',notes:r.notes||'',unit:l?.units?.name,property:l?.units?.properties?.name,rent:Number(l?.rent_amount||0),balance,status:r.status};});
}

export async function getTenantDetail(id:string):Promise<TenantDetail|null>{
  if(demoMode){const t=demo.tenants.find(x=>x.id===id)||demo.tenants[0];return {tenant:t,leases:demo.leases.filter(l=>l.tenantId===t.id),payments:demo.payments.filter(p=>p.tenant===t.name),maintenance:demo.maintenance.filter(m=>m.tenant===t.name),documents:[] as TenantDocument[]};}
  const {supabase,businessId}=await identity(); if(!businessId)return null;
  const {data:t,error}=await supabase.from('tenants').select('id,branch_id,full_name,phone,email,national_id,gender,date_of_birth,occupation,employer,previous_address,emergency_contact_name,emergency_contact_phone,notes,status,branches(name)').eq('business_id',businessId).eq('id',id).single(); if(error)throw error;
  const [leases,payments,maintenance,docs]=await Promise.all([getLeases(id),getPayments(id),getMaintenance(id),supabase.from('documents').select('id,document_type,file_url,file_name,created_at').eq('business_id',businessId).eq('tenant_id',id).order('created_at',{ascending:false})]);
  const documents:TenantDocument[]=[]; for(const d of docs.data||[]){const {data:signed}=await supabase.storage.from('tenant-documents').createSignedUrl(d.file_url,3600);documents.push({id:d.id,type:d.document_type,fileName:d.file_name,url:signed?.signedUrl||'',createdAt:d.created_at});}
  const active=leases.find(l=>['ACTIVE','ENDING_SOON'].includes(l.status)); const charges=await getRentCharges({tenantId:id}); const bal=charges.reduce((s,c)=>s+c.balance,0);
  const tenantBranch=singleRelation(t.branches);
  const tenant:Tenant={id:t.id,branchId:t.branch_id,branch:tenantBranch?.name||'',name:t.full_name,phone:t.phone,email:t.email||'',nationalId:t.national_id||'',gender:t.gender||'',dateOfBirth:t.date_of_birth||'',occupation:t.occupation||'',employer:t.employer||'',previousAddress:t.previous_address||'',emergencyContactName:t.emergency_contact_name||'',emergencyContactPhone:t.emergency_contact_phone||'',notes:t.notes||'',unit:active?.unit,property:active?.property,rent:active?.rent||0,balance:bal,status:t.status};
  return {tenant,leases,payments,maintenance,documents};
}

export async function getLeases(tenantId?:string):Promise<Lease[]> {
  if(demoMode)return tenantId?demo.leases.filter(x=>x.tenantId===tenantId):demo.leases;
  const {supabase,businessId}=await identity(); if(!businessId)return[]; await supabase.rpc('refresh_lease_statuses'); let q=supabase.from('leases').select('id,tenant_id,unit_id,start_date,end_date,rent_amount,deposit_required,deposit_paid,payment_frequency,due_day,grace_period_days,notes,status,tenants(full_name),units(name,properties(name))').eq('business_id',businessId).order('start_date',{ascending:false}); if(tenantId)q=q.eq('tenant_id',tenantId); const {data,error}=await q; if(error)throw error;
  return (data||[]).map((r:any)=>({id:r.id,tenant:r.tenants?.full_name||'',tenantId:r.tenant_id,unit:r.units?.name||'',unitId:r.unit_id,property:r.units?.properties?.name||'',startDate:r.start_date,endDate:r.end_date||'',rent:Number(r.rent_amount),depositRequired:Number(r.deposit_required||0),depositPaid:Number(r.deposit_paid||0),frequency:r.payment_frequency,dueDay:r.due_day,gracePeriod:r.grace_period_days,notes:r.notes||'',status:r.status}));
}

export async function getRentCharges(filters?:{tenantId?:string;status?:string;leaseId?:string}):Promise<RentCharge[]> {
  if(demoMode){let rows=demo.leases.map((l,i)=>({id:'c'+i,leaseId:l.id,tenantId:l.tenantId,tenant:l.tenant,tenantPhone:demo.tenants.find(t=>t.id===l.tenantId)?.phone||'',property:l.property,unit:l.unit,period:'2026-10-01',dueDate:`2026-10-${String(l.dueDay).padStart(2,'0')}`,amount:l.rent,paid:i===0?l.rent:i===1?450000:0,balance:i===0?0:i===1?250000:l.rent,status:(i===0?'PAID':i===1?'PARTIALLY_PAID':'OVERDUE') as any}));if(filters?.tenantId)rows=rows.filter(x=>x.tenantId===filters.tenantId);if(filters?.status)rows=rows.filter(x=>x.status===filters.status);if(filters?.leaseId)rows=rows.filter(x=>x.leaseId===filters.leaseId);return rows;}
  const {supabase,businessId}=await identity(); if(!businessId)return[]; await supabase.rpc('refresh_charge_statuses'); let q=supabase.from('rent_charges').select('id,lease_id,tenant_id,charge_period,due_date,amount,paid_amount,status,tenants(full_name,phone),units(name,properties(name))').eq('business_id',businessId).order('due_date',{ascending:false}); if(filters?.tenantId)q=q.eq('tenant_id',filters.tenantId); if(filters?.status)q=q.eq('status',filters.status); if(filters?.leaseId)q=q.eq('lease_id',filters.leaseId); const {data,error}=await q; if(error)throw error;
  return (data||[]).map((r:any)=>({id:r.id,leaseId:r.lease_id,tenantId:r.tenant_id,tenant:r.tenants?.full_name||'',tenantPhone:r.tenants?.phone||'',property:r.units?.properties?.name||'',unit:r.units?.name||'',period:r.charge_period,dueDate:r.due_date,amount:Number(r.amount),paid:Number(r.paid_amount),balance:Math.max(0,Number(r.amount)-Number(r.paid_amount)),status:r.status}));
}

export async function getPayments(tenantId?:string):Promise<Payment[]> {
  if(demoMode)return tenantId?demo.payments.filter(p=>p.tenant===demo.tenants.find(t=>t.id===tenantId)?.name):demo.payments;
  const {supabase,businessId}=await identity(); if(!businessId)return[]; let q=supabase.from('payments').select('id,tenant_id,lease_id,amount,payment_method,payment_date,reference,notes,reversed_at,reversal_reason,tenants(full_name,phone),leases(units(name,properties(name))),receipts(receipt_number),profiles!payments_recorded_by_fkey(full_name)').eq('business_id',businessId).order('payment_date',{ascending:false}); if(tenantId)q=q.eq('tenant_id',tenantId); const {data,error}=await q; if(error)throw error;
  return (data||[]).map((r:any)=>({id:r.id,receipt:r.receipts?.[0]?.receipt_number||'—',tenant:r.tenants?.full_name||'',tenantId:r.tenant_id,leaseId:r.lease_id,property:r.leases?.units?.properties?.name||'',unit:r.leases?.units?.name||'',amount:Number(r.amount),method:r.payment_method,date:r.payment_date,reference:r.reference||'',notes:r.notes||'',recordedBy:r.profiles?.full_name||'System',reversedAt:r.reversed_at||null,reversalReason:r.reversal_reason||null,status:r.reversed_at?'REVERSED':'RECEIVED'}));
}

export async function getReceiptDetail(id:string):Promise<any>{
  if(demoMode){const raw=demo.payments.find(x=>x.id===id)||demo.payments[0];const p={...raw,tenantPhone:demo.tenants.find(t=>t.name===raw.tenant)?.phone||''};return {payment:p,business:await getBusinessInfo(),outstanding:demo.tenants.find(t=>t.name===p.tenant)?.balance||0,allocations:[],advanceCredit:0};}
  const {supabase,businessId}=await identity(); if(!businessId)return null;
  const {data,error}=await supabase.from('payments').select('id,tenant_id,lease_id,amount,payment_method,payment_date,reference,notes,reversed_at,reversal_reason,tenants(full_name,phone),leases(units(name,properties(name))),receipts(receipt_number),profiles!payments_recorded_by_fkey(full_name),payment_allocations(amount,rent_charges(due_date,charge_period))').eq('business_id',businessId).eq('id',id).single(); if(error)throw error;
  const {data:charges}=await supabase.from('rent_charges').select('amount,paid_amount').eq('lease_id',data.lease_id).in('status',['UPCOMING','UNPAID','PARTIALLY_PAID','OVERDUE']);
  const outstanding=(charges||[]).reduce((s:any,c:any)=>s+Math.max(0,Number(c.amount)-Number(c.paid_amount)),0);
  const paymentTenant=singleRelation(data.tenants);const paymentLease=singleRelation(data.leases);const paymentUnit=singleRelation(paymentLease?.units);const paymentProperty=singleRelation(paymentUnit?.properties);const recordedBy=singleRelation(data.profiles);
  const payment:Payment={id:data.id,receipt:data.receipts?.[0]?.receipt_number||'—',tenant:paymentTenant?.full_name||'',tenantPhone:paymentTenant?.phone||'',tenantId:data.tenant_id,leaseId:data.lease_id,property:paymentProperty?.name||'',unit:paymentUnit?.name||'',amount:Number(data.amount),method:data.payment_method,date:data.payment_date,reference:data.reference||'',notes:data.notes||'',recordedBy:recordedBy?.full_name||'System',reversedAt:data.reversed_at||null,reversalReason:data.reversal_reason||null,status:data.reversed_at?'REVERSED':'RECEIVED'};
  const allocated=(data.payment_allocations||[]).reduce((sum:number,a:any)=>sum+Number(a.amount||0),0);const advanceCredit=data.reversed_at?0:Math.max(0,Number(data.amount)-allocated);return {payment,business:await getBusinessInfo(),outstanding,allocations:data.payment_allocations||[],advanceCredit};
}

export async function getExpenseCategories():Promise<ExpenseCategory[]>{ if(demoMode)return ['Repairs','Electricity','Water','Security','Cleaning','Salaries','Taxes','Maintenance','Other'].map((name,i)=>({id:'ec'+i,name})); const {supabase,businessId}=await identity();if(!businessId)return[];const {data,error}=await supabase.from('expense_categories').select('id,name').eq('business_id',businessId).order('name');if(error)throw error;return data||[]; }

export async function getExpenses():Promise<Expense[]> {
  if(demoMode)return demo.expenses;
  const {supabase,businessId}=await identity(); if(!businessId)return[]; const {data,error}=await supabase.from('expenses').select('id,branch_id,property_id,category_id,description,amount,expense_date,payment_method,document_url,branches(name),properties(name),expense_categories(name)').eq('business_id',businessId).order('expense_date',{ascending:false}); if(error)throw error;
  const out:Expense[]=[];for(const r of data||[]){let url='';if(r.document_url){const {data:signed}=await supabase.storage.from('expense-documents').createSignedUrl(r.document_url,3600);url=signed?.signedUrl||'';}const branch=singleRelation(r.branches);const property=singleRelation(r.properties);const category=singleRelation(r.expense_categories);out.push({id:r.id,branchId:r.branch_id,propertyId:r.property_id,categoryId:r.category_id,branch:branch?.name||'General',property:property?.name||'—',category:category?.name||'Other',description:r.description,amount:Number(r.amount),date:r.expense_date,method:r.payment_method||'—',documentUrl:url});}return out;
}

export async function getMaintenance(tenantId?:string):Promise<Maintenance[]> {
  if(demoMode)return tenantId?demo.maintenance.filter(m=>m.tenant===demo.tenants.find(t=>t.id===tenantId)?.name):demo.maintenance;
  const {supabase,businessId}=await identity(); if(!businessId)return[]; let q=supabase.from('maintenance_requests').select('id,property_id,unit_id,tenant_id,title,description,priority,status,reported_at,due_date,estimated_cost,actual_cost,assigned_to,properties(name),units(name),tenants(full_name),business_members!maintenance_requests_assigned_to_fkey(profiles(full_name))').eq('business_id',businessId).order('reported_at',{ascending:false}); if(tenantId)q=q.eq('tenant_id',tenantId); const {data,error}=await q;if(error)throw error;
  return (data||[]).map((r:any)=>({id:r.id,propertyId:r.property_id,unitId:r.unit_id,tenantId:r.tenant_id,property:r.properties?.name||'',unit:r.units?.name||'—',tenant:r.tenants?.full_name||'—',title:r.title,description:r.description||'',priority:r.priority,status:r.status,reportedAt:r.reported_at,dueDate:r.due_date||'',estimatedCost:Number(r.estimated_cost||0),cost:Number(r.actual_cost||0),assignedTo:r.business_members?.profiles?.full_name||'—',assignedToId:r.assigned_to||''}));
}

export async function getStaff():Promise<Staff[]> {
  if(demoMode)return demo.staff;
  const {supabase,businessId}=await identity(); if(!businessId)return[]; const {data,error}=await supabase.from('business_members').select('id,user_id,role,status,profiles(full_name,email,phone),member_branch_access(branch_id,branches(name))').eq('business_id',businessId).order('created_at');if(error)throw error;
  return (data||[]).map((r:any)=>({id:r.id,userId:r.user_id,name:r.profiles?.full_name||'',email:r.profiles?.email||'',phone:r.profiles?.phone||'',role:r.role,branches:r.role==='OWNER'?['All branches']:(r.member_branch_access||[]).map((x:any)=>x.branches?.name).filter(Boolean),branchIds:(r.member_branch_access||[]).map((x:any)=>x.branch_id),status:r.status}));
}

export async function getNotifications():Promise<Notification[]>{
  if(demoMode)return [{id:'n1',kind:'OVERDUE',title:'Rent overdue',body:'Moses Traders Ltd has overdue rent.',href:'/arrears',createdAt:'2026-10-14T08:00:00Z',readAt:null}];
  const {supabase,businessId}=await identity();if(!businessId)return[];await supabase.rpc('refresh_operational_alerts');const {data,error}=await supabase.from('notifications').select('id,kind,title,body,href,read_at,created_at').eq('business_id',businessId).order('created_at',{ascending:false}).limit(100);if(error)throw error;return (data||[]).map((r:any)=>({id:r.id,kind:r.kind,title:r.title,body:r.body,href:r.href||'',readAt:r.read_at,createdAt:r.created_at}));
}

export async function getAuditLogs():Promise<AuditLog[]>{
  if(demoMode)return [{id:'1',action:'UPDATE',entityType:'leases',entityId:'l3',user:'Benjamin Wamono',createdAt:'2026-10-14T09:00:00Z',metadata:{}}];
  const {supabase,businessId}=await identity();if(!businessId)return[];const {data,error}=await supabase.from('audit_logs').select('id,action,entity_type,entity_id,metadata,created_at,profiles(full_name)').eq('business_id',businessId).order('created_at',{ascending:false}).limit(200);if(error)throw error;return (data||[]).map((r:any)=>({id:String(r.id),action:r.action,entityType:r.entity_type,entityId:r.entity_id||'',user:r.profiles?.full_name||'System',createdAt:r.created_at,metadata:r.metadata}));
}

export async function getDashboard(){
  if(demoMode)return demo.dashboard;
  const {supabase,businessId}=await identity();if(!businessId)return demo.dashboard;await supabase.rpc('refresh_operational_alerts');const [properties,units,payments,expenses,leases]=await Promise.all([getProperties(),getUnits(),getPayments(),getExpenses(),getLeases()]);
  const now=new Date();const monthStart=new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10);const monthEnd=new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().slice(0,10);
  const {data:charges}=await supabase.from('rent_charges').select('amount,paid_amount,status,due_date,tenants(full_name),units(name,properties(name))').eq('business_id',businessId).gte('due_date',monthStart).lte('due_date',monthEnd);
  const expected=(charges||[]).reduce((s:any,c:any)=>s+Number(c.amount),0),collected=(charges||[]).reduce((s:any,c:any)=>s+Number(c.paid_amount),0),outstanding=(charges||[]).reduce((s:any,c:any)=>s+Math.max(0,Number(c.amount)-Number(c.paid_amount)),0),monthExpenses=expenses.filter(e=>e.date>=monthStart&&e.date<=monthEnd).reduce((s,e)=>s+e.amount,0);
  const overdue=(charges||[]).filter((c:any)=>c.status==='OVERDUE').map((c:any)=>({tenant:c.tenants?.full_name||'',property:c.units?.properties?.name||'',unit:c.units?.name||'',amount:Number(c.amount)-Number(c.paid_amount),days:Math.max(0,Math.floor((Date.now()-new Date(c.due_date).getTime())/86400000))}));
  const expiring=leases.filter(l=>l.endDate).map(l=>({...l,days:Math.ceil((new Date(l.endDate).getTime()-Date.now())/86400000)})).filter(l=>l.days>=0&&l.days<=90).map(l=>({tenant:l.tenant,property:l.property,unit:l.unit,endDate:l.endDate,days:l.days}));
  const monthly=[] as {month:string;expected:number;collected:number;expenses:number}[];for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const start=d.toISOString().slice(0,10),end=new Date(d.getFullYear(),d.getMonth()+1,0).toISOString().slice(0,10);const {data:c}=await supabase.from('rent_charges').select('amount,paid_amount').eq('business_id',businessId).gte('due_date',start).lte('due_date',end);monthly.push({month:d.toLocaleString('en',{month:'short'}),expected:(c||[]).reduce((s:any,x:any)=>s+Number(x.amount),0),collected:(c||[]).reduce((s:any,x:any)=>s+Number(x.paid_amount),0),expenses:expenses.filter(e=>e.date>=start&&e.date<=end).reduce((s,e)=>s+e.amount,0)});}
  return {metrics:{properties:properties.length,units:units.length,occupied:units.filter(u=>u.status==='OCCUPIED').length,vacant:units.filter(u=>u.status==='VACANT').length,expected,collected,outstanding,expenses:monthExpenses},payments:payments.filter(p=>!p.reversedAt).slice(0,5),overdue:overdue.slice(0,5),vacantUnits:units.filter(u=>u.status==='VACANT').slice(0,5),expiring:expiring.slice(0,5),monthly};
}

export async function getReports(from?:string,to?:string){
  const now=new Date();
  const defaultFrom=new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10);
  const defaultTo=new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().slice(0,10);
  const a=from||defaultFrom,b=to||defaultTo;
  const [properties,units,branches]=await Promise.all([getProperties(),getUnits(),getBranches()]);
  let cc:RentCharge[]=[];let pp:Payment[]=[];let ee:Expense[]=[];
  if(demoMode){
    cc=(await getRentCharges()).filter(c=>c.dueDate>=a&&c.dueDate<=b);
    pp=(await getPayments()).filter(p=>p.date>=a&&p.date<=b);
    ee=(await getExpenses()).filter(e=>e.date>=a&&e.date<=b);
  }else{
    const {supabase,businessId}=await identity();
    if(businessId){
      await supabase.rpc('refresh_charge_statuses');
      const [chargeResult,paymentResult,expenseResult]=await Promise.all([
        supabase.from('rent_charges').select('id,lease_id,tenant_id,charge_period,due_date,amount,paid_amount,status,tenants(full_name,phone),units(name,properties(name))').eq('business_id',businessId).gte('due_date',a).lte('due_date',b).order('due_date'),
        supabase.from('payments').select('id,tenant_id,lease_id,amount,payment_method,payment_date,reference,notes,reversed_at,reversal_reason,tenants(full_name,phone),leases(units(name,properties(name))),receipts(receipt_number),profiles!payments_recorded_by_fkey(full_name)').eq('business_id',businessId).gte('payment_date',a).lte('payment_date',b).order('payment_date'),
        supabase.from('expenses').select('id,branch_id,property_id,category_id,description,amount,expense_date,payment_method,branches(name),properties(name),expense_categories(name)').eq('business_id',businessId).gte('expense_date',a).lte('expense_date',b).order('expense_date')
      ]);
      if(chargeResult.error)throw chargeResult.error;if(paymentResult.error)throw paymentResult.error;if(expenseResult.error)throw expenseResult.error;
      cc=(chargeResult.data||[]).map((r:any)=>({id:r.id,leaseId:r.lease_id,tenantId:r.tenant_id,tenant:r.tenants?.full_name||'',tenantPhone:r.tenants?.phone||'',property:r.units?.properties?.name||'',unit:r.units?.name||'',period:r.charge_period,dueDate:r.due_date,amount:Number(r.amount),paid:Number(r.paid_amount),balance:Math.max(0,Number(r.amount)-Number(r.paid_amount)),status:r.status}));
      pp=(paymentResult.data||[]).map((r:any)=>({id:r.id,receipt:r.receipts?.[0]?.receipt_number||'—',tenant:r.tenants?.full_name||'',tenantPhone:r.tenants?.phone||'',tenantId:r.tenant_id,leaseId:r.lease_id,property:r.leases?.units?.properties?.name||'',unit:r.leases?.units?.name||'',amount:Number(r.amount),method:r.payment_method,date:r.payment_date,reference:r.reference||'',notes:r.notes||'',recordedBy:r.profiles?.full_name||'System',reversedAt:r.reversed_at||null,reversalReason:r.reversal_reason||null,status:r.reversed_at?'REVERSED':'RECEIVED'}));
      ee=(expenseResult.data||[]).map((r:any)=>({id:r.id,branchId:r.branch_id,propertyId:r.property_id,categoryId:r.category_id,branch:r.branches?.name||'General',property:r.properties?.name||'—',category:r.expense_categories?.name||'Other',description:r.description,amount:Number(r.amount),date:r.expense_date,method:r.payment_method||'—'}));
    }
  }
  const activePayments=pp.filter(p=>!p.reversedAt);
  const expected=cc.reduce((s,c)=>s+c.amount,0);
  const collected=activePayments.reduce((s,p)=>s+p.amount,0);
  const outstanding=cc.reduce((s,c)=>s+c.balance,0);
  const expenseTotal=ee.reduce((s,e)=>s+e.amount,0);
  const totalUnits=units.filter(u=>u.status!=='INACTIVE').length;
  const occupiedUnits=units.filter(u=>u.status==='OCCUPIED').length;
  const vacantUnits=units.filter(u=>u.status==='VACANT').length;
  const byProperty=properties.map(p=>{
    const income=activePayments.filter(x=>x.property===p.name).reduce((s,x)=>s+x.amount,0);
    const exp=ee.filter(x=>x.property===p.name).reduce((s,x)=>s+x.amount,0);
    const owed=cc.filter(x=>x.property===p.name).reduce((s,x)=>s+x.balance,0);
    return {property:p.name,branch:p.branch,income,expenses:exp,outstanding:owed,occupancy:p.units?Math.round(p.occupied/p.units*100):0,net:income-exp};
  });
  const byCategory=Array.from(new Set(ee.map(e=>e.category))).map(category=>({category,amount:ee.filter(e=>e.category===category).reduce((s,e)=>s+e.amount,0)})).sort((x,y)=>y.amount-x.amount);
  const byDay=Array.from(new Set(activePayments.map(p=>p.date))).sort().map(date=>({period:date,amount:activePayments.filter(p=>p.date===date).reduce((s,p)=>s+p.amount,0)}));
  const monthKeys=Array.from(new Set([...activePayments.map(p=>p.date.slice(0,7)),...ee.map(e=>e.date.slice(0,7)),...cc.map(c=>c.dueDate.slice(0,7))])).sort();
  const byMonth=monthKeys.map(period=>({period,expected:cc.filter(c=>c.dueDate.startsWith(period)).reduce((s,c)=>s+c.amount,0),income:activePayments.filter(p=>p.date.startsWith(period)).reduce((s,p)=>s+p.amount,0),expenses:ee.filter(e=>e.date.startsWith(period)).reduce((s,e)=>s+e.amount,0)}));
  const byBranch=branches.map(branch=>{const propertyNames=properties.filter(p=>p.branchId===branch.id||p.branch===branch.name).map(p=>p.name);const income=activePayments.filter(p=>propertyNames.includes(p.property)).reduce((s,p)=>s+p.amount,0);const exp=ee.filter(e=>e.branch===branch.name||propertyNames.includes(e.property)).reduce((s,e)=>s+e.amount,0);const owed=cc.filter(c=>propertyNames.includes(c.property)).reduce((s,c)=>s+c.balance,0);const branchUnits=units.filter(u=>propertyNames.includes(u.property)&&u.status!=='INACTIVE');const occupied=branchUnits.filter(u=>u.status==='OCCUPIED').length;return {branch:branch.name,income,expenses:exp,outstanding:owed,units:branchUnits.length,occupancy:branchUnits.length?Math.round(occupied/branchUnits.length*100):0,net:income-exp};});
  const expenseByMonth=monthKeys.map(period=>({period,amount:ee.filter(e=>e.date.startsWith(period)).reduce((s,e)=>s+e.amount,0)}));
  const arrears=cc.filter(c=>c.status==='OVERDUE'&&c.balance>0);
  return {from:a,to:b,expected,collected,outstanding,expenses:expenseTotal,collectionRate:expected?Math.round(collected/expected*100):0,occupancy:totalUnits?Math.round(occupiedUnits/totalUnits*100):0,totalUnits,occupiedUnits,vacantUnits,byProperty,byCategory,byDay,byMonth,byBranch,expenseByMonth,arrears};
}

export type PageResult<T>={rows:T[];page:number;pageSize:number;total:number};
function demoPage<T>(all:T[],page:number,pageSize:number):PageResult<T>{const safe=Math.max(1,page||1);return {rows:all.slice((safe-1)*pageSize,safe*pageSize),page:safe,pageSize,total:all.length};}

export async function getTenantsPage(page=1,pageSize=25):Promise<PageResult<Tenant>>{
  if(demoMode)return demoPage(demo.tenants,page,pageSize);
  const {supabase,businessId}=await identity();if(!businessId)return {rows:[],page:1,pageSize,total:0};const from=(Math.max(1,page)-1)*pageSize;
  const {data,count,error}=await supabase.from('tenants').select('id,branch_id,full_name,phone,email,national_id,gender,date_of_birth,occupation,employer,previous_address,emergency_contact_name,emergency_contact_phone,notes,status,branches(name),leases!left(id,status,rent_amount,units(name,properties(name)),rent_charges(amount,paid_amount,status))',{count:'exact'}).eq('business_id',businessId).order('full_name').range(from,from+pageSize-1);if(error)throw error;
  const rows=(data||[]).map((r:any)=>{const l=(r.leases||[]).find((x:any)=>['ACTIVE','ENDING_SOON'].includes(x.status));const balance=(r.leases||[]).flatMap((x:any)=>x.rent_charges||[]).filter((c:any)=>['UPCOMING','UNPAID','PARTIALLY_PAID','OVERDUE'].includes(c.status)).reduce((sum:number,c:any)=>sum+Math.max(0,Number(c.amount)-Number(c.paid_amount)),0);return {id:r.id,branchId:r.branch_id,branch:r.branches?.name||'',name:r.full_name,phone:r.phone,email:r.email||'',nationalId:r.national_id||'',gender:r.gender||'',dateOfBirth:r.date_of_birth||'',occupation:r.occupation||'',employer:r.employer||'',previousAddress:r.previous_address||'',emergencyContactName:r.emergency_contact_name||'',emergencyContactPhone:r.emergency_contact_phone||'',notes:r.notes||'',unit:l?.units?.name,property:l?.units?.properties?.name,rent:Number(l?.rent_amount||0),balance,status:r.status} as Tenant;});
  return {rows,page:Math.max(1,page),pageSize,total:count||0};
}

export async function getPaymentsPage(page=1,pageSize=25,tenantId?:string):Promise<PageResult<Payment>>{
  if(demoMode){const all=tenantId?demo.payments.filter(p=>p.tenant===demo.tenants.find(t=>t.id===tenantId)?.name):demo.payments;return demoPage(all,page,pageSize);}
  const {supabase,businessId}=await identity();if(!businessId)return {rows:[],page:1,pageSize,total:0};const from=(Math.max(1,page)-1)*pageSize;
  let q=supabase.from('payments').select('id,tenant_id,lease_id,amount,payment_method,payment_date,reference,notes,reversed_at,reversal_reason,tenants(full_name),leases(units(name,properties(name))),receipts(receipt_number),profiles!payments_recorded_by_fkey(full_name)',{count:'exact'}).eq('business_id',businessId).order('payment_date',{ascending:false});if(tenantId)q=q.eq('tenant_id',tenantId);const {data,count,error}=await q.range(from,from+pageSize-1);if(error)throw error;
  const rows:Payment[]=(data||[]).map((r:any):Payment=>({id:r.id,receipt:r.receipts?.[0]?.receipt_number||'—',tenant:r.tenants?.full_name||'',tenantId:r.tenant_id,leaseId:r.lease_id,property:r.leases?.units?.properties?.name||'',unit:r.leases?.units?.name||'',amount:Number(r.amount),method:r.payment_method,date:r.payment_date,reference:r.reference||'',notes:r.notes||'',recordedBy:r.profiles?.full_name||'System',reversedAt:r.reversed_at||null,reversalReason:r.reversal_reason||null,status:r.reversed_at?'REVERSED':'RECEIVED'}));
  return {rows,page:Math.max(1,page),pageSize,total:count||0};
}

export async function getRentChargesPage(page=1,pageSize=25):Promise<PageResult<RentCharge>>{
  if(demoMode)return demoPage(await getRentCharges(),page,pageSize);
  const {supabase,businessId}=await identity();if(!businessId)return {rows:[],page:1,pageSize,total:0};await supabase.rpc('refresh_charge_statuses');const from=(Math.max(1,page)-1)*pageSize;
  const {data,count,error}=await supabase.from('rent_charges').select('id,lease_id,tenant_id,charge_period,due_date,amount,paid_amount,status,tenants(full_name,phone),units(name,properties(name))',{count:'exact'}).eq('business_id',businessId).order('due_date',{ascending:false}).range(from,from+pageSize-1);if(error)throw error;
  const rows=(data||[]).map((r:any)=>({id:r.id,leaseId:r.lease_id,tenantId:r.tenant_id,tenant:r.tenants?.full_name||'',tenantPhone:r.tenants?.phone||'',property:r.units?.properties?.name||'',unit:r.units?.name||'',period:r.charge_period,dueDate:r.due_date,amount:Number(r.amount),paid:Number(r.paid_amount),balance:Math.max(0,Number(r.amount)-Number(r.paid_amount)),status:r.status}));
  return {rows,page:Math.max(1,page),pageSize,total:count||0};
}

export async function getExpensesPage(page=1,pageSize=25):Promise<PageResult<Expense>>{
  if(demoMode)return demoPage(demo.expenses,page,pageSize);
  const {supabase,businessId}=await identity();if(!businessId)return {rows:[],page:1,pageSize,total:0};const from=(Math.max(1,page)-1)*pageSize;
  const {data,count,error}=await supabase.from('expenses').select('id,branch_id,property_id,category_id,description,amount,expense_date,payment_method,document_url,branches(name),properties(name),expense_categories(name)',{count:'exact'}).eq('business_id',businessId).order('expense_date',{ascending:false}).range(from,from+pageSize-1);if(error)throw error;
  const rows:Expense[]=[];for(const r of data||[]){let url='';if(r.document_url){const {data:signed}=await supabase.storage.from('expense-documents').createSignedUrl(r.document_url,3600);url=signed?.signedUrl||'';}const branch=singleRelation(r.branches);const property=singleRelation(r.properties);const category=singleRelation(r.expense_categories);rows.push({id:r.id,branchId:r.branch_id,propertyId:r.property_id,categoryId:r.category_id,branch:branch?.name||'General',property:property?.name||'—',category:category?.name||'Other',description:r.description,amount:Number(r.amount),date:r.expense_date,method:r.payment_method||'—',documentUrl:url});}return {rows,page:Math.max(1,page),pageSize,total:count||0};
}

export async function getGlobalSearch(term:string){
  const q=term.trim();if(q.length<2)return [] as {kind:string;title:string;subtitle:string;href:string}[];
  if(demoMode){const needle=q.toLowerCase();const out:any[]=[];demo.tenants.filter(x=>`${x.name} ${x.phone} ${x.email}`.toLowerCase().includes(needle)).slice(0,6).forEach(x=>out.push({kind:'Tenant',title:x.name,subtitle:`${x.phone} · ${x.property||'No property'}`,href:`/tenants/${x.id}`}));demo.units.filter(x=>`${x.name} ${x.property} ${x.tenant||''}`.toLowerCase().includes(needle)).slice(0,6).forEach(x=>out.push({kind:'Unit',title:`${x.property} · ${x.name}`,subtitle:`${x.status} · ${x.tenant||'Vacant'}`,href:'/units'}));demo.properties.filter(x=>`${x.name} ${x.address}`.toLowerCase().includes(needle)).slice(0,6).forEach(x=>out.push({kind:'Property',title:x.name,subtitle:x.address,href:'/properties'}));demo.payments.filter(x=>`${x.receipt} ${x.reference||''} ${x.tenant}`.toLowerCase().includes(needle)).slice(0,6).forEach(x=>out.push({kind:'Receipt',title:x.receipt,subtitle:`${x.tenant} · ${x.method}`,href:`/receipts/${x.id}`}));return out;}
  const {supabase,businessId}=await identity();if(!businessId)return[];const like=`%${q.replace(/[%_,]/g,'')}%`;
  const [tenants,properties,units,receipts,payments]=await Promise.all([
    supabase.from('tenants').select('id,full_name,phone,email').eq('business_id',businessId).or(`full_name.ilike.${like},phone.ilike.${like},email.ilike.${like},national_id.ilike.${like}`).limit(8),
    supabase.from('properties').select('id,name,address').eq('business_id',businessId).or(`name.ilike.${like},address.ilike.${like}`).limit(8),
    supabase.from('units').select('id,name,status,properties(name)').eq('business_id',businessId).ilike('name',like).limit(8),
    supabase.from('receipts').select('payment_id,receipt_number,payments(tenants(full_name))').eq('business_id',businessId).ilike('receipt_number',like).limit(8),
    supabase.from('payments').select('id,reference,payment_method,tenants(full_name)').eq('business_id',businessId).ilike('reference',like).limit(8)
  ]);
  const out:{kind:string;title:string;subtitle:string;href:string}[]=[];
  for(const x of tenants.data||[])out.push({kind:'Tenant',title:(x as any).full_name,subtitle:`${(x as any).phone} · ${(x as any).email||'No email'}`,href:`/tenants/${(x as any).id}`});
  for(const x of properties.data||[])out.push({kind:'Property',title:(x as any).name,subtitle:(x as any).address||'Property',href:'/properties'});
  for(const x of units.data||[])out.push({kind:'Unit',title:`${(x as any).properties?.name||'Property'} · ${(x as any).name}`,subtitle:(x as any).status,href:'/units'});
  for(const x of receipts.data||[])out.push({kind:'Receipt',title:(x as any).receipt_number,subtitle:(x as any).payments?.tenants?.full_name||'Payment receipt',href:`/receipts/${(x as any).payment_id}`});
  for(const x of payments.data||[])out.push({kind:'Payment reference',title:(x as any).reference,subtitle:`${(x as any).tenants?.full_name||''} · ${(x as any).payment_method}`,href:`/receipts/${(x as any).id}`});
  return out.slice(0,30);
}

export async function getInspections():Promise<Inspection[]>{
  if(demoMode)return demo.inspections;
  const {supabase,businessId}=await identity();if(!businessId)return[];
  const {data,error}=await supabase.from('inspections').select('id,property_id,unit_id,tenant_id,title,inspection_type,scheduled_date,scheduled_time,notes,status,assigned_to,completed_at,properties(name),units(name),tenants(full_name),business_members!inspections_assigned_to_fkey(profiles(full_name))').eq('business_id',businessId).order('scheduled_date');if(error)throw error;
  return (data||[]).map((r:any)=>({id:r.id,propertyId:r.property_id,unitId:r.unit_id,tenantId:r.tenant_id,property:r.properties?.name||'',unit:r.units?.name||'—',tenant:r.tenants?.full_name||'—',title:r.title,type:r.inspection_type,scheduledDate:r.scheduled_date,scheduledTime:r.scheduled_time||'',notes:r.notes||'',status:r.status,assignedTo:r.business_members?.profiles?.full_name||'—',assignedToId:r.assigned_to||'',completedAt:r.completed_at||null}));
}

export async function getCalendarEvents(month?:string):Promise<{month:string;events:CalendarEvent[];inspections:Inspection[]}>{
  const now=new Date();const safe=/^\d{4}-\d{2}$/.test(month||'')?month!:now.toISOString().slice(0,7);const start=`${safe}-01`;const d=new Date(`${start}T00:00:00`);const end=new Date(d.getFullYear(),d.getMonth()+1,0).toISOString().slice(0,10);
  if(demoMode){
    const charges=(await getRentCharges()).filter(x=>x.dueDate>=start&&x.dueDate<=end);const inspections=demo.inspections.filter(x=>x.scheduledDate>=start&&x.scheduledDate<=end);const maintenance=demo.maintenance.filter(x=>x.dueDate&&x.dueDate>=start&&x.dueDate<=end);const leases=demo.leases.filter(x=>x.endDate&&x.endDate>=start&&x.endDate<=end);
    const events:CalendarEvent[]=[...charges.map(x=>({id:x.id,kind:'RENT_DUE' as const,title:`${x.tenant} rent due`,date:x.dueDate,subtitle:`${x.property} · ${x.unit}`,href:'/rent-charges',status:x.status})),...leases.map(x=>({id:x.id,kind:'LEASE_END' as const,title:`${x.tenant} lease ends`,date:x.endDate,subtitle:`${x.property} · ${x.unit}`,href:`/leases/${x.id}`,status:x.status})),...inspections.map(x=>({id:x.id,kind:'INSPECTION' as const,title:x.title,date:x.scheduledDate,time:x.scheduledTime||'',subtitle:`${x.property} · ${x.unit}`,href:'/calendar',status:x.status})),...maintenance.map(x=>({id:x.id,kind:'MAINTENANCE' as const,title:x.title,date:x.dueDate!,subtitle:`${x.property} · ${x.unit}`,href:'/maintenance',status:x.status}))];return {month:safe,events,inspections};
  }
  const {supabase,businessId}=await identity();if(!businessId)return {month:safe,events:[],inspections:[]};
  const [charges,leases,inspectionResult,maintenance]=await Promise.all([
    supabase.from('rent_charges').select('id,due_date,status,tenants(full_name),units(name,properties(name))').eq('business_id',businessId).gte('due_date',start).lte('due_date',end),
    supabase.from('leases').select('id,end_date,status,tenants(full_name),units(name,properties(name))').eq('business_id',businessId).gte('end_date',start).lte('end_date',end),
    supabase.from('inspections').select('id,property_id,unit_id,tenant_id,title,inspection_type,scheduled_date,scheduled_time,notes,status,assigned_to,completed_at,properties(name),units(name),tenants(full_name),business_members!inspections_assigned_to_fkey(profiles(full_name))').eq('business_id',businessId).gte('scheduled_date',start).lte('scheduled_date',end),
    supabase.from('maintenance_requests').select('id,title,due_date,status,properties(name),units(name)').eq('business_id',businessId).gte('due_date',start).lte('due_date',end)
  ]);
  for(const r of [charges,leases,inspectionResult,maintenance])if(r.error)throw r.error;
  const inspections:Inspection[]=(inspectionResult.data||[]).map((r:any)=>({id:r.id,propertyId:r.property_id,unitId:r.unit_id,tenantId:r.tenant_id,property:r.properties?.name||'',unit:r.units?.name||'—',tenant:r.tenants?.full_name||'—',title:r.title,type:r.inspection_type,scheduledDate:r.scheduled_date,scheduledTime:r.scheduled_time||'',notes:r.notes||'',status:r.status,assignedTo:r.business_members?.profiles?.full_name||'—',assignedToId:r.assigned_to||'',completedAt:r.completed_at||null}));
  const events:CalendarEvent[]=[...(charges.data||[]).map((x:any)=>({id:x.id,kind:'RENT_DUE' as const,title:`${x.tenants?.full_name||'Tenant'} rent due`,date:x.due_date,subtitle:`${x.units?.properties?.name||''} · ${x.units?.name||''}`,href:'/rent-charges',status:x.status})),...(leases.data||[]).map((x:any)=>({id:x.id,kind:'LEASE_END' as const,title:`${x.tenants?.full_name||'Tenant'} lease ends`,date:x.end_date,subtitle:`${x.units?.properties?.name||''} · ${x.units?.name||''}`,href:`/leases/${x.id}`,status:x.status})),...inspections.map(x=>({id:x.id,kind:'INSPECTION' as const,title:x.title,date:x.scheduledDate,time:x.scheduledTime||'',subtitle:`${x.property} · ${x.unit}`,href:'/calendar',status:x.status})),...(maintenance.data||[]).map((x:any)=>({id:x.id,kind:'MAINTENANCE' as const,title:x.title,date:x.due_date,subtitle:`${x.properties?.name||''} · ${x.units?.name||'—'}`,href:'/maintenance',status:x.status}))];
  return {month:safe,events,inspections};
}

export async function getDataFreshness(){
  if(demoMode){const now=Date.now();return {rentSync:new Date(now-2*60000).toISOString(),reportsUpdated:new Date(now-60000).toISOString()};}
  const {supabase,businessId}=await identity();const fallback=new Date().toISOString();if(!businessId)return {rentSync:fallback,reportsUpdated:fallback};
  const [charges,payments,expenses,maintenance]=await Promise.all([
    supabase.from('rent_charges').select('updated_at').eq('business_id',businessId).order('updated_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('payments').select('created_at').eq('business_id',businessId).order('created_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('expenses').select('updated_at').eq('business_id',businessId).order('updated_at',{ascending:false}).limit(1).maybeSingle(),
    supabase.from('maintenance_requests').select('updated_at').eq('business_id',businessId).order('updated_at',{ascending:false}).limit(1).maybeSingle()
  ]);
  const rentSync=charges.data?.updated_at||fallback;const candidates=[rentSync,payments.data?.created_at,expenses.data?.updated_at,maintenance.data?.updated_at].filter(Boolean) as string[];const reportsUpdated=candidates.sort((a,b)=>new Date(b).getTime()-new Date(a).getTime())[0]||fallback;return {rentSync,reportsUpdated};
}

export async function getEntityTimeline(kind:'tenant'|'unit'|'property'|'lease'|'payment',id:string):Promise<ActivityItem[]>{
  if(demoMode)return demo.sampleActivity;
  const {supabase,businessId}=await identity();if(!businessId)return[];const col={tenant:'tenant_id',unit:'unit_id',property:'property_id',lease:'lease_id',payment:'payment_id'}[kind];
  const {data,error}=await supabase.from('activity_events').select('id,title,body,action,entity_type,occurred_at,profiles!activity_events_actor_id_fkey(full_name)').eq('business_id',businessId).eq(col,id).order('occurred_at',{ascending:false}).limit(100);if(error)throw error;
  return (data||[]).map((r:any)=>({id:String(r.id),title:r.title,body:r.body||'',action:r.action,entityType:r.entity_type,occurredAt:r.occurred_at,actor:r.profiles?.full_name||'System'}));
}

export async function getPropertyDetail(id:string){const [properties,units,maintenance,timeline]=await Promise.all([getProperties(),getUnits(),getMaintenance(),getEntityTimeline('property',id)]);const property=properties.find(x=>x.id===id);if(!property)return null;return {property,units:units.filter(x=>x.propertyId===id),maintenance:maintenance.filter(x=>x.propertyId===id),timeline};}
export async function getUnitDetail(id:string){const [units,leases,maintenance,timeline]=await Promise.all([getUnits(),getLeases(),getMaintenance(),getEntityTimeline('unit',id)]);const unit=units.find(x=>x.id===id);if(!unit)return null;return {unit,leases:leases.filter(x=>x.unitId===id),maintenance:maintenance.filter(x=>x.unitId===id),timeline};}
export async function getLeaseDetail(id:string){const [leases,charges,payments,timeline]=await Promise.all([getLeases(),getRentCharges({leaseId:id}),getPayments(),getEntityTimeline('lease',id)]);const lease=leases.find(x=>x.id===id);if(!lease)return null;return {lease,charges,payments:payments.filter(x=>x.leaseId===id),timeline};}
export async function getPaymentDetail(id:string){const [receipt,timeline]=await Promise.all([getReceiptDetail(id),getEntityTimeline('payment',id)]);if(!receipt)return null;return {...receipt,timeline};}
