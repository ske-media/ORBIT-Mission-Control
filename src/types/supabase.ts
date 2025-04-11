export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          avatar: string
          role: 'admin' | 'collaborator'
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          avatar?: string
          role?: 'admin' | 'collaborator'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          avatar?: string
          role?: 'admin' | 'collaborator'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string
          deadline: string | null
          client_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          deadline?: string | null
          client_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          deadline?: string | null
          client_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          id: string
          title: string
          description: string
          priority: 'low' | 'medium' | 'high'
          status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
          project_id: string
          assignee_id: string | null
          deadline: string | null
          created_at: string
          updated_at: string
          is_recurring: boolean | null
          recurring_frequency: 'daily' | 'weekly' | 'monthly' | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          priority: 'low' | 'medium' | 'high'
          status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
          project_id: string
          assignee_id?: string | null
          deadline?: string | null
          created_at?: string
          updated_at?: string
          is_recurring?: boolean | null
          recurring_frequency?: 'daily' | 'weekly' | 'monthly' | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          priority?: 'low' | 'medium' | 'high'
          status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
          project_id?: string
          assignee_id?: string | null
          deadline?: string | null
          created_at?: string
          updated_at?: string
          is_recurring?: boolean | null
          recurring_frequency?: 'daily' | 'weekly' | 'monthly' | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assignee_id_fkey"
            columns: ["assignee_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      inbox_items: {
        Row: {
          id: string
          content: string
          project_id: string | null
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          content: string
          project_id?: string | null
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          content?: string
          project_id?: string | null
          created_at?: string
          created_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_items_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_items_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          content: string
          type: 'ticket_assigned' | 'ticket_updated' | 'project_created' | 'project_updated' | 'deadline_approaching' | 'mention'
          related_entity: 'ticket' | 'project' | 'inbox_item' | null
          related_id: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          type: 'ticket_assigned' | 'ticket_updated' | 'project_created' | 'project_updated' | 'deadline_approaching' | 'mention'
          related_entity?: 'ticket' | 'project' | 'inbox_item' | null
          related_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          type?: 'ticket_assigned' | 'ticket_updated' | 'project_created' | 'project_updated' | 'deadline_approaching' | 'mention'
          related_entity?: 'ticket' | 'project' | 'inbox_item' | null
          related_id?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notification_settings: {
        Row: {
          user_id: string
          email_notifications: boolean
          browser_notifications: boolean
          sound_enabled: boolean
          notification_types: string[]
          updated_at: string
        }
        Insert: {
          user_id: string
          email_notifications?: boolean
          browser_notifications?: boolean
          sound_enabled?: boolean
          notification_types?: string[]
          updated_at?: string
        }
        Update: {
          user_id?: string
          email_notifications?: boolean
          browser_notifications?: boolean
          sound_enabled?: boolean
          notification_types?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
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
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}