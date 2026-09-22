import type { Mood } from './metrics'

export type ProfileColor = 'terracota' | 'lila' | 'salvia' | 'miel'

export type Profile = {
  id: string
  display_name: string
  color: ProfileColor
  couple_id: string | null
}

export type Couple = {
  id: string
  name: string | null
  anniversary: string | null
  invite_code: string
}

export type Checkin = {
  id: number
  couple_id: string
  user_id: string
  date: string
  ce: number
  com: number
  con: number
  re: number
  sg: number
  score: number
  mood: Mood | null
  note: string | null
  created_at: string
  updated_at: string
}

export type Gratitude = {
  id: number
  couple_id: string
  author_id: string
  body: string
  created_at: string
}

export type Topic = {
  id: number
  couple_id: string
  author_id: string
  title: string
  resolved_at: string | null
  created_at: string
}

export const PROFILE_COLORS: Record<ProfileColor, { label: string; ink: string; soft: string }> = {
  terracota: { label: 'Terracota', ink: 'var(--c-terracota)', soft: 'var(--c-terracota-soft)' },
  lila: { label: 'Lila', ink: 'var(--c-lila)', soft: 'var(--c-lila-soft)' },
  salvia: { label: 'Salvia', ink: 'var(--c-salvia)', soft: 'var(--c-salvia-soft)' },
  miel: { label: 'Miel', ink: 'var(--c-miel)', soft: 'var(--c-miel-soft)' },
}
