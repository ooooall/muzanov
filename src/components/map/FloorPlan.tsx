'use client'

import { useMemo } from 'react'
import { ROOMS, MAP_VIEWBOX } from '@/lib/constants'
import { RoomShape } from './RoomShape'
import type { ZoneWithState } from '@/types'

interface FloorPlanProps {
  zones: ZoneWithState[]
  selectedId: string | null
  filter: string
  onSelectRoom: (id: string) => void
}

function getFilteredStatus(filter: string, status: string): boolean {
  if (filter === 'all') return false
  return status !== filter
}

export function FloorPlan({ zones, selectedId, filter, onSelectRoom }: FloorPlanProps) {
  const stateMap = useMemo(() => new Map(zones.map((z) => [z.zone_id, z])), [zones])

  const stats = useMemo(() => ({
    in_progress: zones.filter((z) => z.status === 'in_progress').length,
    attention: zones.filter((z) => z.status === 'attention').length,
    completed: zones.filter((z) => z.status === 'completed').length,
    idle: zones.filter((z) => z.status === 'idle').length,
  }), [zones])

  return (
    <div className="relative w-full">
      {/* Map container */}
      <div className="relative w-full bg-base rounded-lg overflow-hidden border border-border-soft">
        <svg
          viewBox={`0 0 ${MAP_VIEWBOX.w} ${MAP_VIEWBOX.h}`}
          className="w-full h-auto block"
          style={{ maxHeight: '75vh' }}
          role="img"
          aria-label="План квартиры"
        >
          {/* Subtle grid background */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="rgba(15,23,42,0.06)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width={MAP_VIEWBOX.w} height={MAP_VIEWBOX.h} fill="url(#grid)" />

          {/* Rooms */}
          {ROOMS.map(room => {
            const state = stateMap.get(room.id) ?? null
            const isFiltered = filter !== 'all' && getFilteredStatus(filter, state?.status ?? 'idle')

            return (
              <RoomShape
                key={room.id}
                room={room}
                state={state}
                isSelected={selectedId === room.id}
                isFiltered={isFiltered}
                onClick={() => onSelectRoom(room.id)}
              />
            )
          })}

          {/* Compass */}
          <g transform="translate(558, 752)" opacity="0.25">
            <circle cx="0" cy="0" r="14" fill="none" stroke="rgba(15,23,42,0.22)" strokeWidth="0.5" />
            <text x="0" y="-18" textAnchor="middle" fontSize="6" fontFamily="monospace" fill="#64748b" letterSpacing="0.1em">N</text>
            <line x1="0" y1="-10" x2="0" y2="10" stroke="#64748b" strokeWidth="0.5" />
            <line x1="-10" y1="0" x2="10" y2="0" stroke="#64748b" strokeWidth="0.5" />
          </g>
        </svg>

        {/* Stats overlay */}
        <div className="absolute bottom-2 left-2 flex gap-2">
          {stats.in_progress > 0 && (
            <span className="px-2 py-1 rounded bg-panel/90 border border-[rgba(245,197,24,0.2)] font-mono text-[9px] text-[#f5c518] uppercase tracking-wide">
              {stats.in_progress} в работе
            </span>
          )}
          {stats.attention > 0 && (
            <span className="px-2 py-1 rounded bg-panel/90 border border-[rgba(200,162,0,0.2)] font-mono text-[9px] text-[#c8a200] uppercase tracking-wide">
              {stats.attention} внимание
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
