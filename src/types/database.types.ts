export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'viewer' | 'worker' | 'taskmaster'
          status: 'pending' | 'active' | 'rejected'
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'viewer' | 'worker' | 'taskmaster'
          status?: 'pending' | 'active' | 'rejected'
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'viewer' | 'worker' | 'taskmaster'
          status?: 'pending' | 'active' | 'rejected'
          display_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          id: string
          name: string
          short_name: string
          code: string
          area: number
          geometry: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          short_name: string
          code: string
          area: number
          geometry: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          short_name?: string
          code?: string
          area?: number
          geometry?: Json
          updated_at?: string
        }
        Relationships: []
      }
      operation_types: {
        Row: {
          id: string
          code: string
          label: string
          sub_label: string | null
          is_system: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          label: string
          sub_label?: string | null
          is_system?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          code?: string
          label?: string
          sub_label?: string | null
          is_system?: boolean
          created_by?: string | null
        }
        Relationships: []
      }
      zone_states: {
        Row: {
          zone_id: string
          status: 'idle' | 'scheduled' | 'in_progress' | 'paused' | 'attention' | 'completed' | 'rework'
          operation_type_id: string | null
          assigned_worker_id: string | null
          notes: string | null
          started_at: string | null
          updated_at: string
        }
        Insert: {
          zone_id: string
          status?: 'idle' | 'scheduled' | 'in_progress' | 'paused' | 'attention' | 'completed' | 'rework'
          operation_type_id?: string | null
          assigned_worker_id?: string | null
          notes?: string | null
          started_at?: string | null
          updated_at?: string
        }
        Update: {
          status?: 'idle' | 'scheduled' | 'in_progress' | 'paused' | 'attention' | 'completed' | 'rework'
          operation_type_id?: string | null
          assigned_worker_id?: string | null
          notes?: string | null
          started_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_states_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: true
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_states_operation_type_id_fkey"
            columns: ["operation_type_id"]
            isOneToOne: false
            referencedRelation: "operation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_states_assigned_worker_id_fkey"
            columns: ["assigned_worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      activity_log: {
        Row: {
          id: string
          zone_id: string
          user_id: string | null
          action: string
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          zone_id: string
          user_id?: string | null
          action: string
          details?: Json | null
          created_at?: string
        }
        Update: {
          details?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'viewer' | 'worker' | 'taskmaster'
      zone_status: 'idle' | 'scheduled' | 'in_progress' | 'paused' | 'attention' | 'completed' | 'rework'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]
