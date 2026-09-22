'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/AppProvider'
import BottomNav from '@/components/BottomNav'
import { Spinner } from '@/components/ui'

/** Todo lo que está dentro exige sesión y pareja vinculada. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (status === 'signed-out') router.replace('/')
    if (status === 'no-couple') router.replace('/pareja')
  }, [status, router])

  return (
    <div className="shell">
      {status === 'ready' ? <main className="flex flex-1 flex-col pb-4">{children}</main> : <Spinner />}
      {status === 'ready' && <BottomNav />}
    </div>
  )
}
