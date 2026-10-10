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
