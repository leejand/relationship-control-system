'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Heart, KeyRound, LogOut } from 'lucide-react'
import { useApp } from '@/components/AppProvider'
import { Brand, Button, Spinner } from '@/components/ui'
import { createCouple, joinCouple, signOut } from '@/lib/api'
import { humanError } from '@/lib/supabase'

/** Paso único tras registrarse: crear la pareja (y compartir el código) o unirse con el código del otro. */
export default function PairingPage() {
  const { status, profile, refresh } = useApp()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState<'create' | 'join' | null>(null)

  useEffect(() => {
    if (status === 'signed-out') router.replace('/')
    if (status === 'ready') router.replace('/hoy')
  }, [status, router])

  async function onCreate() {
    setBusy('create')
    try {
      await createCouple()
      await refresh()
      toast.success('Listo. Comparte tu código desde Ajustes para que tu pareja se una.')
    } catch (e) {
      toast.error(humanError(e))
    } finally {
      setBusy(null)
    }
  }

  async function onJoin(e: React.FormEvent) {
    e.preventDefault()
    setBusy('join')
    try {
      await joinCouple(code)
      await refresh()
      toast.success('¡Ya están conectados!')
    } catch (err) {
      toast.error(humanError(err))
    } finally {
      setBusy(null)
    }
  }

  if (status !== 'no-couple') return <main className="shell"><Spinner /></main>

  return (
    <main className="shell px-6">
      <div className="enter flex flex-1 flex-col justify-center gap-8 py-12">
        <div className="text-center">
          <Brand />
          <h1 className="mt-6 font-serif text-4xl font-light">Hola, {profile?.display_name}</h1>
          <p className="mt-2 text-[15px] text-ink-2">Conecta tu cuenta con la de tu pareja para empezar.</p>
        </div>

        <section className="card flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2 text-ink"><Heart className="size-4 text-accent" aria-hidden /> Soy el primero en llegar</div>
          <p className="text-sm text-muted">Creamos su espacio y te damos un código de 6 letras para tu pareja.</p>
          <Button onClick={onCreate} loading={busy === 'create'} disabled={busy === 'join'}>Crear nuestro espacio</Button>
        </section>

        <form onSubmit={onJoin} className="card flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2 text-ink"><KeyRound className="size-4 text-accent" aria-hidden /> Mi pareja ya tiene un código</div>
          <input
            className="field num text-center font-serif text-2xl uppercase tracking-[0.4em]"
            placeholder="ABC123"
            aria-label="Código de invitación"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^a-z0-9]/gi, '').slice(0, 6))}
            autoCapitalize="characters"
            autoComplete="off"
            required
            minLength={6}
          />
          <Button type="submit" variant="secondary" loading={busy === 'join'} disabled={busy === 'create' || code.length < 6}>
            Unirme
          </Button>
        </form>

        <Button variant="ghost" size="sm" onClick={() => signOut()} className="self-center">
          <LogOut className="size-4" aria-hidden /> Cerrar sesión
        </Button>
      </div>
    </main>
  )
}
