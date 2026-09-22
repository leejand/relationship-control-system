import { supabase } from './supabase'
import type { Checkin, Couple, Gratitude, Profile, Topic } from './types'
import type { Mood, Values } from './metrics'

/** Lanza el error de Supabase para que la UI lo muestre con humanError. */
function check<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error
  return res.data as T
}

// ── Sesión y perfil ─────────────────────────────────────────────────
export async function signIn(email: string, password: string) {
  const { error } = await supabase().auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUp(email: string, password: string, displayName: string) {
  const { data, error } = await supabase().auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
    },
  })
  if (error) throw error
  /** Sin sesión = el proyecto exige confirmar el correo. */
  return { needsConfirmation: !data.session }
}

export async function signOut() {
  await supabase().auth.signOut()
}

export async function getProfile(id: string): Promise<Profile | null> {
  return check(await supabase().from('profiles').select('id, display_name, color, couple_id').eq('id', id).maybeSingle())
}

export async function updateProfile(id: string, patch: Partial<Pick<Profile, 'display_name' | 'color'>>) {
  check(await supabase().from('profiles').update(patch).eq('id', id))
}

// ── Pareja ──────────────────────────────────────────────────────────
export async function getCouple(): Promise<Couple | null> {
  return check(await supabase().from('couples').select('id, name, anniversary, invite_code').maybeSingle())
}

export async function getPartner(coupleId: string, me: string): Promise<Profile | null> {
  return check(
    await supabase().from('profiles').select('id, display_name, color, couple_id').eq('couple_id', coupleId).neq('id', me).maybeSingle(),
  )
}

export async function createCouple(name?: string): Promise<Couple> {
  return check(await supabase().rpc('create_couple', { p_name: name ?? null }))
}

export async function joinCouple(code: string): Promise<Couple> {
  return check(await supabase().rpc('join_couple', { p_code: code }))
}

export async function leaveCouple() {
  check(await supabase().rpc('leave_couple'))
}

export async function updateCouple(id: string, patch: Partial<Pick<Couple, 'name' | 'anniversary'>>) {
  check(await supabase().from('couples').update(patch).eq('id', id))
}

export async function claimLegacy(name: string): Promise<number> {
  return check(await supabase().rpc('claim_legacy', { p_name: name }))
}

// ── Registros diarios ───────────────────────────────────────────────
export async function listCheckins(coupleId: string, sinceDate?: string): Promise<Checkin[]> {
  let q = supabase().from('checkins').select('*').eq('couple_id', coupleId).order('date', { ascending: true })
  if (sinceDate) q = q.gte('date', sinceDate)
  return check(await q)
}

export async function saveCheckin(input: {
  coupleId: string
  userId: string
  date: string
  values: Values
  mood: Mood | null
  note: string
}): Promise<Checkin> {
  const row = {
    couple_id: input.coupleId,
    user_id: input.userId,
    date: input.date,
    ...input.values,
    mood: input.mood,
    note: input.note.trim() || null,
  }
  /** Un registro por persona y día: guardar de nuevo lo actualiza. */
  return check(await supabase().from('checkins').upsert(row, { onConflict: 'user_id,date' }).select().single())
}

export async function deleteCheckin(id: number) {
  check(await supabase().from('checkins').delete().eq('id', id))
}

// ── Nosotros: agradecimientos y temas pendientes ────────────────────
export async function listGratitudes(coupleId: string): Promise<Gratitude[]> {
  return check(
    await supabase().from('gratitudes').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }).limit(60),
  )
}

export async function addGratitude(coupleId: string, authorId: string, body: string): Promise<Gratitude> {
  return check(
    await supabase().from('gratitudes').insert({ couple_id: coupleId, author_id: authorId, body: body.trim() }).select().single(),
  )
}

export async function deleteGratitude(id: number) {
  check(await supabase().from('gratitudes').delete().eq('id', id))
}

export async function listTopics(coupleId: string): Promise<Topic[]> {
  return check(await supabase().from('topics').select('*').eq('couple_id', coupleId).order('created_at', { ascending: false }))
}

export async function addTopic(coupleId: string, authorId: string, title: string): Promise<Topic> {
  return check(
    await supabase().from('topics').insert({ couple_id: coupleId, author_id: authorId, title: title.trim() }).select().single(),
  )
}

export async function setTopicResolved(id: number, resolved: boolean) {
  check(await supabase().from('topics').update({ resolved_at: resolved ? new Date().toISOString() : null }).eq('id', id))
}

export async function deleteTopic(id: number) {
  check(await supabase().from('topics').delete().eq('id', id))
}
