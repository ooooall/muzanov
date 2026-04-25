export type UserRole = 'viewer' | 'worker' | 'taskmaster'

export type ZoneStatus =
  | 'idle'
  | 'scheduled'
  | 'in_progress'
  | 'paused'
  | 'attention'
  | 'completed'
  | 'rework'

export type ActivityAction =
  | 'status_change'
  | 'operation_assigned'
  | 'worker_assigned'
  | 'note_added'
  | 'checklist_updated'
  | 'zone_reset'
  | 'zone_archived'
