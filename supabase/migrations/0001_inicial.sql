-- =============================================================================
--  Catequesis de Confirmación — esquema, RLS y Storage
--  Compatible con Supabase Cloud (aplicar desde el SQL Editor).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tablas
-- -----------------------------------------------------------------------------

create table if not exists public.catequistas (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nombre text,
  rol text not null default 'editor' check (rol in ('principal', 'editor')),
  user_id uuid unique references auth.users (id) on delete set null,
  invitado_por uuid references public.catequistas (id) on delete set null,
  invitado_at timestamptz not null default now(),
  aceptado_at timestamptz
);

-- El email se compara sin distinguir mayúsculas, pero sin depender de citext.
create unique index if not exists catequistas_email_unico
  on public.catequistas (lower(email));

create table if not exists public.temas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  contenido text,
  estado text not null default 'borrador' check (estado in ('borrador', 'publicado')),
  orden integer not null default 0,
  fecha date,
  creado_por uuid references public.catequistas (id) on delete set null,
  creado_at timestamptz not null default now(),
  actualizado_at timestamptz not null default now()
);

create index if not exists temas_orden_idx on public.temas (orden);
create index if not exists temas_estado_idx on public.temas (estado);

create table if not exists public.archivos (
  id uuid primary key default gen_random_uuid(),
  tema_id uuid not null references public.temas (id) on delete cascade,
  nombre text not null,
  ruta text not null,
  mime text,
  tamano bigint,
  orden integer not null default 0,
  subido_por uuid references public.catequistas (id) on delete set null,
  creado_at timestamptz not null default now()
);

create index if not exists archivos_tema_idx on public.archivos (tema_id);

-- -----------------------------------------------------------------------------
-- 2. Funciones auxiliares
--    security definer para que las políticas puedan leer `catequistas`
--    sin entrar en recursión con su propia RLS.
-- -----------------------------------------------------------------------------

create or replace function public.es_catequista()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.catequistas c
    where c.user_id = auth.uid()
  );
$$;

create or replace function public.es_principal()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.catequistas c
    where c.user_id = auth.uid()
      and c.rol = 'principal'
  );
$$;

-- -----------------------------------------------------------------------------
-- 3. Triggers
-- -----------------------------------------------------------------------------

-- Marca la hora de la última modificación de un tema.
create or replace function public.tocar_actualizado_at()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_at := now();
  return new;
end;
$$;

drop trigger if exists trg_temas_actualizado_at on public.temas;
create trigger trg_temas_actualizado_at
  before update on public.temas
  for each row execute function public.tocar_actualizado_at();

-- Convierte un email en minúsculas al invitar a un catequista.
create or replace function public.normalizar_email()
returns trigger
language plpgsql
as $$
begin
  new.email := lower(trim(new.email));
  return new;
end;
$$;

drop trigger if exists trg_catequistas_email on public.catequistas;
create trigger trg_catequistas_email
  before insert or update of email on public.catequistas
  for each row execute function public.normalizar_email();

-- Núcleo del acceso por invitación: cuando alguien crea su cuenta en Supabase
-- Auth, si su email estaba previamente invitado, se enlaza automáticamente.
create or replace function public.vincular_catequista()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.catequistas
     set user_id = new.id,
         aceptado_at = coalesce(aceptado_at, now())
   where lower(email) = lower(new.email)
     and user_id is null;
  return new;
end;
$$;

drop trigger if exists trg_vincular_catequista on auth.users;
create trigger trg_vincular_catequista
  after insert on auth.users
  for each row execute function public.vincular_catequista();

-- -----------------------------------------------------------------------------
-- 4. Row Level Security
-- -----------------------------------------------------------------------------

alter table public.catequistas enable row level security;
alter table public.temas enable row level security;
alter table public.archivos enable row level security;

-- --- Temas: lectura pública solo de lo publicado -----------------------------
drop policy if exists "temas: leer publicados" on public.temas;
create policy "temas: leer publicados" on public.temas
  for select
  to anon, authenticated
  using (estado = 'publicado' or public.es_catequista());

drop policy if exists "temas: catequistas escriben" on public.temas;
create policy "temas: catequistas escriben" on public.temas
  for all
  to authenticated
  using (public.es_catequista())
  with check (public.es_catequista());

-- --- Archivos: públicos si su tema está publicado ---------------------------
drop policy if exists "archivos: leer publicados" on public.archivos;
create policy "archivos: leer publicados" on public.archivos
  for select
  to anon, authenticated
  using (
    public.es_catequista()
    or exists (
      select 1 from public.temas t
      where t.id = archivos.tema_id
        and t.estado = 'publicado'
    )
  );

drop policy if exists "archivos: catequistas escriben" on public.archivos;
create policy "archivos: catequistas escriben" on public.archivos
  for all
  to authenticated
  using (public.es_catequista())
  with check (public.es_catequista());

-- --- Catequistas: el principal administra el equipo ------------------------
drop policy if exists "catequistas: leer los propios" on public.catequistas;
create policy "catequistas: leer los propios" on public.catequistas
  for select
  to authenticated
  using (public.es_principal() or user_id = auth.uid());

drop policy if exists "catequistas: principal invita" on public.catequistas;
create policy "catequistas: principal invita" on public.catequistas
  for insert
  to authenticated
  with check (public.es_principal() and rol = 'editor');

drop policy if exists "catequistas: principal edita" on public.catequistas;
create policy "catequistas: principal edita" on public.catequistas
  for update
  to authenticated
  using (public.es_principal())
  with check (public.es_principal());

-- La fila del principal no se puede borrar desde la app (verificación extra
-- además de la RLS, para protegerlo aunque el rol cambie).
drop policy if exists "catequistas: principal elimina editores" on public.catequistas;
create policy "catequistas: principal elimina editores" on public.catequistas
  for delete
  to authenticated
  using (public.es_principal() and rol = 'editor');

-- -----------------------------------------------------------------------------
-- 5. Storage
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('materiales', 'materiales', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "materiales: lectura publica" on storage.objects;
create policy "materiales: lectura publica" on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'materiales');

drop policy if exists "materiales: catequistas escriben" on storage.objects;
create policy "materiales: catequistas escriben" on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'materiales' and public.es_catequista());

drop policy if exists "materiales: catequistas actualizan" on storage.objects;
create policy "materiales: catequistas actualizan" on storage.objects
  for update
  to authenticated
  using (bucket_id = 'materiales' and public.es_catequista())
  with check (bucket_id = 'materiales' and public.es_catequista());

drop policy if exists "materiales: catequistas borran" on storage.objects;
create policy "materiales: catequistas borran" on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'materiales' and public.es_catequista());

-- =============================================================================
--  Paso final (una sola vez): crea al catequista principal.
--  Reemplaza el email y el nombre, descomenta la línea y ejecuta en el SQL Editor.
-- =============================================================================
--
-- insert into public.catequistas (email, nombre, rol)
-- values ('tucorreo@ejemplo.com', 'Nombre Apellido', 'principal');