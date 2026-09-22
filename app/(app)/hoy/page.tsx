'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarHeart, Flame, MessageCircle, Pencil, Settings } from 'lucide-react'
import { useApp } from '@/components/AppProvider'
import ScoreRing, { ZoneBadge } from '@/components/ScoreRing'
import { Avatar, Brand } from '@/components/ui'
import { listGratitudes, listTopics } from '@/lib/api'
import { daysUntilAnniversary, greeting, relativeDay, sharedDays, streak, today } from '@/lib/dates'
import { moodEmoji, zoneOf, ZONES } from '@/lib/metrics'
import type { Checkin, Gratitude, Profile } from '@/lib/types'

export default function TodayPage() {
  const { profile, partner, couple, checkins, nameOf } = useApp()
  const me = profile!
  const t = today()
  const [gratitude, setGratitude] = useState<Gratitude | null>(null)
  const [openTopics, setOpenTopics] = useState(0)

  useEffect(() => {
    if (!couple) return
    listGratitudes(couple.id).then((g) => setGratitude(g[0] ?? null)).catch(() => {})
    listTopics(couple.id).then((ts) => setOpenTopics(ts.filter((x) => !x.resolved_at).length)).catch(() => {})
  }, [couple])

  const mine = useMemo(() => checkins.filter((c) => c.user_id === me.id), [checkins, me.id])
  const theirs = useMemo(() => checkins.filter((c) => c.user_id === partner?.id), [checkins, partner?.id])
  const myToday = mine.find((c) => c.date === t) ?? null
  const theirToday = theirs.find((c) => c.date === t) ?? null
  const coupleToday =
    myToday && theirToday ? Math.round(((Number(myToday.score) + Number(theirToday.score)) / 2) * 10) / 10 : null
  const ringScore = coupleToday ?? (myToday ? Number(myToday.score) : null)
  const myStreak = streak(mine.map((c) => c.date))
  const together = sharedDays(mine.map((c) => c.date), theirs.map((c) => c.date))
  const anniversary = couple?.anniversary ? daysUntilAnniversary(couple.anniversary) : null

  return (
    <div className="enter flex flex-col gap-4 px-5 pt-5">
      <header className="flex items-center justify-between">
        <Brand />
        <Link href="/ajustes" aria-label="Ajustes" className="pressable inline-flex size-10 items-center justify-center rounded-full text-muted hover:bg-surface-2">
          <Settings className="size-5" aria-hidden />
        </Link>
      </header>

      <section>
        <p className="eyebrow">{greeting()}</p>
        <h1 className="mt-1 font-serif text-[38px] font-light leading-[1.05]">{me.display_name}</h1>
      </section>

      <section className="card flex flex-col items-center gap-3 px-5 py-6" aria-label="Resumen de hoy">
        <ScoreRing score={ringScore} label={coupleToday != null ? 'pareja hoy' : 'tu día'} />
        {ringScore != null ? (
          <>
            <ZoneBadge score={ringScore} />
            <p className="max-w-[30ch] text-center text-[13px] text-muted">{ZONES[zoneOf(ringScore)].hint}</p>
          </>
        ) : (
          <p className="text-center text-[14px] text-ink-2">Aún no registras cómo fue hoy.</p>
        )}
        <Link
          href="/registro"
          className="pressable mt-1 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[15px] font-medium text-shell"
        >
          {myToday ? <><Pencil className="size-4" aria-hidden /> Editar mi registro</> : <>Registrar mi día <ArrowRight className="size-4" aria-hidden /></>}
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3" aria-label="Estado de cada uno">
        <PersonToday profile={me} checkin={myToday} self />
        {partner ? (
          <PersonToday profile={partner} checkin={theirToday} />
        ) : (
          <Link href="/ajustes" className="card hoverable pressable flex flex-col justify-center gap-1 p-4 text-[13px] text-muted">
            <span className="text-ink">Invita a tu pareja</span>
            Comparte el código <span className="num font-medium tracking-widest text-accent">{couple?.invite_code}</span>
          </Link>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Stat icon={<Flame className="size-4" aria-hidden />} value={myStreak} label={myStreak === 1 ? 'día seguido' : 'días seguidos'} />
        <Stat icon={<CalendarHeart className="size-4" aria-hidden />} value={together} label="días registrados juntos" />
      </section>

      {anniversary && (
        <section className="card flex items-center gap-3 p-4">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
            <CalendarHeart className="size-5" aria-hidden />
          </span>
          <p className="text-[14px] text-ink-2">
            {anniversary.days === 0 ? (
              <>¡Hoy cumplen <strong className="text-ink">{anniversary.years}</strong> {anniversary.years === 1 ? 'año' : 'años'}!</>
            ) : (
              <>Faltan <strong className="num text-ink">{anniversary.days}</strong> días para su aniversario número {anniversary.years}.</>
            )}
          </p>
        </section>
      )}

      <Link href="/nosotros" className="card hoverable pressable flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <p className="eyebrow">Nosotros</p>
          {openTopics > 0 && (
            <span className="inline-flex items-center gap-1 text-[12px] text-accent">
              <MessageCircle className="size-3.5" aria-hidden /> {openTopics} por hablar
            </span>
          )}
        </div>
        {gratitude ? (
          <p className="font-serif text-[19px] leading-snug text-ink">
            “{gratitude.body}”
            <span className="mt-1 block font-sans text-[12px] text-muted">— {nameOf(gratitude.author_id)}</span>
          </p>
        ) : (
          <p className="text-[14px] text-ink-2">Deja un agradecimiento para tu pareja.</p>
        )}
      </Link>

      {mine.length > 0 && (
        <p className="pb-2 text-center text-[12px] text-muted">
          Último registro tuyo: {relativeDay(mine[mine.length - 1].date).toLowerCase()}
        </p>
      )}
    </div>
  )
}

function PersonToday({ profile, checkin, self }: { profile: Profile; checkin: Checkin | null; self?: boolean }) {
  const emoji = moodEmoji(checkin?.mood)
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <Avatar profile={profile} size={28} />
        <span className="truncate text-[13px] text-ink-2">{self ? 'Tú' : profile.display_name}</span>
      </div>
      {checkin ? (
        <div className="flex items-end justify-between">
          <span className="num font-serif text-[30px] leading-none" style={{ color: `var(--z-${zoneOf(Number(checkin.score))})` }}>
            {Number(checkin.score).toFixed(1)}
          </span>
          {emoji && <span className="text-2xl" aria-label={checkin.mood ?? ''}>{emoji}</span>}
        </div>
      ) : (
        <p className="text-[13px] text-muted">{self ? 'Pendiente' : 'Aún no registra'}</p>
      )}
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="card flex flex-col gap-1 p-4">
      <span className="text-accent">{icon}</span>
      <span className="num font-serif text-[30px] leading-none text-ink">{value}</span>
      <span className="text-[12px] text-muted">{label}</span>
    </div>
  )
}
