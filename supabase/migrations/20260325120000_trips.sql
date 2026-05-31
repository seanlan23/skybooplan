-- trips: uporabniški AI potovalni plani + PDF paywall
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  destination text not null,
  itinerary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  pdf_unlocked boolean not null default false,
  payment_id text
);

create index if not exists trips_user_id_idx on public.trips (user_id);
create index if not exists trips_created_at_idx on public.trips (created_at desc);

alter table public.trips enable row level security;

create policy "Users can select own trips"
  on public.trips for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own trips"
  on public.trips for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own trips"
  on public.trips for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own trips"
  on public.trips for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.trips to authenticated;
