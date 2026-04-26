'use client'

import { useState, useCallback } from 'react'
import { WorkerDashboard } from '@/components/role-specific/WorkerDashboard'
import { useRealtimeZones } from '@/hooks/useRealtime'
import { createClient } from '@/lib/supabase/client'
import type { ZoneWithState, ActivityWithZone } from '@/types'
import type { TablesUpdate, TablesInsert } from '@/types/database.types'
import type { ZoneStatus } from '@/types/roles'

interface Props {
  zones: ZoneWithState[]
  activity: ActivityWithZone[]
  userId: string
}

export default function WorkerDashboardWrapper({ zones: initial, activity, userId }: Props) {
  const [zones, setZones] = useState(initial)
  const supabase = createClient()

  useRealtimeZones(useCallback((payload) => {
    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      setZones(prev => {
        const idx = prev.findIndex(z => z.zone_id === payload.new.zone_id)
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { ...prev[idx], ...payload.new }
          return next
        }
        return prev
      })
    }
  }, []))

  const handleZoneUpdate = useCallback(async (
    zoneId: string,
    status: ZoneStatus,
    extra?: Partial<TablesUpdate<'zone_states'>>
  ) => {
    try {
      const update: TablesUpdate<'zone_states'> = {
        status,
        updated_at: new Date().toISOString(),
        ...extra,
      }
      if (status === 'in_progress') update.started_at = new Date().toISOString()

      const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)

      if (!error) {
        const log: TablesInsert<'activity_log'> = {
          zone_id: zoneId,
          user_id: userId,
          action: 'status_change',
          details: { new_status: status },
        }
        await supabase.from('activity_log').insert(log)
      }

      return error
    } catch {
      return { message: 'network_error' }
    }
  }, [supabase, userId])

  return (
    <WorkerDashboard
      zones={zones}
      activity={activity}
      userId={userId}
      onZoneUpdate={handleZoneUpdate}
    />
  )
}
