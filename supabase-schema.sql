create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  use_case text not null,
  plan_interest text not null,
  source_path text,
  user_agent text,
  created_at timestamptz not null default now()
);

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
  and plan_interest in (
    'waitlist',
    'researcher',
    'operator',
    'custom'
  )
);
