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

/*
 * IMPORTANT: createClient() must be called INSIDE useEffect, not at hook level.
 * Calling it at hook level creates a new Supabase instance every render,
 * which means [supabase] dep triggers the effect every render,
 * reconnecting the WebSocket on every state update. This caused unreliable
 * realtime and "disappearing" operations.
 *
 * Visibility-change reconnection handles iOS PWA background/foreground:
 * Safari kills WebSockets after ~30s in background. When the user reopens
 * the PWA, we re-subscribe so live updates resume immediately.
 */

export function useRealtimeZones(onUpdate: (payload: ZoneStatePayload) => void) {
  const cbRef = useRef(onUpdate)
  cbRef.current = onUpdate

  useEffect(() => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any

    function subscribe() {
      channel = supabase
        .channel(`zone-states-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'zone_states' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => cbRef.current(payload),
        )
        .subscribe()
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // PWA returned to foreground — re-establish subscription
        supabase.removeChannel(channel)
        subscribe()
      }
    }

    subscribe()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      supabase.removeChannel(channel)
    }
  }, []) // Empty deps: subscribe once, never reconnect on re-renders
}

export function useRealtimeActivity(onInsert: (payload: ActivityPayload) => void) {
  const cbRef = useRef(onInsert)
  cbRef.current = onInsert

  useEffect(() => {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any

    function subscribe() {
      channel = supabase
        .channel(`activity-log-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'activity_log' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (payload: any) => cbRef.current(payload),
        )
        .subscribe()
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        supabase.removeChannel(channel)
        subscribe()
      }
    }

    subscribe()
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      supabase.removeChannel(channel)
    }
  }, [])
}
