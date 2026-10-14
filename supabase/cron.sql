-- Optional Supabase pg_cron jobs. Run after enabling pg_cron.
select cron.schedule('rentflow-generate-rent','5 0 1 * *',$$select public.generate_rent_charges(date_trunc('month',current_date)::date);$$);
select cron.schedule('rentflow-refresh-status','15 0 * * *',$$select public.refresh_operational_alerts();$$);
