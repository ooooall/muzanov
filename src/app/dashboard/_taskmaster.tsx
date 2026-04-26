'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TaskMasterDashboard } from '@/components/role-specific/TaskMasterDashboard'
import { useRealtimeZones } from '@/hooks/useRealtime'
import { createClient } from '@/lib/supabase/client'
import type { ZoneWithState, ActivityWithZone, Profile, OperationType } from '@/types'
import type { TablesUpdate, TablesInsert } from '@/types/database.types'
import type { ZoneStatus } from '@/types/roles'
import { buildZoneUpdate } from '@/lib/zone-workflow'

interface Props {
  zones: ZoneWithState[]
  activity: ActivityWithZone[]
  workers: Profile[]
  operations: OperationType[]
  userId: string
}

export default function TaskMasterDashboardWrapper({ zones: initial, activity, workers, operations, userId }: Props) {
  const [zones, setZones] = useState(initial)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

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
      const update = buildZoneUpdate(status, extra)

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
    <TaskMasterDashboard
      zones={zones}
      activity={activity}
      workers={workers}
      operations={operations}
      userId={userId}
      onZoneUpdate={handleZoneUpdate}
      onRefresh={() => router.refresh()}
    />
  )
}
