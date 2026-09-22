# Alelí

Un minuto al día para saber cómo están, juntos. Cada persona registra cinco dimensiones de la relación, su estado de ánimo y una nota; la app muestra cómo va la pareja, sus tendencias y un espacio compartido para agradecer y para anotar lo que falta hablar.

**Stack:** Next.js 16 · React 19 · Tailwind CSS 4 · Supabase (Auth + Postgres + Realtime) · Recharts · Vitest

## Funcionalidades

| Pantalla | Qué hace |
|---|---|
| **Entrar / Crear cuenta** | Correo y contraseña con Supabase Auth. |
| **Pareja** | Crear el espacio (genera un código de 6 letras) o unirse con el código del otro. Máximo dos personas. |
| **Hoy** | Score de la pareja hoy, si cada uno ya registró, racha de días, días registrados juntos, cuenta regresiva al aniversario y el último agradecimiento. |
| **Registrar** | Cinco sliders (Conexión, Comunicación, Conflicto, Regulación, Satisfacción), ánimo y nota. Uno por persona y día: guardar de nuevo lo edita. Se puede completar el de ayer. |
| **Historial** | Registros agrupados por semana con su promedio, filtro por persona y detalle desplegable. |
| **Tendencias** | Evolución de los dos en 7/30/90 días o todo, comparación por dimensión e ideas automáticas (punto fuerte, qué cuidar, comparación con el periodo anterior, mejor día de la semana). |
| **Nosotros** | Agradecimientos con sugerencias para empezar, y una lista de temas por hablar que se marcan como resueltos. |
| **Ajustes** | Nombre y color, código de invitación, aniversario, exportar CSV e importar los registros de la versión anterior. |

Los cambios de la pareja aparecen en tiempo real. Tema claro y oscuro automáticos, `prefers-reduced-motion` respetado y diseño pensado para móvil (se puede añadir a la pantalla de inicio).

## Fórmula

```
score = (Conexión + Comunicación + Regulación + Satisfacción) − Conflicto × 1,5
```

| Score | Zona |
|---|---|
| ≥ 12 | Relación estable |
| 8 – 11,9 | Fricción moderada |
| < 8 | Alta tensión |

## Puesta en marcha

1. **Base de datos.** En Supabase → SQL Editor, ejecuta completo [`supabase/migrations/001_seguridad_y_parejas.sql`](supabase/migrations/001_seguridad_y_parejas.sql). Crea las tablas, las políticas RLS y **cierra el acceso público** de la tabla antigua `relationship_data`.
2. **Auth.** En Authentication → URL Configuration pon la URL del sitio (local: `http://localhost:3000`). Si no quieres confirmar correos en desarrollo, desactiva *Confirm email*.
3. **Variables.** `cp .env.example .env.local` y rellena la URL y la anon key (Settings → API).
4. `npm install` y `npm run dev` → http://localhost:3000

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run typecheck  # TypeScript
npm test           # tests de la lógica (score, zonas, rachas, fechas)
```

## Seguridad

- La anon key es pública por diseño; lo que protege los datos son las políticas RLS: cada persona solo ve los datos de su pareja y solo edita lo suyo.
- Unirse a una pareja pasa por la función `join_couple`, que valida el código y el límite de dos personas; `couple_id` no se puede cambiar a mano.
- La tabla antigua queda sin acceso desde el cliente; sus datos se importan con `claim_legacy` desde Ajustes.

## Estructura

```
app/
  page.tsx               Entrar / crear cuenta
  pareja/                Crear o unirse a una pareja
  (app)/                 Requiere sesión y pareja (layout con guardas + navegación)
    hoy/ registro/ historial/ tendencias/ nosotros/ ajustes/
components/              AppProvider (sesión, pareja, realtime), ScoreRing, MetricSlider, Charts, BottomNav, ui
lib/
  metrics.ts             Dimensiones, score, zonas, promedios (puro, testeado)
  dates.ts               Fechas locales, rachas, semanas, aniversario (puro, testeado)
  api.ts                 Acceso a Supabase
supabase/migrations/     Esquema, RLS y funciones
tests/                   Vitest
```

## Despliegue

Vercel: importa el repo y define `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Añade la URL de producción en Supabase → Authentication → URL Configuration.
