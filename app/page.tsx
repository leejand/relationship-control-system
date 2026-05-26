'use client'
import { useRouter } from 'next/navigation'

const USERS = [
  { id: 'Alejandro', initial: 'A', avatarBg: '#f0e6e0', avatarColor: '#c4785a' },
  { id: 'Lina',      initial: 'L', avatarBg: '#e6e8f4', avatarColor: '#7878c4' },
]

export default function LoginPage() {
  const router = useRouter()

  const enter = (userId: string) => {
    localStorage.setItem('aleli_user', userId)
    router.push('/dashboard')
  }

  return (
    <div className="phone-shell">
      <div className="flex flex-col items-center justify-center flex-1 px-8 py-16 gap-12">

        {/* Logo */}
        <div className="flex flex-col items-center gap-1 fade-up">
          <span
            className="font-serif"
            style={{ fontSize: 60, fontStyle: 'italic', fontWeight: 300, color: '#c4785a', lineHeight: 1 }}
          >
            Alelí
          </span>
          <span style={{ fontSize: 12, color: '#a89080', letterSpacing: '5px', textTransform: 'uppercase' }}>
            Relationship
          </span>
          <span style={{ fontSize: 10, color: '#c4a090', letterSpacing: '3px', textTransform: 'uppercase', marginTop: 2 }}>
            dashboard emocional
          </span>
        </div>

        {/* User cards */}
        <div className="w-full flex flex-col gap-3 fade-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <p style={{ fontSize: 11, color: '#a89080', textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>
            ¿Quién eres?
          </p>
          {USERS.map(u => (
            <button
              key={u.id}
              onClick={() => enter(u.id)}
              className="w-full flex items-center gap-4 text-left transition-all active:scale-98"
              style={{
                padding: '18px 20px',
                borderRadius: 20,
                border: '0.5px solid #e0d3c8',
                background: '#fff',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#c4785a'
                ;(e.currentTarget as HTMLElement).style.background = '#fdf5f0'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#e0d3c8'
                ;(e.currentTarget as HTMLElement).style.background = '#fff'
              }}
            >
              <div
                style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: u.avatarBg, color: u.avatarColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 20, fontWeight: 400, flexShrink: 0,
                }}
              >
                {u.initial}
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 15, color: '#2a1f1a', fontWeight: 400 }}>{u.id}</div>
                <div style={{ fontSize: 11, color: '#a89080', marginTop: 2 }}>registrar mis métricas</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c4a090" strokeWidth="1.5">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          ))}
        </div>

        <p style={{ fontSize: 10, color: '#d0bfb5', letterSpacing: '1px', textAlign: 'center' }}>
          los datos se sincronizan para los dos
        </p>
      </div>
    </div>
  )
}
