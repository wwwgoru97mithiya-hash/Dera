-- Dera database setup
-- Paste this whole file into Supabase -> SQL Editor -> New query, then click Run.

create extension if not exists btree_gist;

-- LISTINGS ------------------------------------------------------------
create table if not exists public.listings (
  id          bigint generated always as identity primary key,
  host_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  host_name   text not null check (char_length(host_name) between 1 and 40),
  title       text not null check (char_length(title) between 3 and 80),
  city        text not null check (char_length(city) between 2 and 60),
  state       text not null check (char_length(state) between 2 and 40),
  vibe        text not null default 'homestay'
              check (vibe in ('beach','mountains','desert','backwaters','forest','heritage','city','homestay')),
  description text not null default '' check (char_length(description) <= 2000),
  amenities   text[] not null default '{}',
  price       integer not null check (price between 100 and 500000),
  max_guests  integer not null check (max_guests between 1 and 30),
  photos      text[] not null default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists listings_city_idx on public.listings (lower(city));

alter table public.listings enable row level security;

drop policy if exists "Anyone can view active listings" on public.listings;
create policy "Anyone can view active listings" on public.listings
  for select using (is_active or host_id = auth.uid());

drop policy if exists "Hosts create own listings" on public.listings;
create policy "Hosts create own listings" on public.listings
  for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "Hosts update own listings" on public.listings;
create policy "Hosts update own listings" on public.listings
  for update to authenticated using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "Hosts delete own listings" on public.listings;
create policy "Hosts delete own listings" on public.listings
  for delete to authenticated using (host_id = auth.uid());

-- BOOKINGS ------------------------------------------------------------
create table if not exists public.bookings (
  id            bigint generated always as identity primary key,
  listing_id    bigint not null references public.listings(id) on delete cascade,
  guest_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  guest_name    text not null check (char_length(guest_name) between 1 and 60),
  guest_phone   text not null check (guest_phone ~ '^[0-9+ -]{10,15}$'),
  check_in      date not null,
  check_out     date not null,
  guests        integer not null check (guests >= 1),
  total         integer not null check (total >= 0),
  message       text not null default '' check (char_length(message) <= 500),
  host_reply    text not null default '' check (char_length(host_reply) <= 500),
  status        text not null default 'pending'
                check (status in ('pending','approved','declined','cancelled')),
  created_at    timestamptz not null default now(),
  check (check_out > check_in),
  -- Two APPROVED bookings for the same stay can never overlap
  constraint no_double_booking exclude using gist (
    listing_id with =,
    daterange(check_in, check_out, '[)') with &&
  ) where (status = 'approved')
);

alter table public.bookings enable row level security;

-- Is the current user the host of this listing?
create or replace function public.is_host_of(lid bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.listings where id = lid and host_id = auth.uid());
$$;

drop policy if exists "Guest and host can view booking" on public.bookings;
create policy "Guest and host can view booking" on public.bookings
  for select to authenticated using (guest_id = auth.uid() or public.is_host_of(listing_id));

drop policy if exists "Guests request bookings" on public.bookings;
create policy "Guests request bookings" on public.bookings
  for insert to authenticated
  with check (guest_id = auth.uid() and status = 'pending' and not public.is_host_of(listing_id));

drop policy if exists "Guest and host can update booking" on public.bookings;
create policy "Guest and host can update booking" on public.bookings
  for update to authenticated using (guest_id = auth.uid() or public.is_host_of(listing_id));

-- Only allow the right status changes: host approves/declines, guest cancels.
create or replace function public.guard_booking_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.listing_id <> old.listing_id or new.guest_id <> old.guest_id
     or new.check_in <> old.check_in or new.check_out <> old.check_out
     or new.total <> old.total or new.guests <> old.guests then
    raise exception 'Booking details cannot be changed';
  end if;
  if new.status <> old.status then
    if public.is_host_of(old.listing_id) and old.status = 'pending'
       and new.status in ('approved','declined') then
      return new;
    elsif old.guest_id = auth.uid() and old.status in ('pending','approved')
       and new.status = 'cancelled' then
      new.host_reply := old.host_reply;
      return new;
    else
      raise exception 'Not allowed to change this booking to %', new.status;
    end if;
  end if;
  if new.host_reply <> old.host_reply and not public.is_host_of(old.listing_id) then
    raise exception 'Only the host can reply';
  end if;
  return new;
end $$;

drop trigger if exists bookings_guard on public.bookings;
create trigger bookings_guard before update on public.bookings
  for each row execute function public.guard_booking_update();

-- Dates already taken (approved) for a stay, visible to everyone, no personal data.
create or replace function public.booked_dates(lid bigint)
returns table (check_in date, check_out date)
language sql stable security definer set search_path = public as $$
  select check_in, check_out from public.bookings
  where listing_id = lid and status = 'approved' and check_out >= current_date
  order by check_in;
$$;
grant execute on function public.booked_dates(bigint) to anon, authenticated;

-- PHOTO STORAGE -------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view photos" on storage.objects;
create policy "Anyone can view photos" on storage.objects
  for select using (bucket_id = 'photos');

drop policy if exists "Users upload to own folder" on storage.objects;
create policy "Users upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own photos" on storage.objects;
create policy "Users delete own photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
