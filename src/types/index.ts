export type { UserRole, ZoneStatus, ActivityAction } from './roles'
export type { Database, Tables, TablesInsert, TablesUpdate, Enums } from './database.types'

import type { Tables } from './database.types'

export type Profile = Tables<'profiles'>
export type Zone = Tables<'zones'>
export type ZoneState = Tables<'zone_states'>
export type OperationType = Tables<'operation_types'>
export type ActivityLog = Tables<'activity_log'>

export type ZoneWithState = ZoneState & {
  zones: Zone
  operation_types: OperationType | null
  profiles: Profile | null
}

export type ActivityWithZone = ActivityLog & {
  zones: Zone
}

export type RoomGeometry =
  | { type: 'rect'; x: number; y: number; w: number; h: number }
  | { type: 'polygon'; points: string }

export type RoomDef = {
  id: string
  code: string
  name: string
  short: string
  area: number
  shape: RoomGeometry
  labelAt: { x: number; y: number }
}
