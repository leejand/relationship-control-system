'use client'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatShort } from '@/lib/dates'
import { health, METRICS, type Values } from '@/lib/metrics'
import { PROFILE_COLORS, type Checkin, type Profile } from '@/lib/types'

type Point = { date: string; label: string; me?: number; partner?: number }

/** Evolución del score: una línea por persona, alineadas por fecha. */
export function EvolutionChart({
  checkins,
  me,
  partner,
}: {
  checkins: Checkin[]
  me: Profile
  partner: Profile | null
}) {
  const byDate = new Map<string, Point>()
  for (const c of checkins) {
    const p = byDate.get(c.date) ?? { date: c.date, label: formatShort(c.date) }
    if (c.user_id === me.id) p.me = Number(c.score)
    else p.partner = Number(c.score)
    byDate.set(c.date, p)
  }
  const data = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
  const meColor = PROFILE_COLORS[me.color].ink
  const partnerColor = partner ? PROFILE_COLORS[partner.color].ink : 'var(--muted)'

  return (
    <div className="h-52 w-full" role="img" aria-label="Evolución del score en el tiempo">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="g-me" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={meColor} stopOpacity={0.22} />
              <stop offset="100%" stopColor={meColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="3 5" />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis domain={[-8, 20]} ticks={[0, 8, 12, 20]} tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
          <ReferenceLine y={12} stroke="var(--z-estable)" strokeOpacity={0.35} strokeDasharray="4 4" />
          <ReferenceLine y={8} stroke="var(--z-friccion)" strokeOpacity={0.35} strokeDasharray="4 4" />
          <Tooltip
            cursor={{ stroke: 'var(--line-strong)' }}
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, fontSize: 12 }}
            labelStyle={{ color: 'var(--muted)' }}
            formatter={(v, name) => [Number(v).toFixed(1), name === 'me' ? me.display_name : partner?.display_name ?? 'Pareja']}
          />
          <Area type="monotone" dataKey="me" stroke={meColor} strokeWidth={2} fill="url(#g-me)" connectNulls dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          {partner && (
            <Area type="monotone" dataKey="partner" stroke={partnerColor} strokeWidth={2} fill="none" connectNulls dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Barras por dimensión, tú vs tu pareja, en escala de "salud" 0–5. */
export function DimensionBars({
  mine,
  theirs,
  me,
  partner,
}: {
  mine: Values | null
  theirs: Values | null
  me: Profile
  partner: Profile | null
}) {
  return (
    <ul className="flex flex-col gap-4">
      {METRICS.map((m) => (
        <li key={m.key}>
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[14px] text-ink">{m.label}</span>
            <span className="num text-[12px] text-muted">
              {mine ? mine[m.key].toFixed(1) : '—'}
              {partner && <> · {theirs ? theirs[m.key].toFixed(1) : '—'}</>}
            </span>
          </div>
          <Bar value={mine ? health(m.key, mine[m.key]) : 0} color={PROFILE_COLORS[me.color].ink} />
          {partner && <Bar value={theirs ? health(m.key, theirs[m.key]) : 0} color={PROFILE_COLORS[partner.color].ink} />}
        </li>
      ))}
      <li className="text-[11px] text-muted">Conflicto se muestra invertido: barra larga = menos conflicto.</li>
    </ul>
  )
}

function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="mb-1 h-2 overflow-hidden rounded-full bg-surface-2">
      <div
        className="h-full origin-left rounded-full"
        style={{ background: color, transform: `scaleX(${value / 5})`, transition: 'transform 600ms var(--ease-out)' }}
      />
    </div>
  )
}
