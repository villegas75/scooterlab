-- ScootLab · esquema de Supabase. Pégalo entero en SQL Editor → Run.
create table if not exists public.docs (
  collection text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  owner uuid not null default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);
alter table public.docs replica identity full;
alter table public.docs enable row level security;

drop policy if exists "leer" on public.docs;
drop policy if exists "insertar" on public.docs;
drop policy if exists "actualizar" on public.docs;
drop policy if exists "borrar" on public.docs;

-- Leer: cualquier usuario con sesión. Las denuncias (reports) solo las ve quien las envió (tú las ves en el panel de Supabase).
create policy "leer" on public.docs for select to authenticated
  using (collection <> 'reports' or owner = auth.uid());

-- Crear: clips, mocap y denuncias libres; perfiles y seguidores solo con tu propio id.
create policy "insertar" on public.docs for insert to authenticated
  with check (owner = auth.uid() and (
    collection in ('clips', 'mocap', 'reports')
    or (collection in ('profiles', 'follows') and id = auth.uid()::text)));

-- Editar: solo lo tuyo (la captura mocap de un truco la puede cambiar cualquiera).
create policy "actualizar" on public.docs for update to authenticated
  using (owner = auth.uid() or collection = 'mocap')
  with check (owner = auth.uid() and (
    collection in ('clips', 'mocap')
    or (collection in ('profiles', 'follows') and id = auth.uid()::text)));

-- Borrar: solo lo tuyo.
create policy "borrar" on public.docs for delete to authenticated
  using (owner = auth.uid() or collection = 'mocap');

alter publication supabase_realtime add table public.docs;

insert into storage.buckets (id, name, public, file_size_limit)
values ('uploads', 'uploads', true, 52428800)
on conflict (id) do nothing;

drop policy if exists "subir propios" on storage.objects;
drop policy if exists "ver uploads" on storage.objects;
create policy "subir propios" on storage.objects for insert to authenticated
  with check (bucket_id = 'uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "ver uploads" on storage.objects for select using (bucket_id = 'uploads');
