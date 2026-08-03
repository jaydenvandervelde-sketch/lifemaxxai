-- ============================================================
--  Patron / Rowan — complete Supabase setup.
--  Run this ONCE in your Supabase project:  SQL Editor → New query → paste → Run.
--  It sets up BOTH:
--    1. the data table  (everything except photos: finance, water, gym, goals…)
--    2. the photo storage bucket + permissions  (progress pictures)
--  No login system — your project's keys are your identity. Re-running is safe.
-- ============================================================

-- 1) DATA — one table holds every page's saved state as JSON, keyed by page.
create table if not exists app_state (
  key        text primary key,
  data       jsonb,
  updated_at timestamptz default now()
);
alter table app_state enable row level security;
drop policy if exists "app_state rw" on app_state;
create policy "app_state rw" on app_state for all using (true) with check (true);

-- 2) PHOTOS — a Storage bucket for progress pictures (this is the part that
--    breaks when photos get stuffed into the table/browser instead).
--    public = true so the app can display them by URL.
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', true)
on conflict (id) do nothing;

-- 3) PHOTO PERMISSIONS — allow the app to upload / view / delete in that bucket.
drop policy if exists "progress read"   on storage.objects;
drop policy if exists "progress write"  on storage.objects;
drop policy if exists "progress delete" on storage.objects;
create policy "progress read"   on storage.objects for select using (bucket_id = 'progress-photos');
create policy "progress write"  on storage.objects for insert with check (bucket_id = 'progress-photos');
create policy "progress delete" on storage.objects for delete using (bucket_id = 'progress-photos');

-- 4) WHOOP TOKENS — optional server-side persistence for the WHOOP OAuth refresh
--    token, written only by the /api/whoop serverless functions using the
--    SERVICE ROLE key (never sent to the browser). Deliberately NOT given an
--    open "using (true)" policy like app_state: the anon/publishable key is
--    treated as public in this app, and a WHOOP refresh token must not be
--    readable with it. RLS stays enabled with no policies, so anon and
--    authenticated clients get zero access; the service role bypasses RLS by
--    design and is the only way in. Single row (id='default') because this
--    app is single-tenant per deployment — see the note above.
create table if not exists user_whoop_tokens (
  id            text primary key default 'default',
  access_token  text,
  refresh_token text not null,
  expires_at    timestamptz,
  updated_at    timestamptz default now()
);
alter table user_whoop_tokens enable row level security;

-- Done. Now copy your Project URL + anon public key (Settings → API)
-- into the app's  Settings → Cloud sync.
-- For WHOOP token persistence, also set SUPABASE_SERVICE_ROLE_KEY (Settings →
-- API → service_role secret) as a Vercel environment variable — server-side
-- only, never commit it or expose it to the browser.
