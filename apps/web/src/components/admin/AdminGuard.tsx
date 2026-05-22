'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { bootstrapSession } from '@/lib/auth/session'

const ADMIN_SITE_ID = 'marketplace'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    bootstrapSession(ADMIN_SITE_ID).then((result) => {
      if (cancelled) return

      if (result.status !== 'authenticated') {
        router.replace(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
        return
      }

      if (result.data.user.role !== 'admin') {
        router.replace('/?error=insufficient_permissions')
        return
      }

      setReady(true)
    })

    return () => {
      cancelled = true
    }
  }, [router])

  if (!ready) {
    return <div className="text-text-muted text-sm p-8">Verificando permissões...</div>
  }

  return <>{children}</>
}
