'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ZoneWithState, ActivityWithZone } from '@/types'

type ZoneStatePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: ZoneWithState
  old: Partial<ZoneWithState>
}

type ActivityPayload = {
  eventType: 'INSERT'
  new: ActivityWithZone
}

export function useRealtimeZones(onUpdate: (payload: ZoneStatePayload) => void) {
  const supabase = createClient()
  const cbRef = useRef(onUpdate)
  cbRef.current = onUpdate

  useEffect(() => {
    const channel = supabase
      .channel('zone-states-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'zone_states' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => cbRef.current(payload)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])
}

export function useRealtimeActivity(onInsert: (payload: ActivityPayload) => void) {
  const supabase = createClient()
  const cbRef = useRef(onInsert)
  cbRef.current = onInsert

  useEffect(() => {
    const channel = supabase
      .channel('activity-log-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => cbRef.current(payload)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase])
}
