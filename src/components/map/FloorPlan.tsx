'use client'

import { memo, useMemo } from 'react'
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
  return filter !== 'all' && filter !== status
}

export const FloorPlan = memo(function FloorPlan({
  zones,
  selectedId,
  filter,
  onSelectRoom,
}: FloorPlanProps) {
  const stateMap = useMemo(
    () => new Map(zones.map(z => [z.zone_id, z])),
    [zones],
  )
  const stats = useMemo(
    () => getZoneStats(zones.map(z => z.status)),
    [zones],
  )

  // Stable click handlers — recreated only when onSelectRoom changes
  const clickHandlers = useMemo(
    () => Object.fromEntries(ROOMS.map(r => [r.id, () => onSelectRoom(r.id)])),
    [onSelectRoom],
  )

  return (
    <div className="relative w-full overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm">
      <svg
        viewBox={`0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h}`}
        className="block h-auto w-full select-none"
        style={{ maxHeight: '70dvh' }}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="План квартиры"
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(15,23,42,0.05)" strokeWidth="0.5" />
          </pattern>
        </defs>

        <rect width={MAP_VIEWBOX.w} height={MAP_VIEWBOX.h} fill="url(#grid)" />

        {ROOMS.map(room => (
          <RoomShape
            key={room.id}
            room={room}
            state={stateMap.get(room.id) ?? null}
            isSelected={selectedId === room.id}
            isFiltered={isFilteredOut(filter, stateMap.get(room.id)?.status ?? 'new')}
            onClick={clickHandlers[room.id]}
          />
        ))}
      </svg>

      {/* Stats badges — solid bg, no backdrop-blur */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
        {stats.in_progress > 0 && (
          <span className="rounded-full border border-amber-100 bg-white px-2 py-1 font-mono text-[9px] uppercase tracking-wide text-amber-700">
            {stats.in_progress} в работе
          </span>
        )}
        {stats.review > 0 && (
          <span className="rounded-full border border-blue-100 bg-white px-2 py-1 font-mono text-[9px] uppercase tracking-wide text-blue-700">
            {stats.review} на проверке
          </span>
        )}
      </div>
    </div>
  )
})
