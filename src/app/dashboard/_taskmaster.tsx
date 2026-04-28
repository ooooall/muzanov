'use client'

import { useCallback, useRef, useState } from 'react'
import { TaskMasterDashboard } from '@/components/role-specific/TaskMasterDashboard'
import { useRealtimeActivity, useRealtimeZones } from '@/hooks/useRealtime'
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
  zones: initialZones,
  activity: initialActivity,
  workers,
  operations,
  userId,
  isOwnerAccount,
}: Props) {
  const [zones, setZones]       = useState(initialZones)
  const [activity, setActivity] = useState(initialActivity)
  const [supabase]              = useState(() => createClient())

  // Refs for use inside realtime callbacks (avoid stale closures)
  const workersRef    = useRef(workers)
  const operationsRef = useRef(operations)
  const zonesRef      = useRef(zones)
  workersRef.current    = workers
  operationsRef.current = operations
  zonesRef.current      = zones

  // ─── Realtime: zone states ────────────────────────────────────────────────────
  useRealtimeZones(useCallback((payload) => {
    if (payload.eventType !== 'UPDATE' && payload.eventType !== 'INSERT') return

    setZones(prev => {
      const idx = prev.findIndex(z => z.zone_id === payload.new.zone_id)
      if (idx < 0) return prev

      const existing = prev[idx]
      const updated: ZoneWithState = { ...existing, ...payload.new }

      // Resolve joined rows from local lists (realtime only sends FK ids)
      if (payload.new.operation_type_id !== existing.operation_type_id) {
        updated.operation_types =
          operationsRef.current.find(o => o.id === payload.new.operation_type_id) ?? null
      }
      if (payload.new.assigned_worker_id !== existing.assigned_worker_id) {
        updated.profiles =
          workersRef.current.find(w => w.id === payload.new.assigned_worker_id) ?? null
      }

      const next = [...prev]
      next[idx] = updated
      return next
    })
  }, []))

  // ─── Realtime: activity log → live feed ──────────────────────────────────────
  useRealtimeActivity(useCallback((payload) => {
    const zone = zonesRef.current.find(z => z.zone_id === payload.new.zone_id)
    if (!zone) return

    // Enrich with the zone row so ActivityWithZone shape is satisfied
    const newEntry: ActivityWithZone = {
      ...(payload.new as ActivityWithZone),
      zones: zone.zones,
    }

    setActivity(prev => [newEntry, ...prev].slice(0, 50))
  }, []))

  // ─── Optimistic helpers ───────────────────────────────────────────────────────
  const patchZone = useCallback((zoneId: string, patch: Partial<ZoneWithState>) => {
    setZones(prev => prev.map(z => z.zone_id === zoneId ? { ...z, ...patch } : z))
  }, [])

  const resetAllZones = useCallback(() => {
    setZones(prev => prev.map(z => ({
      ...z,
      status:             'new' as ZoneStatus,
      operation_type_id:  null,
      operation_types:    null,
      assigned_worker_id: null,
      profiles:           null,
      notes:              null,
      started_at:         null,
      updated_at:         new Date().toISOString(),
    })))
    setActivity([])
  }, [])

  // ─── Zone status update ───────────────────────────────────────────────────────
  const handleZoneUpdate = useCallback(async (
    zoneId: string,
    status: ZoneStatus,
    extra?: Partial<TablesUpdate<'zone_states'>>,
  ) => {
    patchZone(zoneId, { status, ...(extra as Partial<ZoneWithState>), updated_at: new Date().toISOString() })

    try {
      const update = buildZoneUpdate(status, extra)
      const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)
      if (error) return error

      const log: TablesInsert<'activity_log'> = {
        zone_id: zoneId, user_id: userId, action: 'status_change', details: { new_status: status },
      }
      supabase.from('activity_log').insert(log)
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
