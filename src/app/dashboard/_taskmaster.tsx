'use client'

import { useCallback, useRef, useState } from 'react'
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
  isOwnerAccount: boolean
}

export default function TaskMasterDashboardWrapper({
  zones: initial,
  activity,
  workers,
  operations,
  userId,
  isOwnerAccount,
}: Props) {
  const [zones, setZones] = useState(initial)
  const [supabase] = useState(() => createClient())

  // Keep latest lists accessible inside the realtime callback without stale closure
  const workersRef    = useRef(workers)
  const operationsRef = useRef(operations)
  workersRef.current    = workers
  operationsRef.current = operations

  // ─── Realtime ────────────────────────────────────────────────────────────────
  // Realtime only sends FK ids, not joined rows.
  // We resolve operation_types / profiles locally so the UI never shows stale data.
  useRealtimeZones(useCallback((payload) => {
    if (payload.eventType !== 'UPDATE' && payload.eventType !== 'INSERT') return

    setZones(prev => {
      const idx = prev.findIndex(z => z.zone_id === payload.new.zone_id)
      if (idx < 0) return prev

      const existing = prev[idx]
      const updated: ZoneWithState = { ...existing, ...payload.new }

      // Resolve joined operation_types if FK changed
      if (payload.new.operation_type_id !== existing.operation_type_id) {
        updated.operation_types =
          operationsRef.current.find(o => o.id === payload.new.operation_type_id) ?? null
      }
      // Resolve joined profiles if FK changed
      if (payload.new.assigned_worker_id !== existing.assigned_worker_id) {
        updated.profiles =
          workersRef.current.find(w => w.id === payload.new.assigned_worker_id) ?? null
      }

      const next = [...prev]
      next[idx] = updated
      return next
    })
  }, []))

  // ─── Optimistic helpers ───────────────────────────────────────────────────────
  const patchZone = useCallback((zoneId: string, patch: Partial<ZoneWithState>) => {
    setZones(prev => prev.map(z => z.zone_id === zoneId ? { ...z, ...patch } : z))
  }, [])

  const resetAllZones = useCallback(() => {
    setZones(prev => prev.map(z => ({
      ...z,
      status:              'new' as ZoneStatus,
      operation_type_id:   null,
      operation_types:     null,
      assigned_worker_id:  null,
      profiles:            null,
      notes:               null,
      started_at:          null,
      updated_at:          new Date().toISOString(),
    })))
  }, [])

  // ─── Zone status update ───────────────────────────────────────────────────────
  const handleZoneUpdate = useCallback(async (
    zoneId: string,
    status: ZoneStatus,
    extra?: Partial<TablesUpdate<'zone_states'>>,
  ) => {
    // Optimistic update — UI responds immediately
    patchZone(zoneId, { status, ...(extra as Partial<ZoneWithState>), updated_at: new Date().toISOString() })

    try {
      const update = buildZoneUpdate(status, extra)
      const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)

      if (error) {
        // Revert isn't critical here — realtime will re-sync shortly
        return error
      }

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
    <TaskMasterDashboard
      zones={zones}
      activity={activity}
      workers={workers}
      operations={operations}
      userId={userId}
      isOwnerAccount={isOwnerAccount}
      onZoneUpdate={handleZoneUpdate}
      onPatchZone={patchZone}
      onResetAllZones={resetAllZones}
    />
  )
}
