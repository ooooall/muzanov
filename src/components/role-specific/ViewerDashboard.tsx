'use client'

import { useState } from 'react'
import { FloorPlan } from '@/components/map/FloorPlan'
import { MapControls } from '@/components/map/MapControls'
import { OverviewPanel } from '@/components/panels/OverviewPanel'
import { FeedPanel } from '@/components/panels/FeedPanel'
import { ZoneDetailDrawer } from '@/components/panels/ZoneDetailDrawer'
import { cn } from '@/lib/utils'
import type { ZoneWithState, ActivityWithZone } from '@/types'

interface ViewerDashboardProps {
  zones: ZoneWithState[]
  activity: ActivityWithZone[]
}

type Tab = 'map' | 'overview' | 'feed'

export function ViewerDashboard({ zones, activity }: ViewerDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('map')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const stats = {
    in_progress: zones.filter(z => z.status === 'in_progress').length,
    attention:   zones.filter(z => z.status === 'attention').length,
    completed:   zones.filter(z => z.status === 'completed').length,
    idle:        zones.filter(z => z.status === 'idle').length,
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab bar */}
      <div className="flex border-b border-border-soft bg-canvas sticky top-14 z-20">
        {([
          { id: 'map',      label: 'Карта' },
          { id: 'overview', label: 'Статус' },
          { id: 'feed',     label: 'Лента' },
        ] as const).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 py-3 font-mono text-[11px] tracking-wide uppercase border-b-2 transition-colors',
              activeTab === id
                ? 'border-accent text-text-1'
                : 'border-transparent text-text-4 hover:text-text-3'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Map tab */}
      {activeTab === 'map' && (
        <div className="flex flex-col flex-1 min-h-0">
          <MapControls filter={filter} onFilterChange={setFilter} stats={stats} />
          <div className="flex-1 overflow-y-auto p-4">
            <FloorPlan
              zones={zones}
              selectedId={selectedId}
              filter={filter}
              onSelectRoom={setSelectedId}
            />
          </div>
        </div>
      )}

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="flex-1 overflow-y-auto p-4">
          <OverviewPanel zones={zones} />
        </div>
      )}

      {/* Feed tab */}
      {activeTab === 'feed' && (
        <div className="flex-1 overflow-y-auto">
          <FeedPanel activity={activity} />
        </div>
      )}

      {/* Drawer (read-only) */}
      <ZoneDetailDrawer
        zoneId={selectedId}
        zones={zones}
        role={null}
        onClose={() => setSelectedId(null)}
        onStatusChange={async () => {}}
      />
    </div>
  )
}
