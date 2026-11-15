-- Calendar-feed sync: feeds a parent pastes into Settings are pulled hourly
-- into entries. Additive only; existing rows and policies are untouched.

create table if not exists public.feeds (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  person text not null,
  label text not null,
  kind text not null default 'canvas' check (kind in ('canvas', 'ics')),
  default_category text,
  url text not null,
  enabled boolean not null default true,
  last_synced_at timestamptz,
  last_ok_at timestamptz,
  last_status text,
  created_at timestamptz not null default now()
);
create index if not exists idx_feeds_family on public.feeds(family_id);

alter table public.feeds enable row level security;

create policy "family read feeds" on public.feeds for select to authenticated
  using (family_id in (select family_id from public.family_members where user_id = (select auth.uid())));
create policy "family write feeds" on public.feeds for insert to authenticated
  with check (family_id in (select family_id from public.family_members where user_id = (select auth.uid())));
create policy "family update feeds" on public.feeds for update to authenticated
  using (family_id in (select family_id from public.family_members where user_id = (select auth.uid())))
  with check (family_id in (select family_id from public.family_members where user_id = (select auth.uid())));
create policy "family delete feeds" on public.feeds for delete to authenticated
  using (family_id in (select family_id from public.family_members where user_id = (select auth.uid())));

-- Where an entry came from. Manual entries keep source = 'manual'.
alter table public.entries
  add column if not exists source text not null default 'manual',
  add column if not exists feed_id uuid references public.feeds(id) on delete cascade,
  add column if not exists source_uid text,
  add column if not exists source_url text,
  add column if not exists due_at timestamptz;

create unique index if not exists entries_feed_uid_key
  on public.entries(feed_id, source_uid) where feed_id is not null;

-- One place that creates a week, safe to call from two phones and the sync job
-- at the same time. Carries the Day 1-8 rotation forward from the prior week.
create or replace function public.ensure_week(p_family uuid, p_start date)
returns public.weeks
language plpgsql
set search_path = ''
as $$
declare
  w public.weeks;
  prev public.weeks;
  last_num int;
  d date;
  nums jsonb := '{}'::jsonb;
  n int;
begin
  if extract(isodow from p_start) <> 1 then
    raise exception 'Week must start on a Monday';
  end if;

  select * into w from public.weeks where family_id = p_family and start_date = p_start;
  if found then return w; end if;

  select * into prev from public.weeks where family_id = p_family and start_date = p_start - 7;
  if found then
    for i in reverse 4..0 loop
      d := prev.start_date + i;
      if not (d::text = any(coalesce(prev.global_no_school, '{}')))
         and coalesce(prev.day_numbers, '{}'::jsonb) ? d::text then
        last_num := (prev.day_numbers ->> d::text)::int;
        exit;
      end if;
    end loop;
    if last_num is not null then
      n := last_num;
      for i in 0..4 loop
        n := (n % 8) + 1;
        nums := nums || jsonb_build_object((p_start + i)::text, n);
      end loop;
    end if;
  end if;

  insert into public.weeks (family_id, start_date, end_date, day_numbers, global_no_school, person_no_school)
  values (p_family, p_start, p_start + 6, nums, '{}', '{}'::jsonb)
  on conflict (family_id, start_date) do nothing
  returning * into w;

  if not found then
    select * into w from public.weeks where family_id = p_family and start_date = p_start;
  end if;
  return w;
end;
$$;

revoke all on function public.ensure_week(uuid, date) from public, anon;
grant execute on function public.ensure_week(uuid, date) to authenticated, service_role;

-- Scheduler: hourly call to the sync function, authenticated by a random
-- secret that lives only in Vault.
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'sync_secret') then
    perform vault.create_secret(
      replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
      'sync_secret',
      'Shared secret between pg_cron and the sync-feeds function'
    );
  end if;
end $$;

create or replace function public.verify_sync_secret(p_secret text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'sync_secret' and decrypted_secret = p_secret
  );
$$;

revoke all on function public.verify_sync_secret(text) from public, anon, authenticated;
grant execute on function public.verify_sync_secret(text) to service_role;
