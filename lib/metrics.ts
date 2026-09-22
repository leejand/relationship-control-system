/**
 * Las cinco dimensiones del registro diario y cómo se convierten en un score.
 * Todo lo que es cálculo puro vive aquí para poder testearlo sin Supabase.
 */

export type MetricKey = 'ce' | 'com' | 'con' | 're' | 'sg'

export type Metric = {
  key: MetricKey
  label: string
  short: string
  question: string
  /** Conflicto resta: más alto es peor. */
  inverted?: boolean
  /** Texto para los extremos del slider. */
  low: string
  high: string
}

export const METRICS: Metric[] = [
  { key: 'ce', label: 'Conexión', short: 'CE', question: '¿Qué tan conectados se sintieron hoy?', low: 'Lejanos', high: 'Muy unidos' },
  { key: 'com', label: 'Comunicación', short: 'COM', question: '¿Pudieron hablar con claridad?', low: 'Nos costó', high: 'Fluida' },
  { key: 'con', label: 'Conflicto', short: 'CON', question: '¿Cuánta tensión o discusión hubo?', inverted: true, low: 'Nada', high: 'Mucha' },
  { key: 're', label: 'Regulación', short: 'RE', question: '¿Gestionaste bien tus emociones?', low: 'Me desbordé', high: 'Con calma' },
  { key: 'sg', label: 'Satisfacción', short: 'SG', question: '¿Cómo te sientes con la relación hoy?', low: 'Insatisfecho', high: 'Pleno' },
]

export type Values = Record<MetricKey, number>

export const DEFAULT_VALUES: Values = { ce: 3, com: 3, con: 1, re: 3, sg: 3 }

/** Rango posible: de −7.5 (todo en 0 y conflicto 5) a 20 (todo en 5, conflicto 0). */
export const SCORE_MIN = -7.5
export const SCORE_MAX = 20

export function calcScore(v: Values): number {
  return Math.round(((v.ce + v.com + v.re + v.sg) - v.con * 1.5) * 10) / 10
}

export type Zone = 'estable' | 'friccion' | 'tension'

export function zoneOf(score: number): Zone {
  if (score >= 12) return 'estable'
  if (score >= 8) return 'friccion'
  return 'tension'
}

export const ZONES: Record<Zone, { label: string; hint: string }> = {
  estable: { label: 'Relación estable', hint: 'Buen momento para agradecer lo que funciona.' },
  friccion: { label: 'Fricción moderada', hint: 'Vale la pena conversar con calma sobre lo que pesa.' },
  tension: { label: 'Alta tensión', hint: 'Prioricen escucharse antes que resolver.' },
}

/** Porcentaje 0–1 del score dentro del rango posible (para anillos y barras). */
export function scoreProgress(score: number): number {
  return Math.min(1, Math.max(0, (score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)))
}

export type Mood = 'radiante' | 'bien' | 'neutral' | 'cansado' | 'triste' | 'molesto'

export const MOODS: { key: Mood; emoji: string; label: string }[] = [
  { key: 'radiante', emoji: '😍', label: 'Radiante' },
  { key: 'bien', emoji: '🙂', label: 'Bien' },
  { key: 'neutral', emoji: '😐', label: 'Neutral' },
  { key: 'cansado', emoji: '😮‍💨', label: 'Cansado' },
  { key: 'triste', emoji: '😔', label: 'Triste' },
  { key: 'molesto', emoji: '😤', label: 'Molesto' },
]

export function moodEmoji(m: Mood | null | undefined): string | null {
  return MOODS.find((x) => x.key === m)?.emoji ?? null
}

/** Promedio de cada dimensión; con conflicto se reporta tal cual (más bajo = mejor). */
export function averages(entries: Values[]): Values | null {
  if (!entries.length) return null
  const sum = { ce: 0, com: 0, con: 0, re: 0, sg: 0 }
  for (const e of entries) for (const m of METRICS) sum[m.key] += e[m.key]
  const out = {} as Values
  for (const m of METRICS) out[m.key] = Math.round((sum[m.key] / entries.length) * 10) / 10
  return out
}

/** Normaliza una dimensión a "salud" 0–5 (invierte conflicto) para compararlas. */
export function health(key: MetricKey, value: number): number {
  return METRICS.find((m) => m.key === key)?.inverted ? 5 - value : value
}

/** La dimensión más débil y la más fuerte según el promedio. */
export function strongestAndWeakest(avg: Values): { strongest: Metric; weakest: Metric } {
  const ranked = [...METRICS].sort((a, b) => health(b.key, avg[b.key]) - health(a.key, avg[a.key]))
  return { strongest: ranked[0], weakest: ranked[ranked.length - 1] }
}
