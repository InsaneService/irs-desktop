-- Run this in the Supabase SQL Editor.
-- Stores aggregate click counts only. No individual click events or visitor data.

create table if not exists public.element_click_counts (
  element_name text primary key,
  click_count bigint not null default 0 check (click_count >= 0)
);

alter table public.element_click_counts enable row level security;
revoke all on public.element_click_counts from anon, authenticated;

create or replace function public.track_element_click(p_element text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_element is null or length(trim(p_element)) = 0 or length(p_element) > 120 then
    return;
  end if;

  insert into public.element_click_counts (element_name, click_count)
  values (p_element, 1)
  on conflict (element_name)
  do update set click_count = public.element_click_counts.click_count + 1;
end;
$$;

revoke all on function public.track_element_click(text) from public;
grant execute on function public.track_element_click(text) to anon, authenticated;

-- Remove the public read endpoint from the earlier dashboard setup.
drop function if exists public.get_element_click_counts();
