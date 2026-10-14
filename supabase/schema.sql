-- RentFlow complete production schema for Supabase PostgreSQL
create extension if not exists pgcrypto;

create type public.member_role as enum ('OWNER','ADMIN','MANAGER','AGENT');
create type public.member_status as enum ('INVITED','ACTIVE','SUSPENDED');
create type public.record_status as enum ('ACTIVE','ARCHIVED');
create type public.unit_status as enum ('VACANT','OCCUPIED','RESERVED','MAINTENANCE','INACTIVE');
create type public.lease_status as enum ('DRAFT','ACTIVE','ENDING_SOON','ENDED','TERMINATED','CANCELLED');
create type public.payment_frequency as enum ('MONTHLY','QUARTERLY','YEARLY');
create type public.charge_status as enum ('UPCOMING','UNPAID','PARTIALLY_PAID','PAID','OVERDUE','WAIVED');
create type public.maintenance_priority as enum ('LOW','MEDIUM','HIGH','EMERGENCY');
create type public.maintenance_status as enum ('OPEN','IN_PROGRESS','RESOLVED','CANCELLED');
create type public.notification_kind as enum ('INFO','PAYMENT','RENT_DUE','OVERDUE','LEASE','MAINTENANCE','SYSTEM');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', email text, phone text, avatar_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.businesses (
  id uuid primary key default gen_random_uuid(), name text not null, email text, phone text,
  country text not null default 'Uganda', currency text not null default 'UGX', address text, logo_url text,
  receipt_prefix text not null default 'RCT', receipt_footer text,
  default_due_day smallint not null default 5 check(default_due_day between 1 and 28),
  default_grace_period smallint not null default 0 check(default_grace_period >= 0),
  onboarding_completed boolean not null default false,
  created_by uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.business_members (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, role public.member_role not null default 'AGENT',
  status public.member_status not null default 'ACTIVE', created_at timestamptz not null default now(), unique(business_id,user_id)
);

create table public.branches (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null, address text, city text, phone text, email text, notes text,
  manager_member_id uuid references public.business_members(id) on delete set null, status public.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(business_id,name)
);

create table public.member_branch_access (
  id uuid primary key default gen_random_uuid(), business_member_id uuid not null references public.business_members(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade, unique(business_member_id,branch_id)
);

create table public.properties (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict, name text not null, property_type text not null default 'Other',
  address text, description text, floors integer, image_url text, status public.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(business_id,branch_id,name)
);

create table public.units (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete restrict, name text not null, unit_type text, floor text,
  bedrooms numeric(4,1), bathrooms numeric(4,1), default_rent numeric(14,2) not null default 0 check(default_rent>=0),
  default_deposit numeric(14,2) not null default 0 check(default_deposit>=0), status public.unit_status not null default 'VACANT',
  description text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(property_id,name)
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  full_name text not null, phone text not null, email text, national_id text, gender text, date_of_birth date, occupation text, employer text,
  previous_address text, emergency_contact_name text, emergency_contact_phone text, notes text, status public.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.leases (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete restrict, unit_id uuid not null references public.units(id) on delete restrict,
  start_date date not null, end_date date, rent_amount numeric(14,2) not null check(rent_amount>=0), deposit_required numeric(14,2) not null default 0 check(deposit_required>=0),
  deposit_paid numeric(14,2) not null default 0 check(deposit_paid>=0), payment_frequency public.payment_frequency not null default 'MONTHLY',
  due_day smallint not null default 5 check(due_day between 1 and 28), grace_period_days smallint not null default 0 check(grace_period_days>=0),
  status public.lease_status not null default 'DRAFT', notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(end_date is null or end_date>=start_date)
);
create unique index one_active_lease_per_unit on public.leases(unit_id) where status in ('ACTIVE','ENDING_SOON');

create table public.rent_charges (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  lease_id uuid not null references public.leases(id) on delete restrict, tenant_id uuid not null references public.tenants(id) on delete restrict,
  unit_id uuid not null references public.units(id) on delete restrict, charge_period date not null, due_date date not null,
  amount numeric(14,2) not null check(amount>=0), paid_amount numeric(14,2) not null default 0 check(paid_amount>=0), status public.charge_status not null default 'UNPAID',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(lease_id,charge_period), check(paid_amount<=amount)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete restrict, lease_id uuid not null references public.leases(id) on delete restrict,
  amount numeric(14,2) not null check(amount>0), payment_method text not null, payment_date date not null default current_date, reference text, notes text,
  recorded_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now()
);

create table public.payment_allocations (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade, rent_charge_id uuid not null references public.rent_charges(id) on delete restrict,
  amount numeric(14,2) not null check(amount>0), created_at timestamptz not null default now(), unique(payment_id,rent_charge_id)
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  payment_id uuid not null unique references public.payments(id) on delete cascade, receipt_number text not null,
  issued_at timestamptz not null default now(), created_by uuid references public.profiles(id) on delete set null, unique(business_id,receipt_number)
);

create table public.receipt_counters (
  business_id uuid not null references public.businesses(id) on delete cascade,
  receipt_year integer not null, next_number bigint not null default 1, primary key(business_id,receipt_year)
);

create table public.expense_categories (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade, name text not null,
  created_at timestamptz not null default now(), unique(business_id,name)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict, property_id uuid references public.properties(id) on delete set null,
  category_id uuid references public.expense_categories(id) on delete set null, description text not null, amount numeric(14,2) not null check(amount>0),
  expense_date date not null default current_date, payment_method text, document_url text, recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.maintenance_requests (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete restrict, unit_id uuid references public.units(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null, title text not null, description text,
  priority public.maintenance_priority not null default 'MEDIUM', status public.maintenance_status not null default 'OPEN',
  estimated_cost numeric(14,2) not null default 0 check(estimated_cost>=0), actual_cost numeric(14,2) not null default 0 check(actual_cost>=0),
  assigned_to uuid references public.business_members(id) on delete set null, reported_at timestamptz not null default now(), resolved_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade, lease_id uuid references public.leases(id) on delete cascade,
  document_type text not null, file_url text not null, file_name text not null, uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.staff_invitations (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  email text not null, role public.member_role not null default 'AGENT', invited_by uuid references public.profiles(id) on delete set null,
  invited_user_id uuid references public.profiles(id) on delete set null, status text not null default 'PENDING',
  created_at timestamptz not null default now(), accepted_at timestamptz, unique(business_id,email)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(), business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade, kind public.notification_kind not null default 'INFO', title text not null,
  body text not null, href text, dedupe_key text, read_at timestamptz, created_at timestamptz not null default now()
);
create unique index notifications_business_dedupe_idx on public.notifications(business_id,dedupe_key) where dedupe_key is not null;

create table public.audit_logs (
  id bigint generated always as identity primary key, business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null, action text not null, entity_type text not null, entity_id text,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

-- User profile sync
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,full_name,email) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.email)
  on conflict(id) do update set email=excluded.email,updated_at=now();
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email on auth.users for each row execute procedure public.handle_new_user();

-- RLS helpers
create or replace function public.is_business_member(p_business uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.business_members bm where bm.business_id=p_business and bm.user_id=auth.uid() and bm.status='ACTIVE')
$$;
create or replace function public.is_business_admin(p_business uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.business_members bm where bm.business_id=p_business and bm.user_id=auth.uid() and bm.status='ACTIVE' and bm.role in ('OWNER','ADMIN'))
$$;
create or replace function public.shares_business_with(p_user uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.business_members me join public.business_members them on them.business_id=me.business_id
    where me.user_id=auth.uid() and me.status='ACTIVE' and them.user_id=p_user and them.status in ('ACTIVE','INVITED'))
$$;
create or replace function public.can_access_branch(p_business uuid,p_branch uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.business_members bm where bm.business_id=p_business and bm.user_id=auth.uid() and bm.status='ACTIVE'
    and (bm.role in ('OWNER','ADMIN') or exists(select 1 from public.member_branch_access mba where mba.business_member_id=bm.id and mba.branch_id=p_branch)))
$$;
create or replace function public.can_access_property(p_business uuid,p_property uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.properties p where p.id=p_property and p.business_id=p_business and public.can_access_branch(p_business,p.branch_id))
$$;
create or replace function public.can_access_unit(p_business uuid,p_unit uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.units u join public.properties p on p.id=u.property_id where u.id=p_unit and u.business_id=p_business and public.can_access_branch(p_business,p.branch_id))
$$;
create or replace function public.can_access_lease(p_business uuid,p_lease uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.leases l where l.id=p_lease and l.business_id=p_business and public.can_access_unit(p_business,l.unit_id))
$$;
create or replace function public.can_access_tenant(p_business uuid,p_tenant uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.tenants t where t.id=p_tenant and t.business_id=p_business and (public.is_business_admin(p_business) or t.branch_id is null or public.can_access_branch(p_business,t.branch_id)))
$$;

-- Atomic full onboarding
create or replace function public.create_business_onboarding(
  p_name text,p_phone text,p_email text,p_country text,p_currency text,p_address text,
  p_branch_name text,p_branch_address text,p_branch_city text,
  p_property_name text,p_property_type text,p_property_address text,p_property_description text,
  p_units jsonb default '[]'::jsonb
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_business uuid; v_branch uuid; v_property uuid; v_owner_member uuid; u jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.businesses(name,phone,email,country,currency,address,created_by,onboarding_completed)
    values(p_name,p_phone,p_email,coalesce(p_country,'Uganda'),coalesce(p_currency,'UGX'),p_address,auth.uid(),true) returning id into v_business;
  insert into public.business_members(business_id,user_id,role,status) values(v_business,auth.uid(),'OWNER','ACTIVE') returning id into v_owner_member;
  insert into public.expense_categories(business_id,name) values
    (v_business,'Repairs'),(v_business,'Electricity'),(v_business,'Water'),(v_business,'Security'),(v_business,'Cleaning'),
    (v_business,'Salaries'),(v_business,'Taxes'),(v_business,'Property management'),(v_business,'Internet'),(v_business,'Maintenance'),(v_business,'Other');
  if nullif(trim(coalesce(p_branch_name,'')),'') is null then return v_business; end if;
  insert into public.branches(business_id,name,address,city,manager_member_id) values(v_business,p_branch_name,p_branch_address,p_branch_city,v_owner_member) returning id into v_branch;
  if nullif(trim(coalesce(p_property_name,'')),'') is null then return v_business; end if;
  insert into public.properties(business_id,branch_id,name,property_type,address,description)
    values(v_business,v_branch,p_property_name,coalesce(nullif(p_property_type,''),'Other'),p_property_address,p_property_description) returning id into v_property;
  for u in select * from jsonb_array_elements(coalesce(p_units,'[]'::jsonb)) loop
    if coalesce(trim(u->>'name'),'')<>'' then
      insert into public.units(business_id,property_id,name,unit_type,floor,bedrooms,bathrooms,default_rent,default_deposit,status)
      values(v_business,v_property,trim(u->>'name'),coalesce(nullif(u->>'type',''),'Unit'),nullif(u->>'floor',''),
        nullif(u->>'bedrooms','')::numeric,nullif(u->>'bathrooms','')::numeric,
        coalesce(nullif(u->>'rent','')::numeric,0),coalesce(nullif(u->>'deposit','')::numeric,0),'VACANT');
    end if;
  end loop;
  return v_business;
end $$;

create or replace function public.activate_my_invitations() returns integer language plpgsql security definer set search_path=public as $$
declare n integer;
begin
  if auth.uid() is null then return 0; end if;
  update public.business_members set status='ACTIVE' where user_id=auth.uid() and status='INVITED';
  get diagnostics n=row_count;
  update public.staff_invitations set status='ACCEPTED',accepted_at=now() where invited_user_id=auth.uid() and status<>'ACCEPTED';
  return n;
end $$;

-- Lease occupancy sync
create or replace function public.sync_unit_from_lease() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status in ('ACTIVE','ENDING_SOON') then update public.units set status='OCCUPIED',updated_at=now() where id=new.unit_id;
  elsif tg_op='UPDATE' and old.status in ('ACTIVE','ENDING_SOON') and new.status not in ('ACTIVE','ENDING_SOON') then
    if not exists(select 1 from public.leases where unit_id=new.unit_id and id<>new.id and status in ('ACTIVE','ENDING_SOON')) then
      update public.units set status='VACANT',updated_at=now() where id=new.unit_id;
    end if;
  end if;
  return new;
end $$;
create trigger trg_sync_unit_after_lease after insert or update of status on public.leases for each row execute procedure public.sync_unit_from_lease();

-- Generate monthly, quarterly, and yearly rent obligations. rent_amount is monthly rent.

-- Prevent unit double-booking at the database boundary. Drafts may coexist, but activation cannot overlap.
create or replace function public.prevent_overlapping_active_leases() returns trigger language plpgsql set search_path=public as $$
begin
  if new.status in ('ACTIVE','ENDING_SOON') and exists(
    select 1 from public.leases l
    where l.unit_id=new.unit_id and l.id<>coalesce(new.id,'00000000-0000-0000-0000-000000000000'::uuid)
      and l.status in ('ACTIVE','ENDING_SOON')
      and daterange(l.start_date,coalesce(l.end_date,'infinity'::date),'[]') && daterange(new.start_date,coalesce(new.end_date,'infinity'::date),'[]')
  ) then raise exception 'This unit already has an overlapping active lease'; end if;
  return new;
end $$;
create trigger prevent_overlapping_lease before insert or update of unit_id,start_date,end_date,status on public.leases for each row execute procedure public.prevent_overlapping_active_leases();

-- Apply any unallocated advance payment to newly-created rent charges for the same lease.
create or replace function public.apply_unallocated_payments(p_lease_id uuid default null) returns integer language plpgsql security invoker set search_path=public as $$
declare p record; c record; v_remaining numeric; v_apply numeric; n integer:=0;
begin
  for p in
    select pay.id,pay.lease_id,pay.amount-coalesce(sum(pa.amount),0) remaining
    from public.payments pay left join public.payment_allocations pa on pa.payment_id=pay.id
    where (p_lease_id is null or pay.lease_id=p_lease_id)
    group by pay.id,pay.lease_id,pay.amount
    having pay.amount-coalesce(sum(pa.amount),0)>0
    order by pay.payment_date,pay.created_at,pay.id
  loop
    v_remaining:=p.remaining;
    for c in select * from public.rent_charges where lease_id=p.lease_id and status<>'WAIVED' and paid_amount<amount order by due_date,id for update loop
      exit when v_remaining<=0;
      v_apply:=least(v_remaining,c.amount-c.paid_amount);
      insert into public.payment_allocations(business_id,payment_id,rent_charge_id,amount)
        select business_id,p.id,c.id,v_apply from public.payments where id=p.id
        on conflict(payment_id,rent_charge_id) do update set amount=public.payment_allocations.amount+excluded.amount;
      update public.rent_charges set paid_amount=paid_amount+v_apply,updated_at=now() where id=c.id;
      v_remaining:=v_remaining-v_apply; n:=n+1;
    end loop;
  end loop;
  return n;
end $$;

create or replace function public.generate_rent_charges(p_month date default date_trunc('month',current_date)::date) returns integer language plpgsql security invoker set search_path=public as $$
declare r record; n integer:=0; v_due date; v_months integer; v_multiplier integer; v_amount numeric; v_status public.charge_status;
begin
  p_month := date_trunc('month',p_month)::date;
  for r in select * from public.leases where status in ('ACTIVE','ENDING_SOON')
    and start_date <= (p_month + interval '1 month - 1 day')::date and (end_date is null or end_date>=p_month)
  loop
    v_months := (extract(year from p_month)::int-extract(year from date_trunc('month',r.start_date))::int)*12
                +(extract(month from p_month)::int-extract(month from date_trunc('month',r.start_date))::int);
    if v_months < 0 then continue; end if;
    if r.payment_frequency='MONTHLY' then v_multiplier:=1;
    elsif r.payment_frequency='QUARTERLY' then if mod(v_months,3)<>0 then continue; end if; v_multiplier:=3;
    else if mod(v_months,12)<>0 then continue; end if; v_multiplier:=12; end if;
    v_due:=make_date(extract(year from p_month)::int,extract(month from p_month)::int,least(r.due_day,28));
    v_amount:=r.rent_amount*v_multiplier;
    v_status:=case when (v_due+r.grace_period_days)<current_date then 'OVERDUE'::public.charge_status when v_due<=current_date then 'UNPAID'::public.charge_status else 'UPCOMING'::public.charge_status end;
    insert into public.rent_charges(business_id,lease_id,tenant_id,unit_id,charge_period,due_date,amount,status)
      values(r.business_id,r.id,r.tenant_id,r.unit_id,p_month,v_due,v_amount,v_status)
      on conflict(lease_id,charge_period) do nothing;
    if found then n:=n+1; end if;
  end loop;
  perform public.apply_unallocated_payments(null);
  return n;
end $$;



create or replace function public.generate_rent_charges_range(p_from date,p_to date default current_date) returns integer language plpgsql security invoker set search_path=public as $$
declare d date; n integer:=0;
begin
  d:=date_trunc('month',p_from)::date;
  while d<=date_trunc('month',p_to)::date loop
    n:=n+public.generate_rent_charges(d);
    d:=(d+interval '1 month')::date;
  end loop;
  return n;
end $$;

create or replace function public.refresh_charge_statuses() returns void language sql security invoker set search_path=public as $$
  update public.rent_charges rc set status=case
    when rc.status='WAIVED' then 'WAIVED'::public.charge_status
    when rc.paid_amount>=rc.amount then 'PAID'::public.charge_status
    when (rc.due_date+l.grace_period_days)<current_date then 'OVERDUE'::public.charge_status
    when rc.paid_amount>0 then 'PARTIALLY_PAID'::public.charge_status
    when rc.due_date>current_date then 'UPCOMING'::public.charge_status
    else 'UNPAID'::public.charge_status end,updated_at=now()
  from public.leases l where l.id=rc.lease_id and rc.status<>'WAIVED';
$$;

create or replace function public.refresh_lease_statuses() returns void language plpgsql security invoker set search_path=public as $$
begin
  update public.leases set status='ENDED',updated_at=now() where status in ('ACTIVE','ENDING_SOON') and end_date is not null and end_date<current_date;
  update public.leases set status='ENDING_SOON',updated_at=now() where status='ACTIVE' and end_date is not null and end_date between current_date and current_date+30;
end $$;

-- Atomic payment: allocate oldest charges first and issue receipt.
create or replace function public.record_rent_payment(p_tenant_id uuid,p_lease_id uuid,p_amount numeric,p_method text,p_reference text default null,p_notes text default null,p_payment_date date default current_date)
returns table(payment_id uuid,receipt_number text,unallocated numeric) language plpgsql security definer set search_path=public as $$
declare v_business uuid; v_payment uuid; v_receipt text; v_remaining numeric:=p_amount; c record; v_apply numeric; v_seq bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_amount<=0 then raise exception 'Payment must be positive'; end if;
  select business_id into v_business from public.leases where id=p_lease_id and tenant_id=p_tenant_id;
  if v_business is null or not public.can_access_lease(v_business,p_lease_id) then raise exception 'Lease not accessible'; end if;
  insert into public.payments(business_id,tenant_id,lease_id,amount,payment_method,payment_date,reference,notes,recorded_by)
    values(v_business,p_tenant_id,p_lease_id,p_amount,p_method,coalesce(p_payment_date,current_date),p_reference,p_notes,auth.uid()) returning id into v_payment;
  for c in select * from public.rent_charges where lease_id=p_lease_id and status in ('UPCOMING','UNPAID','PARTIALLY_PAID','OVERDUE') and paid_amount<amount order by due_date,id for update loop
    exit when v_remaining<=0; v_apply:=least(v_remaining,c.amount-c.paid_amount);
    insert into public.payment_allocations(business_id,payment_id,rent_charge_id,amount) values(v_business,v_payment,c.id,v_apply);
    update public.rent_charges set paid_amount=paid_amount+v_apply,updated_at=now() where id=c.id; v_remaining:=v_remaining-v_apply;
  end loop;
  perform public.refresh_charge_statuses();
  insert into public.receipt_counters(business_id,receipt_year,next_number) values(v_business,extract(year from p_payment_date)::int,2)
    on conflict(business_id,receipt_year) do update set next_number=public.receipt_counters.next_number+1 returning next_number-1 into v_seq;
  v_receipt:=(select receipt_prefix from public.businesses where id=v_business)||'-'||extract(year from p_payment_date)::int||'-'||lpad(v_seq::text,6,'0');
  insert into public.receipts(business_id,payment_id,receipt_number,created_by) values(v_business,v_payment,v_receipt,auth.uid());
  insert into public.notifications(business_id,kind,title,body,href,dedupe_key)
    values(v_business,'PAYMENT','Payment received','A rent payment of '||p_amount||' was recorded.','/payments','payment:'||v_payment::text) on conflict do nothing;
  return query select v_payment,v_receipt,v_remaining;
end $$;

-- Operational alerts with deduplication
create or replace function public.refresh_operational_alerts() returns void language plpgsql security invoker set search_path=public as $$
declare r record;
begin
  perform public.refresh_charge_statuses(); perform public.refresh_lease_statuses();
  for r in select rc.id,rc.business_id,rc.due_date,(rc.amount-rc.paid_amount) balance,t.full_name,u.name unit_name
    from public.rent_charges rc join public.tenants t on t.id=rc.tenant_id join public.units u on u.id=rc.unit_id where rc.status='OVERDUE' loop
    insert into public.notifications(business_id,kind,title,body,href,dedupe_key)
    values(r.business_id,'OVERDUE','Rent overdue',r.full_name||' owes '||r.balance||' for unit '||r.unit_name||'.','/arrears','overdue:'||r.id::text)
    on conflict do nothing;
  end loop;
  for r in select rc.id,rc.business_id,rc.due_date,(rc.amount-rc.paid_amount) balance,t.full_name,u.name unit_name
    from public.rent_charges rc join public.tenants t on t.id=rc.tenant_id join public.units u on u.id=rc.unit_id
    where rc.status in ('UPCOMING','UNPAID','PARTIALLY_PAID') and rc.due_date between current_date and current_date+3 loop
    insert into public.notifications(business_id,kind,title,body,href,dedupe_key)
    values(r.business_id,'RENT_DUE','Rent due soon',r.full_name||' has '||r.balance||' due for unit '||r.unit_name||' on '||r.due_date||'.','/rent-charges','due:'||r.id::text)
    on conflict do nothing;
  end loop;
  for r in select l.id,l.business_id,l.end_date,t.full_name,u.name unit_name from public.leases l join public.tenants t on t.id=l.tenant_id join public.units u on u.id=l.unit_id
    where l.status in ('ACTIVE','ENDING_SOON') and l.end_date between current_date and current_date+30 loop
    insert into public.notifications(business_id,kind,title,body,href,dedupe_key)
    values(r.business_id,'LEASE','Lease ending soon',r.full_name||'''s lease for '||r.unit_name||' ends on '||r.end_date||'.','/leases','lease-ending:'||r.id::text)
    on conflict do nothing;
  end loop;
end $$;

-- Guard manual allocation writes so they cannot over-allocate a payment or charge.
create or replace function public.validate_payment_allocation() returns trigger language plpgsql security definer set search_path=public as $$
declare v_payment_total numeric; v_allocated numeric; v_charge_due numeric; v_allow numeric;
begin
  select amount into v_payment_total from public.payments where id=new.payment_id;
  select coalesce(sum(amount),0) into v_allocated from public.payment_allocations where payment_id=new.payment_id and id<>new.id;
  if v_allocated+new.amount>v_payment_total then raise exception 'Allocation exceeds payment amount'; end if;
  select amount-paid_amount into v_charge_due from public.rent_charges where id=new.rent_charge_id;
  v_allow:=v_charge_due + case when tg_op='UPDATE' then old.amount else 0 end;
  if new.amount>v_allow then raise exception 'Allocation exceeds charge outstanding'; end if;
  return new;
end $$;
create trigger validate_allocation before insert or update on public.payment_allocations for each row execute procedure public.validate_payment_allocation();

create or replace function public.notify_maintenance_change() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if tg_op='UPDATE' and old.status is distinct from new.status then
    insert into public.notifications(business_id,kind,title,body,href,dedupe_key) values(new.business_id,'MAINTENANCE','Maintenance request updated',new.title||' is now '||replace(new.status::text,'_',' ')||'.','/maintenance','maint:'||new.id::text||':'||new.status::text) on conflict do nothing;
  elsif tg_op='INSERT' then
    insert into public.notifications(business_id,kind,title,body,href,dedupe_key) values(new.business_id,'MAINTENANCE','Maintenance request created',new.title,'/maintenance','maint-created:'||new.id::text) on conflict do nothing;
  end if;
  return new;
end $$;
create trigger notify_maintenance after insert or update of status on public.maintenance_requests for each row execute procedure public.notify_maintenance_change();

-- Generic audit logging
create or replace function public.audit_row_change() returns trigger language plpgsql security definer set search_path=public as $$
declare v_business uuid; v_id text; v_meta jsonb;
begin
  v_business:=coalesce((to_jsonb(new)->>'business_id')::uuid,(to_jsonb(old)->>'business_id')::uuid);
  v_id:=coalesce(to_jsonb(new)->>'id',to_jsonb(old)->>'id');
  v_meta:=jsonb_build_object('old',case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,'new',case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end);
  if v_business is not null then insert into public.audit_logs(business_id,user_id,action,entity_type,entity_id,metadata) values(v_business,auth.uid(),tg_op,tg_table_name,v_id,v_meta); end if;
  return coalesce(new,old);
end $$;

create trigger audit_branches after insert or update or delete on public.branches for each row execute procedure public.audit_row_change();
create trigger audit_properties after insert or update or delete on public.properties for each row execute procedure public.audit_row_change();
create trigger audit_units after insert or update or delete on public.units for each row execute procedure public.audit_row_change();
create trigger audit_tenants after insert or update or delete on public.tenants for each row execute procedure public.audit_row_change();
create trigger audit_leases after insert or update or delete on public.leases for each row execute procedure public.audit_row_change();
create trigger audit_payments after insert or update or delete on public.payments for each row execute procedure public.audit_row_change();
create trigger audit_expenses after insert or update or delete on public.expenses for each row execute procedure public.audit_row_change();
create trigger audit_maintenance after insert or update or delete on public.maintenance_requests for each row execute procedure public.audit_row_change();
create trigger audit_members after insert or update or delete on public.business_members for each row execute procedure public.audit_row_change();

-- RLS
alter table public.profiles enable row level security; alter table public.businesses enable row level security; alter table public.business_members enable row level security;
alter table public.branches enable row level security; alter table public.member_branch_access enable row level security; alter table public.properties enable row level security;
alter table public.units enable row level security; alter table public.tenants enable row level security; alter table public.leases enable row level security; alter table public.rent_charges enable row level security;
alter table public.payments enable row level security; alter table public.payment_allocations enable row level security; alter table public.receipts enable row level security; alter table public.receipt_counters enable row level security;
alter table public.expense_categories enable row level security; alter table public.expenses enable row level security; alter table public.maintenance_requests enable row level security;
alter table public.documents enable row level security; alter table public.staff_invitations enable row level security; alter table public.notifications enable row level security; alter table public.audit_logs enable row level security;

create policy "profile business read" on public.profiles for select using(id=auth.uid() or public.shares_business_with(id));
create policy "profile self update" on public.profiles for update using(id=auth.uid()) with check(id=auth.uid());
create policy "business member read" on public.businesses for select using(public.is_business_member(id));
create policy "business admin update" on public.businesses for update using(public.is_business_admin(id));
create policy "members same business read" on public.business_members for select using(public.is_business_member(business_id));
create policy "members admin insert" on public.business_members for insert with check(public.is_business_admin(business_id) and role<>'OWNER');
create policy "members admin update" on public.business_members for update using(public.is_business_admin(business_id) and role<>'OWNER') with check(public.is_business_admin(business_id) and role<>'OWNER');
create policy "members admin delete" on public.business_members for delete using(public.is_business_admin(business_id) and role<>'OWNER');
create policy "branch read" on public.branches for select using(public.can_access_branch(business_id,id));
create policy "branch admin insert" on public.branches for insert with check(public.is_business_admin(business_id));
create policy "branch write" on public.branches for update using(public.is_business_admin(business_id));
create policy "branch access read" on public.member_branch_access for select using(exists(select 1 from public.business_members bm where bm.id=business_member_id and public.is_business_member(bm.business_id)));
create policy "branch access admin manage" on public.member_branch_access for all using(exists(select 1 from public.business_members bm where bm.id=business_member_id and public.is_business_admin(bm.business_id))) with check(exists(select 1 from public.business_members bm where bm.id=business_member_id and public.is_business_admin(bm.business_id)));
create policy "property read" on public.properties for select using(public.can_access_branch(business_id,branch_id));
create policy "property write" on public.properties for all using(public.can_access_branch(business_id,branch_id)) with check(public.can_access_branch(business_id,branch_id));
create policy "unit read" on public.units for select using(public.can_access_property(business_id,property_id));
create policy "unit write" on public.units for all using(public.can_access_property(business_id,property_id)) with check(public.can_access_property(business_id,property_id));
create policy "tenant access" on public.tenants for all using(public.can_access_branch(business_id,branch_id)) with check(public.can_access_branch(business_id,branch_id));
create policy "lease access" on public.leases for all using(public.can_access_unit(business_id,unit_id)) with check(public.can_access_unit(business_id,unit_id));
create policy "charge access" on public.rent_charges for all using(public.can_access_unit(business_id,unit_id)) with check(public.can_access_unit(business_id,unit_id));
create policy "payment access" on public.payments for all using(public.can_access_lease(business_id,lease_id)) with check(public.can_access_lease(business_id,lease_id));
create policy "allocation access" on public.payment_allocations for all using(exists(select 1 from public.rent_charges rc where rc.id=rent_charge_id and public.can_access_unit(business_id,rc.unit_id))) with check(exists(select 1 from public.rent_charges rc where rc.id=rent_charge_id and public.can_access_unit(business_id,rc.unit_id)));
create policy "receipt access" on public.receipts for all using(exists(select 1 from public.payments p where p.id=payment_id and public.can_access_lease(business_id,p.lease_id))) with check(exists(select 1 from public.payments p where p.id=payment_id and public.can_access_lease(business_id,p.lease_id)));
create policy "receipt counter read" on public.receipt_counters for select using(public.is_business_member(business_id));
create policy "expense category read" on public.expense_categories for select using(public.is_business_member(business_id));
create policy "expense category insert" on public.expense_categories for insert with check(public.is_business_admin(business_id));
create policy "expense category update" on public.expense_categories for update using(public.is_business_admin(business_id)) with check(public.is_business_admin(business_id));
create policy "expense category delete" on public.expense_categories for delete using(public.is_business_admin(business_id));
create policy "expense access" on public.expenses for all using(public.can_access_branch(business_id,branch_id)) with check(public.can_access_branch(business_id,branch_id));
create policy "maintenance access" on public.maintenance_requests for all using(public.can_access_property(business_id,property_id)) with check(public.can_access_property(business_id,property_id));
create policy "document access" on public.documents for all using((tenant_id is null and public.is_business_member(business_id)) or (tenant_id is not null and public.can_access_tenant(business_id,tenant_id))) with check((tenant_id is null and public.is_business_member(business_id)) or (tenant_id is not null and public.can_access_tenant(business_id,tenant_id)));
create policy "invitation admin access" on public.staff_invitations for all using(public.is_business_admin(business_id)) with check(public.is_business_admin(business_id));
create policy "notification member read" on public.notifications for select using(public.is_business_member(business_id) and (user_id is null or user_id=auth.uid()));
create policy "notification member insert" on public.notifications for insert with check(public.is_business_member(business_id) and (user_id is null or user_id=auth.uid()));
create policy "notification member update" on public.notifications for update using(public.is_business_member(business_id) and (user_id is null or user_id=auth.uid())) with check(public.is_business_member(business_id));
create policy "audit admin read" on public.audit_logs for select using(public.is_business_admin(business_id));

-- Storage buckets and policies
insert into storage.buckets(id,name,public) values('business-assets','business-assets',true) on conflict(id) do update set public=true;
insert into storage.buckets(id,name,public) values('tenant-documents','tenant-documents',false) on conflict(id) do nothing;
insert into storage.buckets(id,name,public) values('expense-documents','expense-documents',false) on conflict(id) do nothing;

create policy "business assets read" on storage.objects for select using(bucket_id='business-assets');
create policy "business assets write" on storage.objects for all using(bucket_id='business-assets' and public.is_business_member(((storage.foldername(name))[1])::uuid)) with check(bucket_id='business-assets' and public.is_business_member(((storage.foldername(name))[1])::uuid));
create policy "tenant docs access" on storage.objects for all using(bucket_id='tenant-documents' and public.can_access_tenant(((storage.foldername(name))[1])::uuid,((storage.foldername(name))[2])::uuid)) with check(bucket_id='tenant-documents' and public.can_access_tenant(((storage.foldername(name))[1])::uuid,((storage.foldername(name))[2])::uuid));
create policy "expense docs access" on storage.objects for all using(bucket_id='expense-documents' and public.can_access_branch(((storage.foldername(name))[1])::uuid,((storage.foldername(name))[3])::uuid)) with check(bucket_id='expense-documents' and public.can_access_branch(((storage.foldername(name))[1])::uuid,((storage.foldername(name))[3])::uuid));

-- Indexes
create index branches_business_idx on public.branches(business_id); create index properties_business_branch_idx on public.properties(business_id,branch_id);
create index units_business_property_idx on public.units(business_id,property_id); create index tenants_business_branch_idx on public.tenants(business_id,branch_id);
create index leases_business_tenant_idx on public.leases(business_id,tenant_id); create index leases_business_unit_idx on public.leases(business_id,unit_id);
create index charges_business_due_idx on public.rent_charges(business_id,due_date,status); create index payments_business_date_idx on public.payments(business_id,payment_date desc);
create index expenses_business_date_idx on public.expenses(business_id,expense_date desc); create index maintenance_business_status_idx on public.maintenance_requests(business_id,status);
create index notifications_business_created_idx on public.notifications(business_id,created_at desc); create index audit_business_created_idx on public.audit_logs(business_id,created_at desc);
create index tenants_business_name_idx on public.tenants(business_id,full_name); create index tenants_business_phone_idx on public.tenants(business_id,phone);
create index units_business_status_idx on public.units(business_id,status); create index leases_business_status_end_idx on public.leases(business_id,status,end_date);
create index receipts_business_number_idx on public.receipts(business_id,receipt_number); create index payments_business_reference_idx on public.payments(business_id,reference);

-- ---------------------------------------------------------------------------
-- V1 launch-polish extensions: personalization, calendar, timelines, reversals
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists preferences jsonb not null default '{}'::jsonb;
alter table public.maintenance_requests add column if not exists due_date date;
alter table public.payments add column if not exists reversed_at timestamptz;
alter table public.payments add column if not exists reversed_by uuid references public.profiles(id) on delete set null;
alter table public.payments add column if not exists reversal_reason text;
alter table public.receipts add column if not exists voided_at timestamptz;
alter table public.receipts add column if not exists void_reason text;

create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete restrict,
  unit_id uuid references public.units(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  title text not null default 'Property inspection',
  inspection_type text not null default 'ROUTINE',
  scheduled_date date not null,
  scheduled_time time,
  notes text,
  status text not null default 'SCHEDULED' check(status in ('SCHEDULED','COMPLETED','CANCELLED')),
  assigned_to uuid references public.business_members(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.validate_inspection_scope() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  if not exists(select 1 from public.properties p where p.id=new.property_id and p.business_id=new.business_id) then
    raise exception 'Inspection property must belong to the same business';
  end if;
  if new.unit_id is not null and not exists(select 1 from public.units u where u.id=new.unit_id and u.business_id=new.business_id and u.property_id=new.property_id) then
    raise exception 'Inspection unit must belong to the selected property and business';
  end if;
  if new.tenant_id is not null and not exists(select 1 from public.tenants t where t.id=new.tenant_id and t.business_id=new.business_id) then
    raise exception 'Inspection tenant must belong to the same business';
  end if;
  if new.assigned_to is not null and not exists(select 1 from public.business_members bm where bm.id=new.assigned_to and bm.business_id=new.business_id and bm.status='ACTIVE') then
    raise exception 'Assigned staff member must be active in the same business';
  end if;
  return new;
end $$;

drop trigger if exists validate_inspection_scope_trigger on public.inspections;
create trigger validate_inspection_scope_trigger before insert or update on public.inspections
for each row execute procedure public.validate_inspection_scope();

create table if not exists public.activity_events (
  id bigint generated always as identity primary key,
  business_id uuid not null references public.businesses(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id text not null,
  action text not null,
  title text not null,
  body text,
  tenant_id uuid references public.tenants(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  property_id uuid references public.properties(id) on delete set null,
  lease_id uuid references public.leases(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  occurred_at timestamptz not null default now()
);

alter table public.inspections enable row level security;
alter table public.activity_events enable row level security;

create policy "inspection access" on public.inspections for all
using(public.can_access_property(business_id,property_id))
with check(public.can_access_property(business_id,property_id));

create policy "activity member read" on public.activity_events for select using(
  public.is_business_member(business_id) and (
    public.is_business_admin(business_id)
    or (property_id is not null and public.can_access_property(business_id,property_id))
    or (unit_id is not null and public.can_access_unit(business_id,unit_id))
    or (tenant_id is not null and public.can_access_tenant(business_id,tenant_id))
    or (lease_id is not null and public.can_access_lease(business_id,lease_id))
    or (property_id is null and unit_id is null and tenant_id is null and lease_id is null)
  )
);

create or replace function public.capture_activity_event() returns trigger
language plpgsql security definer set search_path=public as $$
declare
  r jsonb;
  v_business uuid; v_entity_id text; v_entity text; v_label text;
  v_tenant uuid; v_unit uuid; v_property uuid; v_lease uuid; v_payment uuid;
  v_action text; v_title text; v_body text;
begin
  r:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_business:=nullif(r->>'business_id','')::uuid;
  v_entity_id:=coalesce(r->>'id','');
  if v_business is null or v_entity_id='' then return coalesce(new,old); end if;
  v_entity:=tg_table_name;
  v_action:=tg_op;
  v_tenant:=nullif(r->>'tenant_id','')::uuid;
  v_unit:=nullif(r->>'unit_id','')::uuid;
  v_property:=nullif(r->>'property_id','')::uuid;
  v_lease:=nullif(r->>'lease_id','')::uuid;
  v_payment:=case when tg_table_name='payments' then nullif(r->>'id','')::uuid else nullif(r->>'payment_id','')::uuid end;

  if tg_table_name='tenants' then v_tenant:=nullif(r->>'id','')::uuid; end if;
  if tg_table_name='units' then v_unit:=nullif(r->>'id','')::uuid; end if;
  if tg_table_name='properties' then v_property:=nullif(r->>'id','')::uuid; end if;
  if tg_table_name='leases' then v_lease:=nullif(r->>'id','')::uuid; end if;

  if v_lease is not null and (v_tenant is null or v_unit is null) then
    select l.tenant_id,l.unit_id into v_tenant,v_unit from public.leases l where l.id=v_lease;
  end if;
  if v_unit is not null and v_property is null then
    select u.property_id into v_property from public.units u where u.id=v_unit;
  end if;

  v_label:=coalesce(nullif(r->>'full_name',''),nullif(r->>'name',''),nullif(r->>'title',''),nullif(r->>'receipt_number',''),nullif(r->>'description',''));
  v_title:=initcap(replace(tg_table_name,'_',' '))||' '||lower(tg_op);
  v_body:=case when v_label is not null then v_label else null end;

  if tg_table_name='payments' and r->>'reversed_at' is not null then
    v_title:='Payment reversed';
    v_body:=coalesce(r->>'reversal_reason','Payment reversal recorded');
  elsif tg_table_name='leases' and tg_op='UPDATE' then
    v_body:='Lease status: '||coalesce(r->>'status','updated');
  elsif tg_table_name='maintenance_requests' then
    v_body:=coalesce(r->>'title','Maintenance request')||' · '||coalesce(r->>'status','OPEN');
  elsif tg_table_name='inspections' then
    v_body:=coalesce(r->>'title','Inspection')||' · '||coalesce(r->>'status','SCHEDULED');
  end if;

  insert into public.activity_events(business_id,actor_id,entity_type,entity_id,action,title,body,tenant_id,unit_id,property_id,lease_id,payment_id)
  values(v_business,auth.uid(),v_entity,v_entity_id,v_action,v_title,v_body,v_tenant,v_unit,v_property,v_lease,v_payment);
  return coalesce(new,old);
end $$;

-- Timeline triggers are intentionally separate from raw audit logs so normal staff
-- can read a sanitized chronological history without seeing before/after JSON.
do $$
declare t text;
begin
  foreach t in array array['properties','units','tenants','leases','payments','rent_charges','maintenance_requests','documents','inspections'] loop
    execute format('drop trigger if exists activity_%I on public.%I',t,t);
    execute format('create trigger activity_%I after insert or update or delete on public.%I for each row execute procedure public.capture_activity_event()',t,t);
  end loop;
end $$;

create or replace function public.reverse_rent_payment(p_payment_id uuid,p_reason text)
returns void language plpgsql security invoker set search_path=public as $$
declare p record; a record;
begin
  if nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'A reversal reason is required'; end if;
  select * into p from public.payments where id=p_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  if not public.can_access_lease(p.business_id,p.lease_id) then raise exception 'Access denied'; end if;
  if not public.is_business_admin(p.business_id) then raise exception 'Only an Owner or Admin can reverse payments'; end if;
  if p.reversed_at is not null then raise exception 'Payment has already been reversed'; end if;

  for a in select * from public.payment_allocations where payment_id=p_payment_id for update loop
    update public.rent_charges set paid_amount=greatest(0,paid_amount-a.amount),updated_at=now() where id=a.rent_charge_id;
  end loop;
  delete from public.payment_allocations where payment_id=p_payment_id;
  update public.payments set reversed_at=now(),reversed_by=auth.uid(),reversal_reason=trim(p_reason) where id=p_payment_id;
  update public.receipts set voided_at=now(),void_reason=trim(p_reason) where payment_id=p_payment_id;
  perform public.refresh_charge_statuses();
  insert into public.notifications(business_id,kind,title,body,href,dedupe_key)
    values(p.business_id,'PAYMENT','Payment reversed','A payment was reversed: '||trim(p_reason),'/payments','payment-reversed:'||p_payment_id::text)
    on conflict do nothing;
end $$;


-- Override advance-credit allocation so reversed payments never fund future rent.
create or replace function public.apply_unallocated_payments(p_lease_id uuid default null) returns integer language plpgsql security invoker set search_path=public as $$
declare p record; c record; v_remaining numeric; v_apply numeric; n integer:=0;
begin
  for p in
    select pay.id,pay.lease_id,pay.amount-coalesce(sum(pa.amount),0) remaining
    from public.payments pay left join public.payment_allocations pa on pa.payment_id=pay.id
    where pay.reversed_at is null and (p_lease_id is null or pay.lease_id=p_lease_id)
    group by pay.id,pay.lease_id,pay.amount
    having pay.amount-coalesce(sum(pa.amount),0)>0
    order by min(pay.payment_date),min(pay.created_at),pay.id
  loop
    v_remaining:=p.remaining;
    for c in select * from public.rent_charges where lease_id=p.lease_id and status<>'WAIVED' and paid_amount<amount order by due_date,id for update loop
      exit when v_remaining<=0;
      v_apply:=least(v_remaining,c.amount-c.paid_amount);
      insert into public.payment_allocations(business_id,payment_id,rent_charge_id,amount)
        select business_id,p.id,c.id,v_apply from public.payments where id=p.id
        on conflict(payment_id,rent_charge_id) do update set amount=public.payment_allocations.amount+excluded.amount;
      update public.rent_charges set paid_amount=paid_amount+v_apply,updated_at=now() where id=c.id;
      v_remaining:=v_remaining-v_apply; n:=n+1;
    end loop;
  end loop;
  perform public.refresh_charge_statuses();
  return n;
end $$;

create index if not exists inspections_business_date_idx on public.inspections(business_id,scheduled_date,status);
create index if not exists activity_business_date_idx on public.activity_events(business_id,occurred_at desc);
create index if not exists activity_tenant_idx on public.activity_events(business_id,tenant_id,occurred_at desc);
create index if not exists activity_unit_idx on public.activity_events(business_id,unit_id,occurred_at desc);
create index if not exists activity_property_idx on public.activity_events(business_id,property_id,occurred_at desc);
create index if not exists activity_lease_idx on public.activity_events(business_id,lease_id,occurred_at desc);
create index if not exists activity_payment_idx on public.activity_events(business_id,payment_id,occurred_at desc);
create index if not exists maintenance_business_due_idx on public.maintenance_requests(business_id,due_date,status);
create index if not exists payments_business_reversed_idx on public.payments(business_id,reversed_at);
