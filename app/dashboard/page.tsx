'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import MetricSlider    from '@/components/MetricSlider'
import ScoreRing       from '@/components/ScoreRing'
import EvolutionChart  from '@/components/EvolutionChart'
import EntryList       from '@/components/EntryList'
import { calcScore, insertEntry, loadAllEntries, getInsight, type Entry } from '@/lib/supabase'

type Tab = 'registro' | 'historial' | 'grafica'
const TODAY = new Date().toISOString().split('T')[0]

const USER_STYLE: Record<string, { bg: string; color: string }> = {
  Alejandro: { bg: '#f0e6e0', color: '#c4785a' },
  Lina:      { bg: '#e6e8f4', color: '#7878c4' },
}

const card: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e8ddd5',
  borderRadius: 20,
  padding: '18px 18px',
}

const statCard: React.CSSProperties = {
  background: '#fff',
  border: '0.5px solid #e8ddd5',
  borderRadius: 16,
  padding: '14px 15px',
}

export default function DashboardPage() {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [tab, setTab]       = useState<Tab>('registro')

  const [ce,  setCe]  = useState(3)
  const [com, setCom] = useState(3)
  const [con, setCon] = useState(1)
  const [re,  setRe]  = useState(3)
  const [sg,  setSg]  = useState(3)

  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  const liveScore = calcScore(ce, com, con, re, sg)
  const myEntries = entries.filter(e => e.user_id === userId)
  const avgScore  = entries.length ? entries.reduce((s, e) => s + e.score, 0) / entries.length : null

  useEffect(() => {
    const u = localStorage.getItem('aleli_user')
    if (!u) { router.push('/'); return }
    setUserId(u)
  }, [router])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setEntries(await loadAllEntries())
    setLoading(false)
  }, [])

  useEffect(() => { if (userId) fetchData() }, [userId, fetchData])

  const handleSave = async () => {
    if (!userId) return
    setSaving(true)
    await insertEntry({ user_id: userId, date: TODAY, ce, com, con, re, sg, score: liveScore })
    setSaved(true)
    await fetchData()
    setSaving(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const uStyle = USER_STYLE[userId] ?? { bg: '#f0e6e0', color: '#c4785a' }
  const todayEntry = myEntries.find(e => e.date === TODAY)

  // ── Shared label styles
  const sectionLabel: React.CSSProperties = {
    fontSize: 11, color: '#a89080', letterSpacing: '2px',
    textTransform: 'uppercase', marginBottom: 10,
  }

  return (
    <div className="phone-shell">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 22px 0' }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: 'italic', fontWeight: 300, color: '#c4785a' }}>
          Alelí
        </span>
        <button
          onClick={() => { localStorage.removeItem('aleli_user'); router.push('/') }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#fff', border: '0.5px solid #e0d3c8',
            borderRadius: 99, padding: '6px 12px 6px 6px', cursor: 'pointer',
          }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: uStyle.bg, color: uStyle.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Cormorant Garamond', serif", fontSize: 13,
          }}>
            {userId[0]}
          </div>
          <span style={{ fontSize: 12, color: '#6b5040' }}>{userId}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#c4a090" strokeWidth="1.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>

      {/* Score ring */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '22px 22px 16px' }}>
        <ScoreRing score={liveScore} avg={avgScore} />
        {todayEntry && (
          <p style={{ marginTop: 8, fontSize: 11, color: '#a89080' }}>
            ya registraste hoy · {todayEntry.score.toFixed(1)}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', margin: '0 18px', background: '#f0eae4', borderRadius: 14, padding: 3, gap: 2 }}>
        {(['registro', 'historial', 'grafica'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, textAlign: 'center', padding: '8px 0',
              fontSize: 12, borderRadius: 11, cursor: 'pointer', border: 'none',
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? '#2a1f1a' : '#a89080',
              boxShadow: tab === t ? '0 0 0 0.5px #e0d3c8' : 'none',
              transition: 'all 0.2s',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 300,
            }}
          >
            {t === 'registro' ? 'Registro' : t === 'historial' ? 'Historial' : 'Gráfica'}
          </button>
        ))}
      </div>

      {/* ── TAB REGISTRO ── */}
      {tab === 'registro' && (
        <div className="fade-up" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <MetricSlider label="Conexión emocional" code="CE"  value={ce}  onChange={setCe}  description="¿Cuán conectados se sintieron?" />
            <MetricSlider label="Comunicación"        code="COM" value={com} onChange={setCom} description="¿Pudieron hablar con claridad?" />
            <MetricSlider label="Conflicto"           code="CON" value={con} onChange={setCon} inverted description="Nivel de tensión o discusión" />
            <MetricSlider label="Regulación emocional" code="RE" value={re}  onChange={setRe}  description="¿Gestionaron bien las emociones?" />
            <MetricSlider label="Satisfacción general" code="SG" value={sg}  onChange={setSg}  description="¿Cómo se sienten con la relación?" />
          </div>

          {/* Live score card */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 12, color: '#a89080' }}>score de hoy</div>
              <div style={{ fontSize: 10, color: '#c4a090', marginTop: 2 }}>(CE+COM+RE+SG) − CON×1.5</div>
            </div>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 300, color: '#c4785a' }}>
              {liveScore.toFixed(1)}
            </span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '15px', borderRadius: 18, border: 'none',
              background: saved ? '#7ab870' : '#2a1f1a',
              color: '#fdfaf7', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif", fontWeight: 300,
              fontSize: 12, letterSpacing: '2px', textTransform: 'uppercase',
              transition: 'background 0.3s, transform 0.1s',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar registro'}
          </button>

          <p style={{ textAlign: 'center', fontSize: 10, color: '#c4a090', letterSpacing: 1 }}>
            {new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      )}

      {/* ── TAB HISTORIAL ── */}
      {tab === 'historial' && (
        <div className="fade-up" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 12, color: '#a89080' }}>últimos registros</p>
            {loading && <span style={{ fontSize: 11, color: '#c4a090' }}>cargando…</span>}
          </div>
          <EntryList entries={entries} currentUser={userId} />
        </div>
      )}

      {/* ── TAB GRÁFICA ── */}
      {tab === 'grafica' && (
        <div className="fade-up" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* My chart */}
          <div>
            <p style={sectionLabel}>mi evolución</p>
            <div style={card}>
              <p style={{ fontSize: 10, color: '#c4a090', marginBottom: 8 }}>línea dorada = media 7 días</p>
              <EvolutionChart entries={entries} userId={userId} />
            </div>
          </div>

          {/* Couple chart */}
          <div>
            <p style={sectionLabel}>vista pareja</p>
            <div style={card}>
              <EvolutionChart entries={entries} />
            </div>
          </div>

          {/* Zones */}
          <div style={{ ...statCard, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ ...sectionLabel, marginBottom: 6 }}>zonas</p>
            {[
              { color: '#7ab870', range: '≥ 12', label: 'relación estable' },
              { color: '#c4a050', range: '8–12', label: 'fricción moderada' },
              { color: '#c46060', range: '< 8',  label: 'alta tensión' },
            ].map(z => (
              <div key={z.range} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                <div style={{ width: 18, height: 0.5, background: z.color, flexShrink: 0 }} />
                <span style={{ color: z.color, minWidth: 36 }}>{z.range}</span>
                <span style={{ color: '#a89080' }}>— {z.label}</span>
              </div>
            ))}
          </div>

          {/* Stats grid */}
          {myEntries.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'mi promedio',   value: (myEntries.reduce((s,e)=>s+e.score,0)/myEntries.length).toFixed(1) },
                { label: 'mi mejor día',  value: Math.max(...myEntries.map(e=>e.score)).toFixed(1) },
                { label: 'mis registros', value: myEntries.length },
                { label: 'total pareja',  value: entries.length },
              ].map(s => (
                <div key={s.label} style={statCard}>
                  <div style={{ fontSize: 10, color: '#a89080', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: '#2a1f1a', marginTop: 2 }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
