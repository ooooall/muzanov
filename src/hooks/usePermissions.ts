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
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          setRole(null)
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error) {
          setRole(null)
          setLoading(false)
          return
        }

        setRole((data?.role as UserRole) ?? 'viewer')
      } catch {
        setRole(null)
      } finally {
        setLoading(false)
      }
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
