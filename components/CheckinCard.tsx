'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { METRICS, moodEmoji, zoneOf } from '@/lib/metrics'
import { relativeDay } from '@/lib/dates'
import type { Checkin, Profile } from '@/lib/types'
import { Avatar, cx } from './ui'

export default function CheckinCard({ checkin, author }: { checkin: Checkin; author: Profile | null }) {
  const [open, setOpen] = useState(false)
  const zone = zoneOf(checkin.score)
  const emoji = moodEmoji(checkin.mood)

  return (
    <article className="card hoverable overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="pressable flex w-full items-center gap-3 px-4 py-3.5 text-left active:!scale-[0.99]"
      >
        <Avatar profile={author} size={34} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] text-ink">
            {author?.display_name ?? '—'} {emoji && <span aria-label={checkin.mood ?? ''}>{emoji}</span>}
          </p>
          <p className="text-[12px] capitalize text-muted">{relativeDay(checkin.date)}</p>
        </div>
        <span className="num font-serif text-[26px] leading-none" style={{ color: `var(--z-${zone})` }}>
          {Number(checkin.score).toFixed(1)}
        </span>
        <ChevronDown
          className={cx('size-4 text-muted-2 transition-transform duration-200', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open && (
        <div className="pop-in border-t border-line px-4 pb-4 pt-3">
          <dl className="grid grid-cols-5 gap-1 text-center">
            {METRICS.map((m) => (
              <div key={m.key} className="rounded-xl bg-surface-2 py-2">
                <dt className="text-[10px] tracking-wider text-muted">{m.short}</dt>
                <dd className="num font-serif text-lg text-ink">{checkin[m.key]}</dd>
              </div>
            ))}
          </dl>
          {checkin.note && <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink-2">“{checkin.note}”</p>}
        </div>
      )}
    </article>
  )
}
