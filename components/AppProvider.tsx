'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getCouple, getPartner, getProfile, listCheckins } from '@/lib/api'
import type { Checkin, Couple, Profile } from '@/lib/types'

type Status = 'loading' | 'signed-out' | 'no-couple' | 'ready'

type AppState = {
  status: Status
  user: User | null
  profile: Profile | null
  partner: Profile | null
  couple: Couple | null
  checkins: Checkin[]
  /** Vuelve a leer perfil, pareja y registros. */
  refresh: () => Promise<void>
  /** Inserta o reemplaza un registro localmente sin esperar a la red. */
  upsertLocal: (c: Checkin) => void
  nameOf: (userId: string) => string
}

const Ctx = createContext<AppState | null>(null)

export function useApp(): AppState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return v
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [partner, setPartner] = useState<Profile | null>(null)
  const [couple, setCouple] = useState<Couple | null>(null)
  const [checkins, setCheckins] = useState<Checkin[]>([])

  const load = useCallback(async (u: User | null) => {
    setUser(u)
    if (!u) {
      setProfile(null); setPartner(null); setCouple(null); setCheckins([])
      setStatus('signed-out')
      return
    }
    try {
      const p = await getProfile(u.id)
      setProfile(p)
      if (!p?.couple_id) {
        setStatus('no-couple')
        return
      }
      const [c, partnerProfile, list] = await Promise.all([
        getCouple(),
        getPartner(p.couple_id, u.id),
        listCheckins(p.couple_id),
      ])
      setCouple(c)
      setPartner(partnerProfile)
      setCheckins(list)
      setStatus('ready')
    } catch {
      setStatus('signed-out')
    }
  }, [])

  useEffect(() => {
    const sb = supabase()
    sb.auth.getSession().then(({ data }) => load(data.session?.user ?? null))
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') load(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [load])

  /** Cuando la pareja registra algo, aparece sin recargar. */
  useEffect(() => {
    if (!profile?.couple_id) return
    const sb = supabase()
    const channel = sb
      .channel(`checkins:${profile.couple_id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'checkins', filter: `couple_id=eq.${profile.couple_id}` },
        () => listCheckins(profile.couple_id!).then(setCheckins).catch(() => {}),
      )
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [profile?.couple_id])

  const refresh = useCallback(async () => {
    const { data } = await supabase().auth.getUser()
    await load(data.user)
  }, [load])

  const upsertLocal = useCallback((c: Checkin) => {
    setCheckins((prev) => {
      const rest = prev.filter((x) => !(x.user_id === c.user_id && x.date === c.date))
      return [...rest, c].sort((a, b) => a.date.localeCompare(b.date))
    })
  }, [])

  const nameOf = useCallback(
    (id: string) => (id === profile?.id ? profile.display_name : id === partner?.id ? partner.display_name : '—'),
    [profile, partner],
  )

  const value = useMemo(
    () => ({ status, user, profile, partner, couple, checkins, refresh, upsertLocal, nameOf }),
    [status, user, profile, partner, couple, checkins, refresh, upsertLocal, nameOf],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
