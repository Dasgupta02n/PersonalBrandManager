-- Fixes from the Supabase security advisor.

-- Pin the search path of the updated_at trigger helper.
alter function public.set_updated_at() set search_path = '';

-- The signup trigger function must not be callable through the API (/rest/v1/rpc).
-- Triggers still fire: EXECUTE is checked when a trigger is created, not when it runs.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
