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
          current_organization_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          avatar?: string
          role?: 'admin' | 'collaborator'
          current_organization_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          avatar?: string
          role?: 'admin' | 'collaborator'
          current_organization_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_current_organization_id_fkey"
            columns: ["current_organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string
          owner_id: string
          is_public: boolean
          is_archived: boolean
          client_name: string | null
          deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          owner_id: string
          is_public?: boolean
          is_archived?: boolean
          client_name?: string | null
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          owner_id?: string
          is_public?: boolean
          is_archived?: boolean
          client_name?: string | null
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      project_members: {
        Row: {
          project_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at: string
        }
        Insert: {
          project_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
        Update: {
          project_id?: string
          user_id?: string
          role?: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      tickets: {
        Row: {
          id: string
          project_id: string
          assignee_id: string | null
          title: string
          description: string
          priority: 'low' | 'medium' | 'high'
          status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
          deadline: string | null
          is_recurring: boolean
          recurring_frequency: 'daily' | 'weekly' | 'monthly' | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          assignee_id?: string | null
          title: string
          description: string
          priority: 'low' | 'medium' | 'high'
          status: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
          deadline?: string | null
          is_recurring?: boolean
          recurring_frequency?: 'daily' | 'weekly' | 'monthly' | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          assignee_id?: string | null
          title?: string
          description?: string
          priority?: 'low' | 'medium' | 'high'
          status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'
          deadline?: string | null
          is_recurring?: boolean
          recurring_frequency?: 'daily' | 'weekly' | 'monthly' | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assignee_id_fkey"
            columns: ["assignee_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
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
      ticket_assignees: {
        Row: {
          ticket_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          ticket_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          ticket_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_assignees_ticket_id_fkey";
            columns: ["ticket_id"];
            referencedRelation: "tickets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_assignees_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      clients: {
        Row: {
          id: string
          name: string
          contact_person_name: string | null
          contact_person_email: string | null
          contact_person_phone: string | null
          company_address: string | null
          company_website: string | null
          notes: string | null
          status: 'prospect' | 'active' | 'inactive' | 'archived'
          source: string | null
          industry: string | null
          created_by_user_id: string
          assigned_to_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_person_name?: string | null
          contact_person_email?: string | null
          contact_person_phone?: string | null
          company_address?: string | null
          company_website?: string | null
          notes?: string | null
          status?: 'prospect' | 'active' | 'inactive' | 'archived'
          source?: string | null
          industry?: string | null
          created_by_user_id?: string
          assigned_to_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_person_name?: string | null
          contact_person_email?: string | null
          contact_person_phone?: string | null
          company_address?: string | null
          company_website?: string | null
          notes?: string | null
          status?: 'prospect' | 'active' | 'inactive' | 'archived'
          source?: string | null
          industry?: string | null
          created_by_user_id?: string
          assigned_to_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      client_interactions: {
        Row: {
          id: string
          client_id: string
          user_id: string
          interaction_type: 'call' | 'email' | 'meeting' | 'note' | 'linkedin'
          interaction_date: string
          summary: string
          follow_up_needed: boolean
          follow_up_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          user_id?: string
          interaction_type: 'call' | 'email' | 'meeting' | 'note' | 'linkedin'
          interaction_date?: string
          summary: string
          follow_up_needed?: boolean
          follow_up_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          user_id?: string
          interaction_type?: 'call' | 'email' | 'meeting' | 'note' | 'linkedin'
          interaction_date?: string
          summary?: string
          follow_up_needed?: boolean
          follow_up_date?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_client_id_fkey"
            columns: ["client_id"]
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_interactions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      organizations: {
        Row: {
          id: string;
          name: string;
          industry: string;
          company_size?: string;
          company_address?: string;
          company_website?: string;
          primary_language: 'FR' | 'EN';
          timezone: string;
          status: 'prospect' | 'active' | 'inactive' | 'archived';
          acquisition_source?: string;
          tags?: string[];
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Row']>;
        Relationships: [];
      }
      contacts: {
        Row: {
          id: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          role?: string;
          email?: string;
          phone?: string;
          preferred_channel?: 'email' | 'phone' | 'whatsapp' | 'sms';
          language?: 'FR' | 'EN';
          calendly_link?: string;
          notes?: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['contacts']['Row']>;
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      }
      interactions: {
        Row: {
          id: string;
          organization_id: string;
          contact_id?: string;
          type: 'meeting' | 'call' | 'email' | 'whatsapp' | 'sms' | 'other';
          date: string;
          title: string;
          description?: string;
          location?: string;
          status: 'scheduled' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['interactions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['interactions']['Row']>;
        Relationships: [
          {
            foreignKeyName: "interactions_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interactions_contact_id_fkey";
            columns: ["contact_id"];
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          }
        ];
      }
      proposals: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          amount: number;
          currency: string;
          status: 'draft' | 'sent' | 'accepted' | 'rejected';
          sent_date?: string;
          response_date?: string;
          notes?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['proposals']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['proposals']['Row']>;
        Relationships: [
          {
            foreignKeyName: "proposals_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
      }
      organization_projects: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description?: string;
          start_date: string;
          end_date?: string;
          status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
          amount: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organization_projects']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organization_projects']['Row']>;
        Relationships: [
          {
            foreignKeyName: "organization_projects_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          }
        ];
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