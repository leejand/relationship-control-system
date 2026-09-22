import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Cliente único del navegador. La seguridad no depende de este código sino
 * de las políticas RLS de supabase/migrations: la anon key es pública.
 */
export function supabase(): SupabaseClient {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local')
  }
  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })
  return client
}

/** Traduce los errores más comunes de Supabase a un mensaje para la persona. */
export function humanError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error)
  const map: [RegExp, string][] = [
    [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
    [/email not confirmed/i, 'Confirma tu correo antes de entrar (revisa tu bandeja).'],
    [/user already registered/i, 'Ya existe una cuenta con ese correo.'],
    [/password should be at least/i, 'La contraseña debe tener al menos 6 caracteres.'],
    [/código no válido/i, 'Ese código no existe. Revísalo con tu pareja.'],
    [/ya está completa/i, 'Esa pareja ya tiene dos personas.'],
    [/ya perteneces/i, 'Ya perteneces a una pareja.'],
    [/failed to fetch|network/i, 'Sin conexión. Inténtalo de nuevo.'],
  ]
  return map.find(([re]) => re.test(msg))?.[1] ?? 'Algo salió mal. Inténtalo de nuevo.'
}
