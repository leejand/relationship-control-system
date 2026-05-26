'use client'

type Props = {
  label: string
  code: string
  value: number
  onChange: (v: number) => void
  inverted?: boolean
  description?: string
}

export default function MetricSlider({ label, code, value, onChange, inverted, description }: Props) {
  const color = inverted
    ? ['#7ab870','#9ab870','#c4a050','#c47050','#c46060'][value] ?? '#c46060'
    : ['#c4a090','#c4a090','#c4905a','#c4785a','#a86040','#8a4c2a'][value] ?? '#c4785a'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: 13, color: '#6b5040' }}>{label} </span>
          <span style={{ fontSize: 11, color: '#c4a090' }}>{code}</span>
          {description && (
            <div style={{ fontSize: 10, color: '#a89080', marginTop: 2 }}>{description}</div>
          )}
        </div>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, color, transition: 'color 0.2s' }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0} max={5} step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, ${color} ${(value/5)*100}%, #f0eae4 ${(value/5)*100}%)`,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#c4a090', padding: '0 1px' }}>
        {[0,1,2,3,4,5].map(n => <span key={n}>{n}</span>)}
      </div>
    </div>
  )
}
