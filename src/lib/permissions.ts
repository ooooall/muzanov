import type { UserRole } from '@/types/roles'

export const PERMISSIONS = {
  // Map
  viewMap:           (_: UserRole) => true,
  viewZoneDetails:   (_: UserRole) => true,
  viewActivityFeed:  (_: UserRole) => true,

  // Zone state changes
  changeZoneStatus:  (r: UserRole) => r === 'worker' || r === 'taskmaster',
  resetZone:         (r: UserRole) => r === 'taskmaster',
  clearAllZones:     (r: UserRole) => r === 'taskmaster',

  // Assignments
  assignOperation:   (r: UserRole) => r === 'taskmaster',
  assignWorker:      (r: UserRole) => r === 'taskmaster',
  addNotes:          (r: UserRole) => r === 'worker' || r === 'taskmaster',

  // Operations management
  createOperation:   (r: UserRole) => r === 'taskmaster',
  editOperation:     (r: UserRole) => r === 'taskmaster',
  deleteOperation:   (r: UserRole) => r === 'taskmaster',

  // User management
  manageUsers:       (r: UserRole) => r === 'taskmaster',
  viewUserList:      (r: UserRole) => r === 'taskmaster',

  // Analytics & settings
  viewAnalytics:     (r: UserRole) => r === 'taskmaster',
  viewSettings:      (r: UserRole) => r === 'taskmaster',
  exportHistory:     (r: UserRole) => r === 'taskmaster',

  // Control panel
  viewControlPanel:  (r: UserRole) => r === 'taskmaster',
} as const

export type Permission = keyof typeof PERMISSIONS

export function can(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false
  return PERMISSIONS[permission](role)
}

export function getRoleMeta(role: UserRole) {
  const meta = {
    viewer:     { label: 'Наблюдатель',  sub: 'VIEWER',     color: '#5a5a5a' },
    worker:     { label: 'Исполнитель',  sub: 'WORKER',     color: '#f5c518' },
    taskmaster: { label: 'Постановщик',  sub: 'TASKMASTER', color: '#3aae5f' },
  }
  return meta[role]
}
