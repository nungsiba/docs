-- ============================================================
-- DOCSAVER — Supabase schema
-- Run this once in your Supabase project's SQL Editor
-- (Project → SQL Editor → New query → paste all → Run)
-- ============================================================

-- ------------------------------------------------------------
-- 1. USERS  (profile data; auth itself lives in Supabase's
--    built-in auth.users table, this just extends it)
-- ------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  uid text unique not null,              -- login ID shown to the family, e.g. "raj"
  name text not null,
  phone_number text,
  dob date,
  address text,
  role text not null default 'user' check (role in ('user','admin')),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. DOCUMENTS
-- ------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  doc_type text not null check (doc_type in (
    'aadhaar','pan','driving_license','atm_card',
    'passbook','birth_certificate','passport'
  )),
  source_type text not null check (source_type in ('uploaded_file','generated_pdf')),
  file_path text,                         -- path inside the 'documents' storage bucket
  fields jsonb not null default '{}'::jsonb, -- structured text fields for this doc type
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists documents_owner_idx on public.documents(owner_id);
create index if not exists documents_type_idx on public.documents(doc_type);

-- ------------------------------------------------------------
-- 3. Keep updated_at fresh
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4. Helper: is the current logged-in user an admin?
-- ------------------------------------------------------------
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- ------------------------------------------------------------
-- 5. Row Level Security
--    Family setting chosen: any signed-in family member can
--    VIEW every profile and document (fully open, as agreed).
--    Only the owner (or an admin) can INSERT/UPDATE/DELETE.
-- ------------------------------------------------------------
alter table public.users enable row level security;
alter table public.documents enable row level security;

-- USERS: anyone signed in can read every profile
drop policy if exists "users_select_all" on public.users;
create policy "users_select_all" on public.users
  for select using (auth.uid() is not null);

-- USERS: only an admin can create new profiles
drop policy if exists "users_insert_admin_only" on public.users;
create policy "users_insert_admin_only" on public.users
  for insert with check (public.is_admin());

-- USERS: a user can update their own row; an admin can update any row
drop policy if exists "users_update_self_or_admin" on public.users;
create policy "users_update_self_or_admin" on public.users
  for update using (auth.uid() = id or public.is_admin());

-- DOCUMENTS: anyone signed in can read every document
drop policy if exists "documents_select_all" on public.documents;
create policy "documents_select_all" on public.documents
  for select using (auth.uid() is not null);

-- DOCUMENTS: a user can add documents to their own profile; admin can add to any
drop policy if exists "documents_insert_self_or_admin" on public.documents;
create policy "documents_insert_self_or_admin" on public.documents
  for insert with check (auth.uid() = owner_id or public.is_admin());

-- DOCUMENTS: a user can edit their own documents; admin can edit any
drop policy if exists "documents_update_self_or_admin" on public.documents;
create policy "documents_update_self_or_admin" on public.documents
  for update using (auth.uid() = owner_id or public.is_admin());

-- DOCUMENTS: a user can delete their own documents; admin can delete any
drop policy if exists "documents_delete_self_or_admin" on public.documents;
create policy "documents_delete_self_or_admin" on public.documents
  for delete using (auth.uid() = owner_id or public.is_admin());

-- ------------------------------------------------------------
-- 6. Storage bucket for uploaded/generated files
--    (Create the bucket named "documents" from the Supabase
--    dashboard → Storage → New bucket → uncheck "Public".
--    Then run the policies below.)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "documents_bucket_read" on storage.objects;
create policy "documents_bucket_read" on storage.objects
  for select using (bucket_id = 'documents' and auth.uid() is not null);

drop policy if exists "documents_bucket_write" on storage.objects;
create policy "documents_bucket_write" on storage.objects
  for insert with check (bucket_id = 'documents' and auth.uid() is not null);

drop policy if exists "documents_bucket_update" on storage.objects;
create policy "documents_bucket_update" on storage.objects
  for update using (bucket_id = 'documents' and auth.uid() is not null);

drop policy if exists "documents_bucket_delete" on storage.objects;
create policy "documents_bucket_delete" on storage.objects
  for delete using (bucket_id = 'documents' and auth.uid() is not null);

-- ------------------------------------------------------------
-- 7. Seed the admin account
--    IMPORTANT: You must first create the admin's auth user
--    from Supabase Dashboard → Authentication → Add user:
--      email:    admin@docsaver.local
--      password: 7628@123
--    Then copy that user's UUID and run the insert below
--    (replace 'PASTE-ADMIN-AUTH-UUID-HERE').
-- ------------------------------------------------------------
-- insert into public.users (id, uid, name, role)
-- values ('PASTE-ADMIN-AUTH-UUID-HERE', 'admin', 'Family Admin', 'admin');
