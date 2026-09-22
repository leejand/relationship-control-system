'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Lock, Sparkles, Users } from 'lucide-react'
import { useApp } from '@/components/AppProvider'
import { Brand, Button, Segmented, Spinner } from '@/components/ui'
import { signIn, signUp } from '@/lib/api'
import { humanError } from '@/lib/supabase'

type Mode = 'entrar' | 'crear'

export default function AuthPage() {
  const { status } = useApp()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('entrar')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'ready') router.replace('/hoy')
    if (status === 'no-couple') router.replace('/pareja')
  }, [status, router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      if (mode === 'entrar') {
        await signIn(email.trim(), password)
      } else {
        const { needsConfirmation } = await signUp(email.trim(), password, name.trim())
        if (needsConfirmation) setSentTo(email.trim())
      }
    } catch (err) {
      toast.error(humanError(err))
    } finally {
      setBusy(false)
    }
  }

  if (status === 'loading' || status === 'ready' || status === 'no-couple') {
    return <main className="shell"><Spinner /></main>
  }

  return (
    <main className="shell px-6">
      <div className="enter flex flex-1 flex-col justify-center gap-10 py-14">
        <div className="flex flex-col items-center gap-3 text-center">
          <Brand size="lg" />
          <p className="max-w-[28ch] text-[15px] leading-relaxed text-ink-2">
            Un minuto al día para saber cómo están, juntos.
          </p>
        </div>

        {sentTo ? (
          <div className="card flex flex-col items-center gap-2 p-6 text-center">
            <Sparkles className="size-6 text-accent" aria-hidden />
            <p className="font-serif text-2xl">Revisa tu correo</p>
            <p className="text-sm text-muted">
              Te enviamos un enlace a <strong className="text-ink">{sentTo}</strong> para confirmar tu cuenta.
            </p>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setSentTo(null); setMode('entrar') }}>
              Ya lo confirmé
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <Segmented
              label="Acceso"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'entrar', label: 'Entrar' },
                { value: 'crear', label: 'Crear cuenta' },
              ]}
            />
            {mode === 'crear' && (
              <input
                className="field pop-in"
                placeholder="¿Cómo te llamas?"
                autoComplete="given-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={40}
              />
            )}
            <input
              className="field"
              type="email"
              placeholder="Correo"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="field"
              type="password"
              placeholder="Contraseña"
              autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" loading={busy} className="mt-1">
              {mode === 'entrar' ? 'Entrar' : 'Crear cuenta'}
            </Button>
          </form>
        )}

        <ul className="grid grid-cols-3 gap-2 text-center text-[11.5px] text-muted">
          <li className="flex flex-col items-center gap-1.5"><Lock className="size-4" aria-hidden />Privado para los dos</li>
          <li className="flex flex-col items-center gap-1.5"><Users className="size-4" aria-hidden />Vinculados por código</li>
          <li className="flex flex-col items-center gap-1.5"><Sparkles className="size-4" aria-hidden />Tendencias e ideas</li>
        </ul>
      </div>
    </main>
  )
}
