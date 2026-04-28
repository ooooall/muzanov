'use client'

import { useCallback, useState } from 'react'
import { WorkerDashboard } from '@/components/role-specific/WorkerDashboard'
import { useRealtimeZones } from '@/hooks/useRealtime'
import { createClient } from '@/lib/supabase/client'
import type { ZoneWithState, ActivityWithZone } from '@/types'
import type { TablesUpdate, TablesInsert } from '@/types/database.types'
import type { ZoneStatus } from '@/types/roles'
import { buildZoneUpdate } from '@/lib/zone-workflow'

interface Props {
  zones: ZoneWithState[]
  activity: ActivityWithZone[]
  userId: string
}

export default function WorkerDashboardWrapper({ zones: initial, activity, userId }: Props) {
  const [zones, setZones] = useState(initial)
  const [supabase] = useState(() => createClient())

  // ─── Realtime ─────────────────────────────────────────────────────────────────
  useRealtimeZones(useCallback((payload) => {
    if (payload.eventType !== 'UPDATE' && payload.eventType !== 'INSERT') return
    setZones(prev => {
      const idx = prev.findIndex(z => z.zone_id === payload.new.zone_id)
      if (idx < 0) return prev
      const next = [...prev]
      next[idx] = { ...prev[idx], ...payload.new }
      return next
    })
  }, []))

  // ─── Optimistic helper ─────────────────────────────────────────────────────────
  const patchZone = useCallback((zoneId: string, patch: Partial<ZoneWithState>) => {
    setZones(prev => prev.map(z => z.zone_id === zoneId ? { ...z, ...patch } : z))
  }, [])

  // ─── Zone status update ────────────────────────────────────────────────────────
  const handleZoneUpdate = useCallback(async (
    zoneId: string,
    status: ZoneStatus,
    extra?: Partial<TablesUpdate<'zone_states'>>,
  ) => {
    // Instant UI feedback
    patchZone(zoneId, { status, ...(extra as Partial<ZoneWithState>), updated_at: new Date().toISOString() })

    try {
      const update = buildZoneUpdate(status, extra)
      const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)

      if (error) return error

      const log: TablesInsert<'activity_log'> = {
        zone_id: zoneId,
        user_id: userId,
        action: 'status_change',
        details: { new_status: status },
      }
      supabase.from('activity_log').insert(log) // fire-and-forget
      return null
    } catch {
      return { message: 'network_error' }
    }
  }, [patchZone, supabase, userId])

  return (
    <WorkerDashboard
      zones={zones}
      userId={userId}
      onZoneUpdate={handleZoneUpdate}
      onPatchZone={patchZone}
    />
  )
}
