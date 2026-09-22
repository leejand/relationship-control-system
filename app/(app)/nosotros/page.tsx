'use client'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Check, Heart, MessageCircle, Trash2 } from 'lucide-react'
import { useApp } from '@/components/AppProvider'
import { Avatar, Button, EmptyState, ScreenHeader, Segmented, Spinner, cx } from '@/components/ui'
import { addGratitude, addTopic, deleteGratitude, deleteTopic, listGratitudes, listTopics, setTopicResolved } from '@/lib/api'
import { humanError } from '@/lib/supabase'
import type { Gratitude, Topic } from '@/lib/types'

type Tab = 'gracias' | 'temas'

const PROMPTS = [
  'Gracias por…',
  'Hoy me hizo feliz que…',
  'Admiro de ti que…',
  'Me sentí cuidado cuando…',
]

export default function UsPage() {
  const { profile, partner, couple } = useApp()
  const [tab, setTab] = useState<Tab>('gracias')
  const [gratitudes, setGratitudes] = useState<Gratitude[] | null>(null)
  const [topics, setTopics] = useState<Topic[] | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!couple) return
    const [g, t] = await Promise.all([listGratitudes(couple.id), listTopics(couple.id)])
    setGratitudes(g)
    setTopics(t)
  }, [couple])

  useEffect(() => { load().catch((e) => toast.error(humanError(e))) }, [load])

  const author = (id: string) => (id === profile!.id ? profile : partner)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try {
      if (tab === 'gracias') {
        const g = await addGratitude(couple!.id, profile!.id, text)
        setGratitudes((prev) => [g, ...(prev ?? [])])
      } else {
        const t = await addTopic(couple!.id, profile!.id, text)
        setTopics((prev) => [t, ...(prev ?? [])])
      }
      setText('')
    } catch (err) {
      toast.error(humanError(err))
    } finally {
      setBusy(false)
    }
  }

  async function toggleTopic(t: Topic) {
    const resolved = !t.resolved_at
    setTopics((prev) => prev?.map((x) => (x.id === t.id ? { ...x, resolved_at: resolved ? new Date().toISOString() : null } : x)) ?? null)
    try {
      await setTopicResolved(t.id, resolved)
    } catch (e) {
      toast.error(humanError(e))
      load()
    }
  }

  async function remove(kind: Tab, id: number) {
    try {
      if (kind === 'gracias') {
        await deleteGratitude(id)
        setGratitudes((prev) => prev?.filter((x) => x.id !== id) ?? null)
      } else {
        await deleteTopic(id)
        setTopics((prev) => prev?.filter((x) => x.id !== id) ?? null)
      }
    } catch (e) {
      toast.error(humanError(e))
    }
  }

  const open = topics?.filter((t) => !t.resolved_at) ?? []
  const done = topics?.filter((t) => t.resolved_at) ?? []

  return (
    <div className="flex flex-col">
      <ScreenHeader eyebrow={partner ? `${profile!.display_name} & ${partner.display_name}` : 'Su espacio'} title="Nosotros" />
      <div className="px-5 pb-4">
        <Segmented
          label="Sección"
          value={tab}
          onChange={(v) => { setTab(v); setText('') }}
          options={[
            { value: 'gracias', label: 'Agradecimientos' },
            { value: 'temas', label: `Por hablar${open.length ? ` · ${open.length}` : ''}` },
          ]}
        />
      </div>

      <form onSubmit={submit} className="mx-5 mb-5 flex flex-col gap-2">
        <textarea
          className="field min-h-20 resize-none"
          placeholder={tab === 'gracias' ? 'Algo que agradeces de tu pareja…' : 'Un tema que quieres conversar con calma…'}
          maxLength={tab === 'gracias' ? 280 : 140}
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={tab === 'gracias' ? 'Nuevo agradecimiento' : 'Nuevo tema'}
        />
        {tab === 'gracias' && !text && (
          <div className="flex flex-wrap gap-1.5">
            {PROMPTS.map((p) => (
              <button key={p} type="button" onClick={() => setText(p + ' ')} className="pressable rounded-full bg-surface-2 px-3 py-1.5 text-[12px] text-ink-2">
                {p}
              </button>
            ))}
          </div>
        )}
        <Button type="submit" loading={busy} disabled={!text.trim()}>
          {tab === 'gracias' ? 'Compartir' : 'Agregar tema'}
        </Button>
      </form>

      {gratitudes == null || topics == null ? (
        <Spinner />
      ) : tab === 'gracias' ? (
        gratitudes.length === 0 ? (
          <EmptyState icon={<Heart className="size-5" />} title="Empiecen a agradecer">
            Los pequeños reconocimientos sostienen las relaciones largas.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3 px-5">
            {gratitudes.map((g) => (
              <li key={g.id} className="card pop-in flex flex-col gap-3 p-4">
                <p className="font-serif text-[20px] leading-snug text-ink">“{g.body}”</p>
                <div className="flex items-center gap-2 text-[12px] text-muted">
                  <Avatar profile={author(g.author_id)} size={22} />
                  {author(g.author_id)?.display_name}
                  <span>·</span>
                  {new Date(g.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  {g.author_id === profile!.id && (
                    <button onClick={() => remove('gracias', g.id)} aria-label="Eliminar" className="pressable ml-auto rounded-full p-1.5 hover:bg-surface-2">
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )
      ) : topics.length === 0 ? (
        <EmptyState icon={<MessageCircle className="size-5" />} title="Nada pendiente">
          Anoten aquí lo que quieran hablar en un buen momento, sin que se olvide.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-5 px-5">
          {[{ title: 'Pendientes', list: open }, { title: 'Ya lo hablamos', list: done }].map(
            ({ title, list }) =>
              list.length > 0 && (
                <section key={title} className="flex flex-col gap-2">
                  <h2 className="eyebrow px-1">{title}</h2>
                  <ul className="card divide-y divide-line overflow-hidden">
                    {list.map((t) => (
                      <li key={t.id} className="pop-in flex items-center gap-3 px-4 py-3">
                        <button
                          onClick={() => toggleTopic(t)}
                          role="checkbox"
                          aria-checked={!!t.resolved_at}
                          aria-label={t.resolved_at ? 'Marcar como pendiente' : 'Marcar como hablado'}
                          className={cx(
                            'pressable inline-flex size-6 shrink-0 items-center justify-center rounded-full border',
                            t.resolved_at ? 'border-[var(--z-estable)] bg-[var(--z-estable)] text-shell' : 'border-line-strong',
                          )}
                        >
                          {t.resolved_at && <Check className="size-3.5" aria-hidden />}
                        </button>
                        <span className={cx('flex-1 text-[14.5px]', t.resolved_at ? 'text-muted line-through' : 'text-ink')}>{t.title}</span>
                        <Avatar profile={author(t.author_id)} size={22} />
                        {t.author_id === profile!.id && (
                          <button onClick={() => remove('temas', t.id)} aria-label="Eliminar tema" className="pressable rounded-full p-1.5 text-muted hover:bg-surface-2">
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ),
          )}
        </div>
      )}
    </div>
  )
}
