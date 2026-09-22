'use client'
import { scoreProgress, zoneOf, ZONES } from '@/lib/metrics'

const R = 54
const C = 2 * Math.PI * R

/** Anillo con el score; el color sigue la zona (estable / fricción / tensión). */
export default function ScoreRing({
  score,
  label = 'score',
  size = 148,
}: {
  score: number | null
  label?: string
  size?: number
}) {
  const zone = score == null ? null : zoneOf(score)
  const color = zone ? `var(--z-${zone})` : 'var(--line-strong)'
  const offset = C * (1 - (score == null ? 0 : scoreProgress(score)))

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 128 128" width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx="64" cy="64" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="9" />
        <circle
          className="ring-progress"
          cx="64"
          cy="64"
          r={R}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num font-serif text-[40px] font-light leading-none text-ink">
          {score == null ? '—' : score.toFixed(1)}
        </span>
        <span className="eyebrow mt-1 !text-[10px]">{label}</span>
      </div>
      <span className="sr-only">{score == null ? 'Sin registro' : `${score.toFixed(1)}, ${ZONES[zone!].label}`}</span>
    </div>
  )
}

export function ZoneBadge({ score }: { score: number }) {
  const zone = zoneOf(score)
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px]"
      style={{ background: `var(--z-${zone}-soft)`, color: `var(--z-${zone})` }}
    >
      <span className="size-1.5 rounded-full" style={{ background: `var(--z-${zone})` }} />
      {ZONES[zone].label}
    </span>
  )
}
