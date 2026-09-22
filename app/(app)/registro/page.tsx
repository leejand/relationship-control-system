'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { useApp } from '@/components/AppProvider'
import MetricSlider from '@/components/MetricSlider'
import ScoreRing, { ZoneBadge } from '@/components/ScoreRing'
import { Button, ScreenHeader, cx } from '@/components/ui'
import { saveCheckin } from '@/lib/api'
import { addDays, formatLong, today } from '@/lib/dates'
import { calcScore, DEFAULT_VALUES, METRICS, MOODS, type Mood, type Values } from '@/lib/metrics'
import { humanError } from '@/lib/supabase'

export default function CheckinPage() {
  const { profile, couple, checkins, upsertLocal } = useApp()
  const router = useRouter()
  const t = today()
  /** Se permite registrar hoy o completar el de ayer si se olvidó. */
  const [date, setDate] = useState(t)
  const existing = checkins.find((c) => c.user_id === profile!.id && c.date === date) ?? null

  const [values, setValues] = useState<Values>(DEFAULT_VALUES)
  const [mood, setMood] = useState<Mood | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Al cambiar de fecha, carga lo ya guardado (si existe).
  useEffect(() => {
    if (existing) {
      setValues({ ce: existing.ce, com: existing.com, con: existing.con, re: existing.re, sg: existing.sg })
      setMood(existing.mood)
      setNote(existing.note ?? '')
    } else {
      setValues(DEFAULT_VALUES)
      setMood(null)
      setNote('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, existing?.id])

  const score = calcScore(values)

  async function save() {
    setSaving(true)
    try {
      const saved = await saveCheckin({ coupleId: couple!.id, userId: profile!.id, date, values, mood, note })
      upsertLocal(saved)
      toast.success(existing ? 'Registro actualizado' : 'Registro guardado', { icon: <Check className="size-4" /> })
      router.push('/hoy')
    } catch (e) {
      toast.error(humanError(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col">
      <ScreenHeader eyebrow={formatLong(date)} title={existing ? 'Editar registro' : '¿Cómo estuvo?'} />

      <div className="enter flex flex-col gap-4 px-5">
        <div className="flex gap-2" role="radiogroup" aria-label="Día">
          {[{ d: t, label: 'Hoy' }, { d: addDays(t, -1), label: 'Ayer' }].map(({ d, label }) => (
            <button
              key={d}
              role="radio"
              aria-checked={date === d}
              onClick={() => setDate(d)}
              className={cx(
                'pressable h-9 rounded-full border px-4 text-[13px]',
                date === d ? 'border-ink bg-ink text-shell' : 'border-line bg-surface text-ink-2',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <section className="card flex flex-col gap-6 p-5" aria-label="Dimensiones">
          {METRICS.map((m) => (
            <MetricSlider key={m.key} metric={m} value={values[m.key]} onChange={(v) => setValues((s) => ({ ...s, [m.key]: v }))} />
          ))}
        </section>

        <section className="card flex flex-col gap-3 p-5">
          <p className="text-[15px] text-ink">¿Cómo te sientes tú?</p>
          <div className="grid grid-cols-6 gap-1.5" role="radiogroup" aria-label="Estado de ánimo">
            {MOODS.map((m) => (
              <button
                key={m.key}
                role="radio"
                aria-checked={mood === m.key}
                aria-label={m.label}
                onClick={() => setMood(mood === m.key ? null : m.key)}
                className={cx(
                  'pressable flex aspect-square items-center justify-center rounded-2xl border text-[26px]',
                  mood === m.key ? 'border-accent bg-accent-soft' : 'border-transparent bg-surface-2 grayscale-[0.4]',
                )}
              >
                {m.emoji}
              </button>
            ))}
          </div>
          <label className="mt-2 text-[15px] text-ink" htmlFor="note">Una nota <span className="text-muted">(opcional)</span></label>
          <textarea
            id="note"
            className="field min-h-24 resize-none leading-relaxed"
            placeholder="Algo que pasó, algo que agradeces, algo que te pesa…"
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <p className="num self-end text-[11px] text-muted-2">{note.length}/500</p>
        </section>

        <section className="card flex items-center gap-4 p-4">
          <ScoreRing score={score} size={96} label="score" />
          <div className="flex flex-col items-start gap-2">
            <ZoneBadge score={score} />
            <p className="text-[12px] leading-relaxed text-muted">(Conexión + Comunicación + Regulación + Satisfacción) − Conflicto × 1,5</p>
          </div>
        </section>

        <div className="sticky bottom-[84px] z-10 -mx-5 bg-gradient-to-t from-shell via-shell/95 to-transparent px-5 pb-2 pt-4">
          <Button onClick={save} loading={saving} className="w-full">
            {existing ? 'Guardar cambios' : 'Guardar registro'}
          </Button>
        </div>
      </div>
    </div>
  )
}
