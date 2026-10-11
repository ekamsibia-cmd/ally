-- Plans and access. Run once in Supabase: SQL Editor > New query > paste > Run. Safe to run again.

-- 1. Each brand has a plan. New brands start on 'starter'.
alter table public.brands add column if not exists plan text not null default 'starter';
alter table public.brands drop constraint if exists brands_plan_check;
alter table public.brands add constraint brands_plan_check check (plan in ('starter','growth','studio','enterprise'));

-- 2. Users can rename their brand but can NOT change their own plan.
revoke update on public.brands from authenticated;
grant update (name) on public.brands to authenticated;

-- 3. Limits per plan
create or replace function public.plan_limit(p text, k text) returns int
language sql immutable as $$
  select case k
    when 'campaigns' then case p when 'starter' then 1 when 'growth' then 5 else 1000000 end
    when 'creators'  then case p when 'starter' then 15 when 'growth' then 200 else 1000000 end
    when 'members'   then case p when 'starter' then 1 when 'growth' then 5 when 'studio' then 15 else 1000000 end
  end
$$;

create or replace function public.enforce_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare pl text; n int; lim int; k text := tg_argv[0];
begin
  select plan into pl from public.brands where id = new.brand_id;
  execute format('select count(*) from public.%I where brand_id = $1', tg_table_name) into n using new.brand_id;
  lim := public.plan_limit(pl, k);
  if n >= lim then
    raise exception 'Your % plan allows % %. Upgrade to add more.', pl, lim, k;
  end if;
  return new;
end $$;

drop trigger if exists lim_campaigns on public.campaigns;
create trigger lim_campaigns before insert on public.campaigns for each row execute function public.enforce_limit('campaigns');
drop trigger if exists lim_creators on public.creators;
create trigger lim_creators before insert on public.creators for each row execute function public.enforce_limit('creators');
drop trigger if exists lim_members on public.members;
create trigger lim_members before insert on public.members for each row execute function public.enforce_limit('members');

-- 4. Payments and results are Growth and above
create or replace function public.enforce_plan_features() returns trigger
language plpgsql security definer set search_path = public as $$
declare pl text;
begin
  select plan into pl from public.brands where id = new.brand_id;
  if pl = 'starter' and (
       new.pay_status is distinct from old.pay_status
    or new.reach  is distinct from old.reach
    or new.clicks is distinct from old.clicks
    or new.orders is distinct from old.orders) then
    raise exception 'Payments and results are on the Growth plan and above.';
  end if;
  return new;
end $$;
drop trigger if exists feat_cc on public.campaign_creators;
create trigger feat_cc before update on public.campaign_creators for each row execute function public.enforce_plan_features();

-- To switch a brand's plan after you confirm payment, run (replace the name):
--   update public.brands set plan = 'growth' where name = 'Glowkind';
