'use client'

import { useMemo } from 'react'
import { MAP_VIEWBOX, ROOMS } from '@/lib/constants'
import { getZoneStats } from '@/lib/zone-workflow'
import { RoomShape } from './RoomShape'
import type { ZoneWithState } from '@/types'

interface FloorPlanProps {
  zones: ZoneWithState[]
  selectedId: string | null
  filter: string
  onSelectRoom: (id: string) => void
}

function isFilteredOut(filter: string, status: string) {
  if (filter === 'all') return false
  return filter !== status
}

export function FloorPlan({ zones, selectedId, filter, onSelectRoom }: FloorPlanProps) {
  const stateMap = useMemo(() => new Map(zones.map((zone) => [zone.zone_id, zone])), [zones])
  const stats = useMemo(() => getZoneStats(zones.map((zone) => zone.status)), [zones])

  return (
    <div className="relative w-full overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm">
      <svg
        viewBox={`0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h}`}
        className="block h-auto w-full"
        style={{ maxHeight: '75vh' }}
        role="img"
        aria-label="План квартиры"
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(15,23,42,0.05)" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width={MAP_VIEWBOX.w} height={MAP_VIEWBOX.h} fill="url(#grid)" />

        {ROOMS.map((room) => {
          const state = stateMap.get(room.id) ?? null
          const filtered = isFilteredOut(filter, state?.status ?? 'new')

          return (
            <RoomShape
              key={room.id}
              room={room}
              state={state}
              isSelected={selectedId === room.id}
              isFiltered={filtered}
              onClick={() => onSelectRoom(room.id)}
            />
          )
        })}
      </svg>

      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
        {stats.in_progress > 0 && (
          <span className="rounded-full border border-amber-100 bg-white/90 px-2 py-1 font-mono text-[9px] uppercase tracking-wide text-amber-700 backdrop-blur">
            {stats.in_progress} в работе
          </span>
        )}
        {stats.review > 0 && (
          <span className="rounded-full border border-blue-100 bg-white/90 px-2 py-1 font-mono text-[9px] uppercase tracking-wide text-blue-700 backdrop-blur">
            {stats.review} на проверке
          </span>
        )}
      </div>
    </div>
  )
}
