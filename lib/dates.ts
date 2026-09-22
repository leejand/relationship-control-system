/** Fechas en formato YYYY-MM-DD, siempre en hora local (no UTC). */

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function today(): string {
  return toISODate(new Date())
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: string, n: number): string {
  const d = parseISODate(s)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/**
 * Días seguidos con registro terminando hoy (o ayer, si hoy aún no hay:
 * la racha no se rompe hasta que termina el día).
 */
export function streak(dates: string[], ref = today()): number {
  const set = new Set(dates)
  let cursor = set.has(ref) ? ref : addDays(ref, -1)
  let n = 0
  while (set.has(cursor)) {
    n++
    cursor = addDays(cursor, -1)
  }
  return n
}

/** Días en que los dos registraron (fecha en común). */
export function sharedDays(a: string[], b: string[]): number {
  const set = new Set(a)
  return new Set(b.filter((d) => set.has(d))).size
}

/** Lunes de la semana de una fecha, para agrupar el historial. */
export function weekStart(s: string): string {
  const d = parseISODate(s)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return toISODate(d)
}

const fmtLong = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
const fmtShort = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })
const fmtWeekday = new Intl.DateTimeFormat('es-CO', { weekday: 'short' })

export const formatLong = (s: string) => fmtLong.format(parseISODate(s))
export const formatShort = (s: string) => fmtShort.format(parseISODate(s)).replace('.', '')
export const formatWeekday = (s: string) => fmtWeekday.format(parseISODate(s)).replace('.', '')

export function relativeDay(s: string, ref = today()): string {
  if (s === ref) return 'Hoy'
  if (s === addDays(ref, -1)) return 'Ayer'
  return formatLong(s)
}

/** Días que faltan para el próximo aniversario (0 = hoy). */
export function daysUntilAnniversary(anniversary: string, ref = today()): { days: number; years: number } {
  const a = parseISODate(anniversary)
  const r = parseISODate(ref)
  let next = new Date(r.getFullYear(), a.getMonth(), a.getDate())
  if (next < r) next = new Date(r.getFullYear() + 1, a.getMonth(), a.getDate())
  const days = Math.round((next.getTime() - r.getTime()) / 86_400_000)
  return { days, years: next.getFullYear() - a.getFullYear() }
}

export function greeting(d = new Date()): string {
  const h = d.getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}
