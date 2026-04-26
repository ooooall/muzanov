'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { can, type Permission } from '@/lib/permissions'
import type { UserRole } from '@/types/roles'
import { appStorage, ROLE_STORAGE_KEY } from '@/lib/storage'

export function useRole() {
  const [role, setRole] = useState<UserRole | null>(() => appStorage.get<UserRole | null>(ROLE_STORAGE_KEY, null))
  const [loading, setLoading] = useState(() => !appStorage.has(ROLE_STORAGE_KEY))

  useEffect(() => {
    const supabase = createClient()

    async function loadRole() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          setRole(null)
          appStorage.remove(ROLE_STORAGE_KEY)
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
          appStorage.remove(ROLE_STORAGE_KEY)
          setLoading(false)
          return
        }

        const nextRole = (data?.role as UserRole) ?? 'viewer'
        setRole(nextRole)
        appStorage.set(ROLE_STORAGE_KEY, nextRole)
      } catch {
        setRole(null)
        appStorage.remove(ROLE_STORAGE_KEY)
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
