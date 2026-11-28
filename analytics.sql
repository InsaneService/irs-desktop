-- Run this in the Supabase SQL Editor.
-- Table 1: one row per click, with timestamp and optional country code.
-- Table 2: one row per element, with its total click count.
-- No visitor IP address or visitor identifier is stored.

create table if not exists public.element_click_events (
  id bigint generated always as identity primary key,
  element_name text not null,
  clicked_at timestamptz not null default now(),
  country_code text
);

alter table public.element_click_events enable row level security;
revoke all on public.element_click_events from anon, authenticated;

-- Popularity summary: one row per element/button.
create table if not exists public.element_click_popularity (
  element_name text primary key,
  click_count bigint not null default 0,
  last_clicked_at timestamptz
);

alter table public.element_click_popularity enable row level security;
revoke all on public.element_click_popularity from anon, authenticated;

-- Populate/update the summary from all clicks already recorded.
insert into public.element_click_popularity (element_name, click_count, last_clicked_at)
select element_name, count(*), max(clicked_at)
from public.element_click_events
group by element_name
on conflict (element_name) do update
set click_count = excluded.click_count,
    last_clicked_at = excluded.last_clicked_at;

-- Keep the popularity summary up to date whenever a new click is recorded.
create or replace function public.update_element_click_popularity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.element_click_popularity (element_name, click_count, last_clicked_at)
  values (new.element_name, 1, new.clicked_at)
  on conflict (element_name) do update
  set click_count = public.element_click_popularity.click_count + 1,
      last_clicked_at = excluded.last_clicked_at;

  return new;
end;
$$;

drop trigger if exists element_click_popularity_after_insert on public.element_click_events;
create trigger element_click_popularity_after_insert
after insert on public.element_click_events
for each row execute function public.update_element_click_popularity();

create or replace function public.record_element_click(p_element text, p_country text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  safe_country text;
begin
  if p_element is null or length(trim(p_element)) = 0 or length(p_element) > 120 then
    return;
  end if;

  safe_country := upper(trim(coalesce(p_country, '')));
  if safe_country !~ '^[A-Z]{2}$' then
    safe_country := null;
  end if;

  insert into public.element_click_events (element_name, country_code)
  values (trim(p_element), safe_country);
end;
$$;

revoke all on function public.record_element_click(text, text) from public;
grant execute on function public.record_element_click(text, text) to service_role;
revoke all on function public.update_element_click_popularity() from public;

-- Remove the earlier public write/read RPCs and obsolete aggregate table.
drop function if exists public.track_element_click(text);
drop function if exists public.get_element_click_counts();
drop table if exists public.element_click_counts;
