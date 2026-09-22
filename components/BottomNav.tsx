'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Heart, Home, LineChart, Plus } from 'lucide-react'
import { cx } from './ui'

const ITEMS = [
  { href: '/hoy', label: 'Hoy', icon: Home },
  { href: '/historial', label: 'Historial', icon: CalendarDays },
  { href: '/registro', label: 'Registrar', icon: Plus, primary: true },
  { href: '/tendencias', label: 'Tendencias', icon: LineChart },
  { href: '/nosotros', label: 'Nosotros', icon: Heart },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav
      aria-label="Principal"
      className="safe-bottom sticky bottom-0 z-20 mt-auto border-t border-line bg-shell/90 px-2 pt-2 backdrop-blur-md"
    >
      <ul className="grid grid-cols-5 items-end">
        {ITEMS.map(({ href, label, icon: Icon, primary }) => {
          const active = path.startsWith(href)
          return (
            <li key={href} className="flex justify-center">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'pressable flex flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[10.5px]',
                  active ? 'text-ink' : 'text-muted',
                )}
              >
                {primary ? (
                  <span className="-mt-5 inline-flex size-12 items-center justify-center rounded-full bg-ink text-shell shadow-[0_10px_24px_-10px_rgba(42,31,26,0.6)]">
                    <Icon className="size-5" aria-hidden />
                  </span>
                ) : (
                  <Icon className="size-[22px]" strokeWidth={active ? 2 : 1.6} aria-hidden />
                )}
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
