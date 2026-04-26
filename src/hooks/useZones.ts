'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeZones, useRealtimeActivity } from './useRealtime'
import type { ZoneWithState, ActivityWithZone } from '@/types'
import type { TablesUpdate } from '@/types/database.types'
import type { ZoneStatus } from '@/types/roles'
import { buildZoneUpdate } from '@/lib/zone-workflow'

export function useZones() {
  const [zones, setZones] = useState<ZoneWithState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  const fetchZones = useCallback(async () => {
    const { data, error } = await supabase
      .from('zone_states')
      .select('*, zones(*), operation_types(*), profiles(*)')
      .order('zone_id')

    if (error) {
      setError(error.message)
    } else {
      setZones((data ?? []) as ZoneWithState[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchZones() }, [fetchZones])

  useRealtimeZones(useCallback((payload) => {
    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      setZones(prev => {
        const idx = prev.findIndex(z => z.zone_id === payload.new.zone_id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...prev[idx], ...payload.new }
          return next
        }
        fetchZones()
        return prev
      })
    }
  }, [fetchZones]))

  const updateZoneStatus = useCallback(async (
    zoneId: string,
    status: ZoneStatus,
    extra?: Partial<TablesUpdate<'zone_states'>>
  ) => {
    const update = buildZoneUpdate(status, extra)

    const { error } = await supabase
      .from('zone_states')
      .update(update)
      .eq('zone_id', zoneId)

    return error
  }, [supabase])

  return { zones, loading, error, refetch: fetchZones, updateZoneStatus }
}

export function useActivity(limit = 50) {
  const [activity, setActivity] = useState<ActivityWithZone[]>([])
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('activity_log')
        .select('*, zones(*)')
        .order('created_at', { ascending: false })
        .limit(limit)
      setActivity((data ?? []) as ActivityWithZone[])
      setLoading(false)
    }
    fetch()
  }, [supabase, limit])

  useRealtimeActivity(useCallback((payload) => {
    setActivity(prev => [payload.new, ...prev].slice(0, limit))
  }, [limit]))

  return { activity, loading }
}
