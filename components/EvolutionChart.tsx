'use client'
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, ReferenceLine,
} from 'recharts'
import type { Entry } from '@/lib/supabase'

type Props = { entries: Entry[]; userId?: string }

function movingAvg(data: number[], w = 7): (number | null)[] {
  return data.map((_, i) => {
    if (i < w - 1) return null
    const s = data.slice(i - w + 1, i + 1)
    return parseFloat((s.reduce((a, b) => a + b, 0) / w).toFixed(2))
  })
}

export default function EvolutionChart({ entries, userId }: Props) {
  const filtered = userId ? entries.filter(e => e.user_id === userId) : entries
  const avgs = movingAvg(filtered.map(e => e.score))
  const chartData = filtered.map((e, i) => ({
    date: e.date.slice(5),
    score: e.score,
    ma7: avgs[i],
  }))

  if (!chartData.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, fontSize: 12, color: '#a89080' }}>
        sin registros aún
      </div>
    )
  }

  const strokeColor = userId === 'Lina' ? '#7878c4' : '#c4785a'

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={strokeColor} stopOpacity={0.2}/>
            <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#c4a090' }} axisLine={false} tickLine={false}/>
        <YAxis domain={[0, 18]} tick={{ fontSize: 9, fill: '#c4a090' }} axisLine={false} tickLine={false}/>
        <Tooltip
          contentStyle={{ background: '#fff', border: '0.5px solid #e0d3c8', borderRadius: 12, fontSize: 11, color: '#2a1f1a' }}
          labelStyle={{ color: '#6b5040' }}
          itemStyle={{ color: strokeColor }}
        />
        <ReferenceLine y={12} stroke="#7ab87050" strokeDasharray="4 4"/>
        <ReferenceLine y={8}  stroke="#c4a05050" strokeDasharray="4 4"/>
        <Area type="monotone" dataKey="score" stroke={strokeColor} strokeWidth={1.5} fill="url(#grad)"
          dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}/>
        <Area type="monotone" dataKey="ma7" stroke="#c4a050" strokeWidth={1} strokeDasharray="4 4"
          fill="none" dot={false} name="Media 7d"/>
      </AreaChart>
    </ResponsiveContainer>
  )
}
