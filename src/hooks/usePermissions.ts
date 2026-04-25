'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { can, type Permission } from '@/lib/permissions'
import type { UserRole } from '@/types/roles'

export function useRole() {
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setRole(null)
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      setRole((data?.role as UserRole) ?? 'viewer')
      setLoading(false)
    }

    loadRole()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadRole()
    })

    return () => subscription.unsubscribe()
  }, [])

  return { role, loading }
}

export function usePermission(permission: Permission) {
  const { role, loading } = useRole()
  return { allowed: can(role, permission), loading }
}
