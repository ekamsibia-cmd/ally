-- Ally database schema. Run once in Supabase: SQL Editor > New query > paste > Run.
create extension if not exists pgcrypto;

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
create table public.members (
  brand_id uuid not null references public.brands on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  email text,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (brand_id, user_id)
);
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands on delete cascade,
  email text not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  accepted boolean not null default false,
  created_at timestamptz not null default now()
);
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands on delete cascade,
  name text not null,
  product text not null default '',
  budget numeric not null default 0,
  aov numeric not null default 0,
  deliverables text not null default '',
  created_at timestamptz not null default now()
);
create table public.creators (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands on delete cascade,
  name text not null,
  handle text not null default '',
  city text not null default '',
  niche text not null default '',
  followers integer not null default 0,
  er numeric not null default 0,
  rate numeric not null default 0,
  phone text not null default '',
  email text not null default '',
  upi text not null default '',
  created_at timestamptz not null default now()
);
create table public.campaign_creators (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands on delete cascade,
  campaign_id uuid not null references public.campaigns on delete cascade,
  creator_id uuid not null references public.creators on delete cascade,
  stage text not null default 'Shortlisted' check (stage in ('Shortlisted','Contacted','Negotiating','Confirmed','Shipped','Posted')),
  fee numeric not null default 0,
  pay_status text not null default 'unpaid' check (pay_status in ('unpaid','advance','paid')),
  due date,
  live_date date,
  post_url text not null default '',
  tracking_no text not null default '',
  reach integer,
  clicks integer,
  orders integer,
  created_at timestamptz not null default now(),
  unique (campaign_id, creator_id)
);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands on delete cascade,
  campaign_creator_id uuid references public.campaign_creators on delete cascade,
  channel text not null,
  body text not null,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

-- Helper functions (security definer so policies don't recurse)
create or replace function public.is_member(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where brand_id = b and user_id = auth.uid());
$$;
create or replace function public.is_owner(b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members where brand_id = b and user_id = auth.uid() and role = 'owner');
$$;

-- Create a brand and make the caller its owner
create or replace function public.create_brand(p_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare b uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  insert into public.brands(name) values (p_name) returning id into b;
  insert into public.members(brand_id, user_id, email, role) values (b, auth.uid(), auth.jwt() ->> 'email', 'owner');
  return b;
end $$;

-- Accept an invite. The signed-in email must match the invited email.
create or replace function public.accept_invite(p_token text) returns uuid
language plpgsql security definer set search_path = public as $$
declare inv public.invites;
begin
  select * into inv from public.invites where token = p_token and accepted = false;
  if not found then raise exception 'Invite not found or already used'; end if;
  if lower(inv.email) <> lower(auth.jwt() ->> 'email') then raise exception 'This invite was sent to a different email'; end if;
  insert into public.members(brand_id, user_id, email, role) values (inv.brand_id, auth.uid(), inv.email, 'member') on conflict do nothing;
  update public.invites set accepted = true where id = inv.id;
  return inv.brand_id;
end $$;

revoke all on function public.create_brand(text), public.accept_invite(text) from public, anon;
grant execute on function public.create_brand(text), public.accept_invite(text) to authenticated;

-- Row-level security: every brand only sees its own rows
alter table public.brands enable row level security;
alter table public.members enable row level security;
alter table public.invites enable row level security;
alter table public.campaigns enable row level security;
alter table public.creators enable row level security;
alter table public.campaign_creators enable row level security;
alter table public.messages enable row level security;

create policy brands_select on public.brands for select to authenticated using (public.is_member(id));
create policy brands_update on public.brands for update to authenticated using (public.is_owner(id));
create policy members_select on public.members for select to authenticated using (user_id = auth.uid() or public.is_member(brand_id));
create policy members_remove on public.members for delete to authenticated using (public.is_owner(brand_id) and user_id <> auth.uid());
create policy invites_all on public.invites for all to authenticated using (public.is_owner(brand_id)) with check (public.is_owner(brand_id));
create policy campaigns_all on public.campaigns for all to authenticated using (public.is_member(brand_id)) with check (public.is_member(brand_id));
create policy creators_all on public.creators for all to authenticated using (public.is_member(brand_id)) with check (public.is_member(brand_id));
create policy cc_all on public.campaign_creators for all to authenticated using (public.is_member(brand_id))
  with check (
    public.is_member(brand_id)
    and exists (select 1 from public.campaigns c where c.id = campaign_id and c.brand_id = campaign_creators.brand_id)
    and exists (select 1 from public.creators r where r.id = creator_id and r.brand_id = campaign_creators.brand_id)
  );
create policy messages_all on public.messages for all to authenticated using (public.is_member(brand_id)) with check (public.is_member(brand_id));
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
