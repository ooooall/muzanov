import type { TablesUpdate } from '@/types'
import type { ZoneStatus } from '@/types/roles'

export const ACTIVE_ZONE_STATUSES: ZoneStatus[] = ['in_progress', 'review']
export const ARCHIVED_ZONE_STATUSES: ZoneStatus[] = ['done']
export const DEFAULT_ZONE_STATUS: ZoneStatus = 'new'

export function buildZoneUpdate(
  status: ZoneStatus,
  extra?: Partial<TablesUpdate<'zone_states'>>,
): TablesUpdate<'zone_states'> {
  const update: TablesUpdate<'zone_states'> = {
    status,
    updated_at: new Date().toISOString(),
    ...extra,
  }

  if (status === 'in_progress' && !extra?.started_at) {
    update.started_at = new Date().toISOString()
  }

  if (status === 'new') {
    update.started_at = null
  }

  return update
}

export function getZoneStats(statuses: ZoneStatus[]) {
  return statuses.reduce(
    (acc, status) => {
      acc[status] += 1
      return acc
    },
    {
      new: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    } as Record<ZoneStatus, number>,
  )
}

export function isArchivedStatus(status: ZoneStatus) {
  return ARCHIVED_ZONE_STATUSES.includes(status)
}

export function isActiveStatus(status: ZoneStatus) {
  return ACTIVE_ZONE_STATUSES.includes(status)
}
