export type UserRole = 'viewer' | 'worker' | 'taskmaster'

export type ZoneStatus =
  | 'new'
  | 'in_progress'
  | 'review'
  | 'done'

export type ActivityAction =
  | 'status_change'
  | 'operation_assigned'
  | 'worker_assigned'
  | 'note_added'
  | 'checklist_updated'
  | 'zone_reset'
  | 'zone_archived'
