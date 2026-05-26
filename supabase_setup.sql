-- Ejecuta esto en el SQL Editor de Supabase

create table if not exists relationship_data (
  id    bigint generated always as identity primary key,
  user_id text    not null,
  date  date    not null,
  ce    int     not null check (ce between 0 and 5),
  com   int     not null check (com between 0 and 5),
  con   int     not null check (con between 0 and 5),
  re    int     not null check (re between 0 and 5),
  sg    int     not null check (sg between 0 and 5),
  score float   not null,
  created_at timestamptz default now()
);

-- Habilitar Row Level Security (RLS) — recomendado
alter table relationship_data enable row level security;

-- Política: cualquiera con la anon key puede leer e insertar
-- (para MVP sin auth; cámbiala si usas Supabase Auth)
create policy "public read"   on relationship_data for select using (true);
create policy "public insert" on relationship_data for insert with check (true);

-- Índice para queries por usuario y fecha
create index if not exists idx_user_date on relationship_data (user_id, date);
