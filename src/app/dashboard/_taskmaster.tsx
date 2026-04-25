'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TaskMasterDashboard } from '@/components/role-specific/TaskMasterDashboard'
import { useRealtimeZones } from '@/hooks/useRealtime'
import { createClient } from '@/lib/supabase/client'
import type { ZoneWithState, ActivityWithZone, Profile } from '@/types'
import type { TablesUpdate, TablesInsert } from '@/types/database.types'
import type { ZoneStatus } from '@/types/roles'

interface Props {
  zones: ZoneWithState[]
  activity: ActivityWithZone[]
  workers: Profile[]
  userId: string
}

export default function TaskMasterDashboardWrapper({ zones: initial, activity, workers, userId }: Props) {
  const [zones, setZones] = useState(initial)
  const router = useRouter()
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
    const update: TablesUpdate<'zone_states'> = {
      status,
      updated_at: new Date().toISOString(),
      ...extra,
    }
    if (status === 'in_progress') update.started_at = new Date().toISOString()
    if (status === 'idle') {
      update.started_at = null
      update.operation_type_id = null
      update.assigned_worker_id = null
      update.notes = null
    }

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
  }, [supabase, userId])

  return (
    <TaskMasterDashboard
      zones={zones}
      activity={activity}
      workers={workers}
      userId={userId}
      onZoneUpdate={handleZoneUpdate}
      onRefresh={() => router.refresh()}
    />
  )
}
