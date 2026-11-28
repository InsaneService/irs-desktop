-- Run this in the Supabase SQL Editor.
-- One row per click: element, timestamp, and country code.
-- No visitor IP address or visitor identifier is stored.

create table if not exists public.element_click_events (
  id bigint generated always as identity primary key,
  element_name text not null,
  clicked_at timestamptz not null default now(),
  country_code text
);

alter table public.element_click_events enable row level security;
revoke all on public.element_click_events from anon, authenticated;

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

-- Remove the earlier public write/read RPCs.
drop function if exists public.track_element_click(text);
drop function if exists public.get_element_click_counts();

-- The old aggregate table is no longer needed: total clicks are the number
-- of rows for each element_name in element_click_events.
drop table if exists public.element_click_counts;
