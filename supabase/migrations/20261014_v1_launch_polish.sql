-- RentFlow V1 launch-polish upgrade
-- Apply this to an existing database that already has the base schema.
-- A fresh project should run ../schema.sql instead.

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

drop policy if exists "inspection access" on public.inspections;
create policy "inspection access" on public.inspections for all
using(public.can_access_property(business_id,property_id))
with check(public.can_access_property(business_id,property_id));

drop policy if exists "activity member read" on public.activity_events;
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
