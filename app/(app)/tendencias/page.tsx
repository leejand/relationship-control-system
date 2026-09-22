'use client'
import { useMemo, useState } from 'react'
import { LineChart, Lightbulb } from 'lucide-react'
import { useApp } from '@/components/AppProvider'
import { DimensionBars, EvolutionChart } from '@/components/Charts'
import { EmptyState, ScreenHeader, Segmented } from '@/components/ui'
import { addDays, parseISODate, today } from '@/lib/dates'
import { averages, strongestAndWeakest, zoneOf, ZONES, type Values } from '@/lib/metrics'
import type { Checkin } from '@/lib/types'

type Range = '7' | '30' | '90' | 'todo'

const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

function mean(list: Checkin[]): number | null {
  return list.length ? list.reduce((s, c) => s + Number(c.score), 0) / list.length : null
}

export default function TrendsPage() {
  const { profile, partner, checkins } = useApp()
  const me = profile!
  const [range, setRange] = useState<Range>('30')

  const data = useMemo(() => {
    const since = range === 'todo' ? null : addDays(today(), -Number(range) + 1)
    const inRange = since ? checkins.filter((c) => c.date >= since) : checkins
    const prevStart = since ? addDays(since, -Number(range)) : null
    const previous = since && prevStart ? checkins.filter((c) => c.date >= prevStart && c.date < since) : []
    const mine = inRange.filter((c) => c.user_id === me.id)
    const theirs = inRange.filter((c) => c.user_id === partner?.id)
    const toValues = (l: Checkin[]): Values[] => l.map(({ ce, com, con, re, sg }) => ({ ce, com, con, re, sg }))
    const coupleAvg = averages(toValues(inRange))

    // Día de la semana con mejor promedio (necesita algo de historia).
    const byDow = new Map<number, number[]>()
    for (const c of inRange) {
      const dow = (parseISODate(c.date).getDay() + 6) % 7
      byDow.set(dow, [...(byDow.get(dow) ?? []), Number(c.score)])
    }
    const dowRanked = [...byDow.entries()]
      .filter(([, v]) => v.length >= 2)
      .map(([d, v]) => ({ d, avg: v.reduce((a, b) => a + b, 0) / v.length }))
      .sort((a, b) => b.avg - a.avg)

    return {
      inRange,
      current: mean(inRange),
      previous: mean(previous),
      mine: averages(toValues(mine)),
      theirs: averages(toValues(theirs)),
      coupleAvg,
      bestDay: dowRanked[0] ?? null,
      worstDay: dowRanked.length > 1 ? dowRanked[dowRanked.length - 1] : null,
    }
  }, [checkins, range, me.id, partner?.id])

  const insights: string[] = []
  if (data.coupleAvg) {
    const { strongest, weakest } = strongestAndWeakest(data.coupleAvg)
    insights.push(`Su punto más fuerte es la ${strongest.label.toLowerCase()}.`)
    if (weakest.key !== strongest.key) {
      insights.push(
        weakest.inverted
          ? 'El conflicto es lo que más les pesa: acordar una pausa antes de discutir suele ayudar.'
          : `Lo que más pueden cuidar es la ${weakest.label.toLowerCase()}.`,
      )
    }
  }
  if (data.current != null && data.previous != null) {
    const diff = data.current - data.previous
    if (Math.abs(diff) >= 0.5) insights.push(`Van ${diff > 0 ? 'mejor' : 'peor'} que el periodo anterior (${diff > 0 ? '+' : ''}${diff.toFixed(1)}).`)
    else insights.push('Se mantienen estables respecto al periodo anterior.')
  }
  if (data.bestDay && data.worstDay && data.bestDay.avg - data.worstDay.avg >= 1) {
    insights.push(`Los ${WEEKDAYS[data.bestDay.d]} suelen ser su mejor día; los ${WEEKDAYS[data.worstDay.d]}, el más difícil.`)
  }

  return (
    <div className="flex flex-col">
      <ScreenHeader eyebrow="Cómo van" title="Tendencias" />
      <div className="px-5 pb-4">
        <Segmented
          label="Periodo"
          value={range}
          onChange={setRange}
          options={[
            { value: '7', label: '7 días' },
            { value: '30', label: '30 días' },
            { value: '90', label: '90 días' },
            { value: 'todo', label: 'Todo' },
          ]}
        />
      </div>

      {data.inRange.length === 0 ? (
        <EmptyState icon={<LineChart className="size-5" />} title="Sin datos en este periodo">
          Registren algunos días para ver sus tendencias.
        </EmptyState>
      ) : (
        <div className="enter flex flex-col gap-4 px-5">
          <section className="card p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <p className="eyebrow">Promedio</p>
              {data.current != null && (
                <span className="num font-serif text-[28px] leading-none" style={{ color: `var(--z-${zoneOf(data.current)})` }}>
                  {data.current.toFixed(1)}
                </span>
              )}
            </div>
            {data.current != null && <p className="mb-3 text-[13px] text-muted">{ZONES[zoneOf(data.current)].label}</p>}
            <EvolutionChart checkins={data.inRange} me={me} partner={partner} />
            <Legend />
          </section>

          {insights.length > 0 && (
            <section className="card flex flex-col gap-2.5 p-5">
              <p className="eyebrow flex items-center gap-1.5"><Lightbulb className="size-3.5" aria-hidden /> Lo que dicen sus datos</p>
              <ul className="flex flex-col gap-2">
                {insights.map((i) => (
                  <li key={i} className="text-[14.5px] leading-relaxed text-ink-2">{i}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="card p-5">
            <p className="eyebrow mb-4">Por dimensión</p>
            <DimensionBars mine={data.mine} theirs={data.theirs} me={me} partner={partner} />
          </section>
        </div>
      )}
    </div>
  )

  function Legend() {
    return (
      <div className="mt-2 flex gap-4 text-[12px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full" style={{ background: `var(--c-${me.color})` }} /> {me.display_name}
        </span>
        {partner && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: `var(--c-${partner.color})` }} /> {partner.display_name}
          </span>
        )}
      </div>
    )
  }
}
