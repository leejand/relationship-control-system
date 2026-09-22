'use client'
import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Copy, Download, LogOut, Share2 } from 'lucide-react'
import { useApp } from '@/components/AppProvider'
import { Avatar, Button, ScreenHeader, cx } from '@/components/ui'
import { claimLegacy, leaveCouple, signOut, updateCouple, updateProfile } from '@/lib/api'
import { humanError } from '@/lib/supabase'
import { PROFILE_COLORS, type ProfileColor } from '@/lib/types'

export default function SettingsPage() {
  const { profile, partner, couple, checkins, refresh } = useApp()
  const [name, setName] = useState(profile!.display_name)
  const [color, setColor] = useState<ProfileColor>(profile!.color)
  const [anniversary, setAnniversary] = useState(couple?.anniversary ?? '')
  const [legacyName, setLegacyName] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  async function run(key: string, fn: () => Promise<unknown>, ok: string) {
    setBusy(key)
    try {
      await fn()
      await refresh()
      toast.success(ok)
    } catch (e) {
      toast.error(humanError(e))
    } finally {
      setBusy(null)
    }
  }

  const invite = `Únete a nuestro espacio en Alelí con el código ${couple?.invite_code}: ${typeof window !== 'undefined' ? window.location.origin : ''}`

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: 'Alelí', text: invite }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(couple!.invite_code)
      toast.success('Código copiado')
    }
  }

  function exportCsv() {
    const header = 'fecha,persona,ce,com,con,re,sg,score,animo,nota'
    const rows = checkins.map((c) =>
      [c.date, c.user_id === profile!.id ? profile!.display_name : partner?.display_name ?? '', c.ce, c.com, c.con, c.re, c.sg, c.score, c.mood ?? '', `"${(c.note ?? '').replaceAll('"', '""')}"`].join(','),
    )
    const blob = new Blob(['﻿' + [header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `aleli-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex flex-col">
      <div className="px-3 pt-3">
        <Link href="/hoy" className="pressable inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-muted hover:bg-surface-2">
          <ArrowLeft className="size-4" aria-hidden /> Hoy
        </Link>
      </div>
      <ScreenHeader title="Ajustes" />

      <div className="enter flex flex-col gap-4 px-5 pb-6">
        <section className="card flex flex-col gap-4 p-5">
          <p className="eyebrow">Tu perfil</p>
          <div className="flex items-center gap-3">
            <Avatar profile={{ display_name: name || '?', color }} size={48} />
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} aria-label="Tu nombre" />
          </div>
          <div className="flex gap-2" role="radiogroup" aria-label="Tu color">
            {(Object.keys(PROFILE_COLORS) as ProfileColor[]).map((c) => (
              <button
                key={c}
                role="radio"
                aria-checked={color === c}
                aria-label={PROFILE_COLORS[c].label}
                onClick={() => setColor(c)}
                className={cx('pressable size-9 rounded-full border-2', color === c ? 'border-ink' : 'border-transparent')}
                style={{ background: PROFILE_COLORS[c].ink }}
              />
            ))}
          </div>
          <Button
            variant="secondary"
            loading={busy === 'profile'}
            disabled={!name.trim() || (name === profile!.display_name && color === profile!.color)}
            onClick={() => run('profile', () => updateProfile(profile!.id, { display_name: name.trim(), color }), 'Perfil actualizado')}
          >
            Guardar perfil
          </Button>
        </section>

        <section className="card flex flex-col gap-4 p-5">
          <p className="eyebrow">Su pareja</p>
          {partner ? (
            <div className="flex items-center gap-3">
              <Avatar profile={partner} size={40} />
              <p className="text-[15px] text-ink">Conectado con <strong className="font-medium">{partner.display_name}</strong></p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-[14px] text-ink-2">Tu pareja se une escribiendo este código al crear su cuenta:</p>
              <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
                <span className="num font-serif text-3xl tracking-[0.3em] text-ink">{couple?.invite_code}</span>
                <button onClick={() => navigator.clipboard.writeText(couple!.invite_code).then(() => toast.success('Código copiado'))} aria-label="Copiar código" className="pressable rounded-full p-2 text-muted hover:bg-surface">
                  <Copy className="size-4" aria-hidden />
                </button>
              </div>
              <Button variant="secondary" onClick={share}><Share2 className="size-4" aria-hidden /> Enviar invitación</Button>
            </div>
          )}
          <label className="flex flex-col gap-1.5 text-[14px] text-ink-2">
            Fecha de aniversario
            <input type="date" className="field" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} />
          </label>
          <Button
            variant="secondary"
            loading={busy === 'couple'}
            disabled={anniversary === (couple?.anniversary ?? '')}
            onClick={() => run('couple', () => updateCouple(couple!.id, { anniversary: anniversary || null }), 'Aniversario guardado')}
          >
            Guardar fecha
          </Button>
        </section>

        <section className="card flex flex-col gap-3 p-5">
          <p className="eyebrow">Tus datos</p>
          <Button variant="secondary" onClick={exportCsv} disabled={!checkins.length}>
            <Download className="size-4" aria-hidden /> Exportar registros (CSV)
          </Button>
          <details className="group">
            <summary className="cursor-pointer list-none text-[13px] text-muted underline-offset-4 hover:underline">
              Importar registros de la versión anterior
            </summary>
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-[13px] text-muted">Escribe el nombre con el que registrabas antes (por ejemplo, Alejandro o Lina).</p>
              <input className="field" value={legacyName} onChange={(e) => setLegacyName(e.target.value)} placeholder="Nombre anterior" />
              <Button
                variant="secondary"
                loading={busy === 'legacy'}
                disabled={!legacyName.trim()}
                onClick={() =>
                  run('legacy', async () => {
                    const n = await claimLegacy(legacyName)
                    toast.message(n ? `${n} registros importados` : 'No había registros nuevos con ese nombre')
                  }, 'Importación terminada')
                }
              >
                Importar
              </Button>
            </div>
          </details>
        </section>

        <Button variant="ghost" onClick={() => signOut()}>
          <LogOut className="size-4" aria-hidden /> Cerrar sesión
        </Button>
        <button
          onClick={() => {
            if (confirm('¿Salir de esta pareja? Tus registros quedan guardados pero dejarás de ver los de tu pareja.')) {
              run('leave', leaveCouple, 'Saliste de la pareja')
            }
          }}
          className="self-center text-[12px] text-muted underline-offset-4 hover:underline"
        >
          Salir de la pareja
        </button>
      </div>
    </div>
  )
}
