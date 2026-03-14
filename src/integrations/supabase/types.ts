export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      compliance_tasks: {
        Row: {
          act_reference: string | null
          assigned_to: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          evidence_urls: string[] | null
          id: string
          is_recurring: boolean | null
          recurrence_pattern: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          act_reference?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          evidence_urls?: string[] | null
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          act_reference?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          evidence_urls?: string[] | null
          id?: string
          is_recurring?: boolean | null
          recurrence_pattern?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          affected_headcount_max: number | null
          affected_headcount_min: number | null
          affected_industries: string[] | null
          ai_summary: string | null
          category: string | null
          deadline_date: string | null
          document_type: string | null
          effective_date: string | null
          id: string
          impact_score: number | null
          is_amendment: boolean | null
          original_language: string | null
          original_text: string | null
          previous_version_id: string | null
          published_at: string | null
          scraped_at: string | null
          source_name: string | null
          source_url: string | null
          state: string | null
          tags: string[] | null
          title: string
          translated_text: string | null
          translation_confidence: string | null
          urgency: string | null
        }
        Insert: {
          affected_headcount_max?: number | null
          affected_headcount_min?: number | null
          affected_industries?: string[] | null
          ai_summary?: string | null
          category?: string | null
          deadline_date?: string | null
          document_type?: string | null
          effective_date?: string | null
          id?: string
          impact_score?: number | null
          is_amendment?: boolean | null
          original_language?: string | null
          original_text?: string | null
          previous_version_id?: string | null
          published_at?: string | null
          scraped_at?: string | null
          source_name?: string | null
          source_url?: string | null
          state?: string | null
          tags?: string[] | null
          title: string
          translated_text?: string | null
          translation_confidence?: string | null
          urgency?: string | null
        }
        Update: {
          affected_headcount_max?: number | null
          affected_headcount_min?: number | null
          affected_industries?: string[] | null
          ai_summary?: string | null
          category?: string | null
          deadline_date?: string | null
          document_type?: string | null
          effective_date?: string | null
          id?: string
          impact_score?: number | null
          is_amendment?: boolean | null
          original_language?: string | null
          original_text?: string | null
          previous_version_id?: string | null
          published_at?: string | null
          scraped_at?: string | null
          source_name?: string | null
          source_url?: string | null
          state?: string | null
          tags?: string[] | null
          title?: string
          translated_text?: string | null
          translation_confidence?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      keyword_watches: {
        Row: {
          created_at: string | null
          id: string
          keyword: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          keyword: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          keyword?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "keyword_watches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      liability_profiles: {
        Row: {
          contract_worker_bracket: string | null
          created_at: string | null
          employs_women: boolean | null
          has_canteen: boolean | null
          headcount_bracket: string | null
          health_score: number | null
          id: string
          in_sez: boolean | null
          industry_type: string | null
          multiple_locations: boolean | null
          primary_city: string | null
          states: string[] | null
          updated_at: string | null
          user_id: string
          workforce_nature: string | null
        }
        Insert: {
          contract_worker_bracket?: string | null
          created_at?: string | null
          employs_women?: boolean | null
          has_canteen?: boolean | null
          headcount_bracket?: string | null
          health_score?: number | null
          id?: string
          in_sez?: boolean | null
          industry_type?: string | null
          multiple_locations?: boolean | null
          primary_city?: string | null
          states?: string[] | null
          updated_at?: string | null
          user_id: string
          workforce_nature?: string | null
        }
        Update: {
          contract_worker_bracket?: string | null
          created_at?: string | null
          employs_women?: boolean | null
          has_canteen?: boolean | null
          headcount_bracket?: string | null
          health_score?: number | null
          id?: string
          in_sez?: boolean | null
          industry_type?: string | null
          multiple_locations?: boolean | null
          primary_city?: string | null
          states?: string[] | null
          updated_at?: string | null
          user_id?: string
          workforce_nature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "liability_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_alerts: {
        Row: {
          alert_type: string | null
          channels: string[] | null
          created_at: string | null
          document_id: string | null
          id: string
          is_read: boolean | null
          message: string | null
          user_id: string
        }
        Insert: {
          alert_type?: string | null
          channels?: string[] | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          user_id: string
        }
        Update: {
          alert_type?: string | null
          channels?: string[] | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_alerts_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          primary_state: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          primary_state?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          primary_state?: string | null
        }
        Relationships: []
      }
      user_watchlist: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_watchlist_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_watchlist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
