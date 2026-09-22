'use client'
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { PROFILE_COLORS, type Profile } from '@/lib/types'

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ')
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  loading?: boolean
  size?: 'md' | 'sm'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading, size = 'md', className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx(
        'pressable inline-flex items-center justify-center gap-2 rounded-2xl font-medium select-none',
        size === 'md' ? 'h-12 px-5 text-[15px]' : 'h-9 px-3.5 text-[13px]',
        variant === 'primary' && 'bg-ink text-shell',
        variant === 'secondary' && 'bg-surface text-ink border border-line hoverable',
        variant === 'ghost' && 'text-ink-2 hover:bg-surface-2',
        variant === 'danger' && 'bg-[var(--z-tension-soft)] text-[var(--z-tension)]',
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
})

export function Avatar({ profile, size = 36 }: { profile: Pick<Profile, 'display_name' | 'color'> | null; size?: number }) {
  const c = PROFILE_COLORS[profile?.color ?? 'terracota']
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-serif"
      style={{ width: size, height: size, background: c.soft, color: c.ink, fontSize: size * 0.48 }}
    >
      {(profile?.display_name ?? '?').trim().charAt(0).toUpperCase()}
    </span>
  )
}

export function Brand({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return (
    <span
      className={cx('font-serif italic font-light text-accent leading-none', size === 'lg' ? 'text-6xl' : 'text-[26px]')}
    >
      Alelí
    </span>
  )
}

export function Spinner({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-20" role="status">
      <Loader2 className="size-5 animate-spin text-muted" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function EmptyState({ icon, title, children }: { icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
      <span className="mb-1 inline-flex size-12 items-center justify-center rounded-full bg-surface-2 text-muted">{icon}</span>
      <p className="font-serif text-xl text-ink">{title}</p>
      {children && <div className="text-sm text-muted">{children}</div>}
    </div>
  )
}

export function ScreenHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pb-4 pt-6">
      <div>
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="font-serif text-[34px] font-light leading-none text-ink">{title}</h1>
      </div>
      {action}
    </header>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 rounded-2xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'pressable h-9 flex-1 rounded-xl text-[13px]',
            value === o.value ? 'bg-surface text-ink shadow-[0_0_0_1px_var(--line)]' : 'text-muted',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
