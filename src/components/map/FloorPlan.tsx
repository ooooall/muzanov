'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildCorridorPath, DEFAULT_CORRIDOR_CONTROLS, MAP_VIEWBOX, ROOMS, type CorridorControls } from '@/lib/constants'
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
  const [calibrationMode, setCalibrationMode] = useState(false)
  const [corridorControls, setCorridorControls] = useState<CorridorControls>(DEFAULT_CORRIDOR_CONTROLS)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const fromQuery = new URLSearchParams(window.location.search).get('corridor-calibrate') === '1'
    setCalibrationMode(fromQuery)
  }, [])

  const roomsForRender = useMemo(
    () =>
      ROOMS.map((room) => {
        if (!calibrationMode || room.id !== 'corridor') return room
        return {
          ...room,
          shape: { type: 'path' as const, d: buildCorridorPath(corridorControls) },
          labelAt: {
            x: Math.round((170 + corridorControls.rightX) / 2),
            y: corridorControls.topY + 104,
          },
        }
      }),
    [calibrationMode, corridorControls],
  )

  const stateMap = useMemo(() => new Map(zones.map((zone) => [zone.zone_id, zone])), [zones])
  const stats = useMemo(() => getZoneStats(zones.map((zone) => zone.status)), [zones])

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

        {roomsForRender.map((room) => {
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

      {calibrationMode && (
        <div className="absolute right-3 top-3 z-20 w-[240px] rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-slate-500">Corridor Calibration</div>
          <ControlRow
            label="TOP"
            value={corridorControls.topY}
            min={240}
            max={360}
            onChange={(value) => setCorridorControls((prev) => ({ ...prev, topY: value }))}
          />
          <ControlRow
            label="RIGHT"
            value={corridorControls.rightX}
            min={420}
            max={500}
            onChange={(value) => setCorridorControls((prev) => ({ ...prev, rightX: value }))}
          />
          <ControlRow
            label="INNER_X"
            value={corridorControls.innerX}
            min={200}
            max={280}
            onChange={(value) => setCorridorControls((prev) => ({ ...prev, innerX: value }))}
          />
          <ControlRow
            label="BOTTOM"
            value={corridorControls.bottomY}
            min={560}
            max={720}
            onChange={(value) => setCorridorControls((prev) => ({ ...prev, bottomY: value }))}
          />
          <ControlRow
            label="RADIUS"
            value={corridorControls.radius}
            min={0}
            max={20}
            onChange={(value) => setCorridorControls((prev) => ({ ...prev, radius: value }))}
          />
          <button
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-slate-700"
            onClick={async () => {
              const json = JSON.stringify(corridorControls)
              try {
                await navigator.clipboard.writeText(json)
              } catch {
                // no-op
              }
            }}
          >
            Copy values
          </button>
        </div>
      )}
    </div>
  )
}

function ControlRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <label className="mb-1.5 block">
      <div className="mb-0.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full"
      />
    </label>
  )
}
