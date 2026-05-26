'use client'
import type { Entry } from '@/lib/supabase'
import { getInsight } from '@/lib/supabase'

type Props = { entries: Entry[]; currentUser?: string }

export default function EntryList({ entries, currentUser }: Props) {
  if (!entries.length) {
    return (
      <p style={{ textAlign: 'center', color: '#a89080', fontSize: 13, padding: '24px 0' }}>
        aún no hay registros
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[...entries].reverse().slice(0, 15).map(e => {
        const ins = getInsight(e.score)
        const isMe = e.user_id === currentUser
        return (
          <div
            key={e.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#fff', border: '0.5px solid #e8ddd5',
              borderRadius: 16, padding: '13px 15px',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: ins.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#6b5040' }}>{e.date.slice(5)}</span>
                <span style={{
                  fontSize: 10, color: isMe ? '#c4785a' : '#7878c4',
                  background: isMe ? '#f0e6e0' : '#e6e8f4',
                  padding: '2px 8px', borderRadius: 99,
                }}>
                  {e.user_id}
                </span>
              </div>
              <div style={{ fontSize: 10, color: '#c4a090', marginTop: 3 }}>
                CE:{e.ce} · COM:{e.com} · CON:{e.con} · RE:{e.re} · SG:{e.sg}
              </div>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, color: ins.color }}>
              {e.score.toFixed(1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
