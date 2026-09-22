'use client'
import { useId } from 'react'
import type { Metric } from '@/lib/metrics'

/** Color según qué tan "sano" es el valor (el conflicto se lee al revés). */
function tone(metric: Metric, value: number): string {
  const healthy = metric.inverted ? 5 - value : value
  if (healthy >= 4) return 'var(--z-estable)'
  if (healthy >= 2) return 'var(--z-friccion)'
  return 'var(--z-tension)'
}

export default function MetricSlider({
  metric,
  value,
  onChange,
}: {
  metric: Metric
  value: number
  onChange: (v: number) => void
}) {
  const id = useId()
  const color = tone(metric, value)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[15px] text-ink">
          {metric.label}
          {metric.inverted && <span className="ml-1.5 text-[11px] text-muted">resta</span>}
        </label>
        <span className="num font-serif text-[26px] leading-none transition-colors duration-200" style={{ color }}>
          {value}
        </span>
      </div>
      <p className="text-[13px] text-muted">{metric.question}</p>
      <input
        id={id}
        type="range"
        min={0}
        max={5}
        step={1}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value)
          if (v !== value && 'vibrate' in navigator) navigator.vibrate?.(4)
          onChange(v)
        }}
        aria-valuetext={`${value} de 5`}
        className="metric-range"
        style={{ '--track': color, '--fill': `${(value / 5) * 100}%` } as React.CSSProperties}
      />
      <div className="flex justify-between text-[11px] text-muted-2">
        <span>{metric.low}</span>
        <span>{metric.high}</span>
      </div>
    </div>
  )
}
