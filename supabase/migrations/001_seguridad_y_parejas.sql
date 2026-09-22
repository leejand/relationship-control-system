-- ════════════════════════════════════════════════════════════════════
-- Alelí · 001 — Cierra el acceso público y crea el modelo de parejas
-- Ejecutar completo en Supabase → SQL Editor (una sola vez).
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Cerrar la tabla antigua ──────────────────────────────────────
-- Antes cualquiera con la anon key podía leer e insertar. Se quitan las
-- políticas públicas: con RLS activo y sin políticas, nadie accede desde
-- el cliente. Los datos se conservan para importarlos (ver claim_legacy).
alter table if exists relationship_data enable row level security;
drop policy if exists "public read"   on relationship_data;
drop policy if exists "public insert" on relationship_data;
revoke all on relationship_data from anon, authenticated;

-- ─── 2. Tablas ───────────────────────────────────────────────────────
create table if not exists couples (
  id           uuid primary key default gen_random_uuid(),
  name         text,
  anniversary  date,
  invite_code  text not null unique
               default upper(substr(md5(random()::text), 1, 6)),
  created_at   timestamptz not null default now()
);

create table if not exists profiles (
  id            uuid primary key references auth.users on delete cascade,
  display_name  text not null default 'Yo',
  color         text not null default 'terracota'
                check (color in ('terracota', 'lila', 'salvia', 'miel')),
  couple_id     uuid references couples on delete set null,
  created_at    timestamptz not null default now()
);

create table if not exists checkins (
  id          bigint generated always as identity primary key,
  couple_id   uuid not null references couples on delete cascade,
  user_id     uuid not null references profiles on delete cascade,
  date        date not null default current_date,
  ce          smallint not null check (ce  between 0 and 5),
  com         smallint not null check (com between 0 and 5),
  con         smallint not null check (con between 0 and 5),
  re          smallint not null check (re  between 0 and 5),
  sg          smallint not null check (sg  between 0 and 5),
  score       numeric(4,1) generated always as ((ce + com + re + sg) - con * 1.5) stored,
  mood        text check (mood in ('radiante', 'bien', 'neutral', 'cansado', 'triste', 'molesto')),
  note        text check (char_length(note) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, date)
);
create index if not exists checkins_couple_date on checkins (couple_id, date desc);

create table if not exists gratitudes (
  id          bigint generated always as identity primary key,
  couple_id   uuid not null references couples on delete cascade,
  author_id   uuid not null references profiles on delete cascade,
  body        text not null check (char_length(body) between 1 and 280),
  created_at  timestamptz not null default now()
);
create index if not exists gratitudes_couple on gratitudes (couple_id, created_at desc);

create table if not exists topics (
  id           bigint generated always as identity primary key,
  couple_id    uuid not null references couples on delete cascade,
  author_id    uuid not null references profiles on delete cascade,
  title        text not null check (char_length(title) between 1 and 140),
  resolved_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists topics_couple on topics (couple_id, created_at desc);

-- ─── 3. Utilidades ───────────────────────────────────────────────────
-- Pareja del usuario actual. security definer evita la recursión de RLS
-- al consultar profiles desde las propias políticas de profiles.
create or replace function my_couple_id() returns uuid
language sql stable security definer set search_path = public as $$
  select couple_id from profiles where id = auth.uid()
$$;

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists checkins_touch on checkins;
create trigger checkins_touch before update on checkins
  for each row execute function touch_updated_at();

-- Perfil automático al registrarse (toma el nombre del formulario).
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'Yo'))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ─── 4. RPC para crear o unirse a una pareja ─────────────────────────
create or replace function create_couple(p_name text default null) returns couples
language plpgsql security definer set search_path = public as $$
declare c couples;
begin
  if auth.uid() is null then raise exception 'no autenticado'; end if;
  if my_couple_id() is not null then raise exception 'ya perteneces a una pareja'; end if;
  insert into couples (name) values (nullif(trim(p_name), '')) returning * into c;
  update profiles set couple_id = c.id where id = auth.uid();
  return c;
end $$;

create or replace function join_couple(p_code text) returns couples
language plpgsql security definer set search_path = public as $$
declare c couples; members int;
begin
  if auth.uid() is null then raise exception 'no autenticado'; end if;
  if my_couple_id() is not null then raise exception 'ya perteneces a una pareja'; end if;
  select * into c from couples where invite_code = upper(trim(p_code));
  if c.id is null then raise exception 'código no válido'; end if;
  select count(*) into members from profiles where couple_id = c.id;
  if members >= 2 then raise exception 'esta pareja ya está completa'; end if;
  update profiles set couple_id = c.id where id = auth.uid();
  return c;
end $$;

create or replace function leave_couple() returns void
language sql security definer set search_path = public as $$
  update profiles set couple_id = null where id = auth.uid()
$$;

-- Importa los registros de la versión anterior (tabla relationship_data,
-- donde user_id era el nombre: 'Alejandro' o 'Lina').
create or replace function claim_legacy(p_name text) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if my_couple_id() is null then raise exception 'primero únete a una pareja'; end if;
  if to_regclass('public.relationship_data') is null then return 0; end if;
  insert into checkins (couple_id, user_id, date, ce, com, con, re, sg, created_at)
  select distinct on (date) my_couple_id(), auth.uid(), date, ce, com, con, re, sg, created_at
  from relationship_data
  where lower(user_id) = lower(trim(p_name))
  order by date, created_at desc
  on conflict (user_id, date) do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

revoke execute on function create_couple(text), join_couple(text), leave_couple(), claim_legacy(text) from anon;

-- ─── 5. Row Level Security ───────────────────────────────────────────
alter table couples    enable row level security;
alter table profiles   enable row level security;
alter table checkins   enable row level security;
alter table gratitudes enable row level security;
alter table topics     enable row level security;

-- couples: solo tu pareja; se crea/une por RPC.
drop policy if exists couples_select on couples;
create policy couples_select on couples for select to authenticated
  using (id = my_couple_id());
drop policy if exists couples_update on couples;
create policy couples_update on couples for update to authenticated
  using (id = my_couple_id()) with check (id = my_couple_id());

-- profiles: tú y tu pareja; solo editas el tuyo (y no puedes cambiarte de pareja a mano).
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select to authenticated
  using (id = auth.uid() or (couple_id is not null and couple_id = my_couple_id()));
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid() and couple_id is not distinct from my_couple_id());

-- checkins: la pareja lee todo; cada quien escribe solo lo suyo.
drop policy if exists checkins_select on checkins;
create policy checkins_select on checkins for select to authenticated
  using (couple_id = my_couple_id());
drop policy if exists checkins_insert on checkins;
create policy checkins_insert on checkins for insert to authenticated
  with check (user_id = auth.uid() and couple_id = my_couple_id());
drop policy if exists checkins_update on checkins;
create policy checkins_update on checkins for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid() and couple_id = my_couple_id());
drop policy if exists checkins_delete on checkins;
create policy checkins_delete on checkins for delete to authenticated
  using (user_id = auth.uid());

-- gratitudes: la pareja lee; el autor crea y borra.
drop policy if exists gratitudes_select on gratitudes;
create policy gratitudes_select on gratitudes for select to authenticated
  using (couple_id = my_couple_id());
drop policy if exists gratitudes_insert on gratitudes;
create policy gratitudes_insert on gratitudes for insert to authenticated
  with check (author_id = auth.uid() and couple_id = my_couple_id());
drop policy if exists gratitudes_delete on gratitudes;
create policy gratitudes_delete on gratitudes for delete to authenticated
  using (author_id = auth.uid());

-- topics: los dos leen, crean y marcan como hablado; borra el autor.
drop policy if exists topics_select on topics;
create policy topics_select on topics for select to authenticated
  using (couple_id = my_couple_id());
drop policy if exists topics_insert on topics;
create policy topics_insert on topics for insert to authenticated
  with check (author_id = auth.uid() and couple_id = my_couple_id());
drop policy if exists topics_update on topics;
create policy topics_update on topics for update to authenticated
  using (couple_id = my_couple_id()) with check (couple_id = my_couple_id());
drop policy if exists topics_delete on topics;
create policy topics_delete on topics for delete to authenticated
  using (author_id = auth.uid());

-- Tiempo real para ver al instante cuando la pareja registra algo.
do $$ begin
  alter publication supabase_realtime add table checkins, gratitudes, topics;
exception when others then null; end $$;
