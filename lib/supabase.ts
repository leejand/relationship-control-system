import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Entry = {
  id?: number
  user_id: string
  date: string
  ce: number
  com: number
  con: number
  re: number
  sg: number
  score: number
}

export function calcScore(ce: number, com: number, con: number, re: number, sg: number): number {
  return parseFloat(((ce + com + re + sg) - con * 1.5).toFixed(1))
}

export function getInsight(s: number): { text: string; color: string; bg: string; border: string } {
  if (s >= 12) return { text: 'Relación estable',    color: '#7ab870', bg: '#f0f7ee', border: '#b8d8b0' }
  if (s >= 8)  return { text: 'Fricción moderada',   color: '#c4a050', bg: '#fdf6e8', border: '#e0cc90' }
  return              { text: 'Alta tensión',         color: '#c46060', bg: '#fdf0f0', border: '#e0b0b0' }
}

export async function insertEntry(entry: Omit<Entry, 'id'>): Promise<Entry | null> {
  const { data, error } = await supabase
    .from('relationship_data')
    .insert([entry])
    .select()
    .single()
  if (error) { console.error(error); return null }
  return data
}

export async function loadAllEntries(): Promise<Entry[]> {
  const { data, error } = await supabase
    .from('relationship_data')
    .select('*')
    .order('date', { ascending: true })
  if (error) { console.error(error); return [] }
  return data || []
}
