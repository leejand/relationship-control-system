# 🫀 Relationship Control System

Dashboard emocional para parejas — Next.js + Supabase + Tailwind

---

## 🚀 Setup en 5 pasos

### 1. Clonar / extraer el proyecto

```bash
cd relationship-control-system
npm install
```

### 2. Crear proyecto en Supabase

1. Ve a https://supabase.com → New project
2. Copia tu **Project URL** y **anon public key** desde:
   - `Settings → API`

### 3. Crear la tabla SQL

1. En Supabase → **SQL Editor**
2. Pega el contenido de `supabase_setup.sql` y ejecútalo

### 4. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Edita `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://TUPROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 5. Correr en local

```bash
npm run dev
```

Abre http://localhost:3000

---

## 🌐 Deploy en Vercel

```bash
# Instala Vercel CLI (opcional)
npm i -g vercel
vercel

# O simplemente sube el repo a GitHub y conecta en vercel.com
```

En Vercel → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 📱 Uso

1. Abre la app → elige tu usuario (Persona A / Persona B)
2. Ajusta los sliders con tus métricas del día
3. Presiona **Guardar registro de hoy**
4. Ve al tab **Historial** o **Gráfica** para ver evolución

---

## 🧮 Fórmula

```
score = (CE + COM + RE + SG) - (CON × 1.5)
```

| Score | Estado |
|-------|--------|
| ≥ 12  | Relación estable 💚 |
| 8–12  | Fricción moderada 💛 |
| < 8   | Alta tensión ❤️‍🔥 |

---

## 🗂 Estructura

```
app/
  page.tsx          → Pantalla de login/selección de usuario
  dashboard/
    page.tsx        → Dashboard principal (tabs: Registro, Historial, Gráfica)
  globals.css       → Estilos globales
  layout.tsx        → Root layout con fuentes
components/
  MetricSlider.tsx  → Slider visual por métrica
  ScoreRing.tsx     → Anillo circular con score actual
  EvolutionChart.tsx→ Gráfica de área (Recharts)
  EntryList.tsx     → Lista de historial
lib/
  supabase.ts       → Cliente Supabase + helpers (calcScore, getInsight, CRUD)
supabase_setup.sql  → SQL para crear la tabla
```
