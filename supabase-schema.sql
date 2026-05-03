create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  use_case text not null,
  country text not null,
  state_region text not null,
  plan_interest text not null,
  source_path text,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.waitlist
  add column if not exists country text not null default 'US',
  add column if not exists state_region text not null default 'Unknown';

alter table public.waitlist enable row level security;

drop policy if exists "Allow public waitlist inserts" on public.waitlist;
create policy "Allow public waitlist inserts"
on public.waitlist
for insert
to anon
with check (
  email is not null
  and position('@' in email) > 1
  and use_case in (
    'strategy_research',
    'portfolio_validation',
    'parameter_optimization',
    'live_monitoring'
  )
  and length(trim(country)) between 2 and 80
  and length(trim(state_region)) between 2 and 80
  and plan_interest in (
    'waitlist',
    'researcher',
    'operator',
    'custom'
  )
);

create or replace function public.waitlist_public_stats(recent_limit integer default 24)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  total_count bigint;
  recent_items jsonb;
begin
  select count(*) into total_count
  from public.waitlist;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'country', country,
        'state_region', state_region
      )
      order by created_at desc
    ),
    '[]'::jsonb
  )
  into recent_items
  from (
    select country, state_region, created_at
    from public.waitlist
    where length(trim(country)) >= 2
      and length(trim(state_region)) >= 2
    order by created_at desc
    limit greatest(1, least(recent_limit, 50))
  ) recent;

  return jsonb_build_object(
    'total_count', total_count,
    'recent', recent_items
  );
end;
$$;

grant execute on function public.waitlist_public_stats(integer) to anon;
