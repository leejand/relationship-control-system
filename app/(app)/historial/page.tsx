'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays } from 'lucide-react'
import { useApp } from '@/components/AppProvider'
import CheckinCard from '@/components/CheckinCard'
import { EmptyState, ScreenHeader, Segmented } from '@/components/ui'
import { addDays, formatShort, weekStart } from '@/lib/dates'
import { zoneOf } from '@/lib/metrics'
import type { Checkin } from '@/lib/types'

type Filter = 'todos' | 'yo' | 'pareja'

export default function HistoryPage() {
  const { profile, partner, checkins } = useApp()
  const [filter, setFilter] = useState<Filter>('todos')

  const weeks = useMemo(() => {
    const list = checkins
      .filter((c) => (filter === 'yo' ? c.user_id === profile!.id : filter === 'pareja' ? c.user_id === partner?.id : true))
      .sort((a, b) => b.date.localeCompare(a.date) || a.user_id.localeCompare(b.user_id))
    const groups = new Map<string, Checkin[]>()
    for (const c of list) {
      const w = weekStart(c.date)
      groups.set(w, [...(groups.get(w) ?? []), c])
    }
    return [...groups.entries()]
  }, [checkins, filter, profile, partner])

  return (
    <div className="flex flex-col">
      <ScreenHeader eyebrow={`${checkins.length} registros`} title="Historial" />
      <div className="px-5 pb-4">
        <Segmented
          label="Filtrar"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'todos', label: 'Los dos' },
            { value: 'yo', label: 'Yo' },
            ...(partner ? [{ value: 'pareja' as const, label: partner.display_name }] : []),
          ]}
        />
      </div>

      {weeks.length === 0 ? (
        <EmptyState icon={<CalendarDays className="size-5" />} title="Todavía no hay registros">
          <Link href="/registro" className="text-accent underline underline-offset-4">Haz el primero</Link>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-6 px-5">
          {weeks.map(([week, items]) => {
            const avg = items.reduce((s, c) => s + Number(c.score), 0) / items.length
            return (
              <section key={week} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between px-1">
                  <h2 className="eyebrow">Semana del {formatShort(week)} al {formatShort(addDays(week, 6))}</h2>
                  <span className="num text-[12px]" style={{ color: `var(--z-${zoneOf(avg)})` }}>prom. {avg.toFixed(1)}</span>
                </div>
                {items.map((c) => (
                  <CheckinCard key={c.id} checkin={c} author={c.user_id === profile!.id ? profile : partner} />
                ))}
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
