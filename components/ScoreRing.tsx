'use client'
import { getInsight } from '@/lib/supabase'

type Props = { score: number; avg?: number | null }

const CIRC = 2 * Math.PI * 52
const MAX  = 18

export default function ScoreRing({ score, avg }: Props) {
  const ins  = getInsight(avg ?? score)
  const pct  = Math.max(0, Math.min(score / MAX, 1))
  const dash = pct * CIRC

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* Ring */}
      <div style={{ position: 'relative', width: 130, height: 130 }}>
        <svg width="130" height="130" viewBox="0 0 130 130" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="65" cy="65" r="52" fill="none" stroke="#f0e6e0" strokeWidth="8"/>
          <circle
            cx="65" cy="65" r="52" fill="none"
            stroke={ins.color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${dash.toFixed(1)} ${(CIRC - dash).toFixed(1)}`}
            style={{ transition: 'stroke-dasharray 0.7s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: '#2a1f1a', lineHeight: 1 }}>
            {score.toFixed(1)}
          </span>
          <span style={{ fontSize: 10, color: '#a89080', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: 3 }}>
            score
          </span>
        </div>
      </div>

      {/* Insight badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '6px 16px', borderRadius: 99,
        background: ins.bg, border: `0.5px solid ${ins.border}`,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: ins.color }} />
        <span style={{ fontSize: 12, color: ins.color }}>{ins.text}</span>
      </div>

      {avg != null && (
        <p style={{ fontSize: 11, color: '#a89080' }}>
          promedio pareja: <span style={{ color: '#2a1f1a', fontWeight: 400 }}>{avg.toFixed(1)}</span>
        </p>
      )}
    </div>
  )
}
