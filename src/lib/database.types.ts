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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["asset_kind"]
          meta: Json
          post_id: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["asset_kind"]
          meta?: Json
          post_id?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["asset_kind"]
          meta?: Json
          post_id?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_suggestions: {
        Row: {
          applied: boolean
          audit_id: string
          block: string
          content: string
          created_at: string
          id: string
          impact: Database["public"]["Enums"]["suggestion_impact"]
          user_id: string
          variant_index: number
        }
        Insert: {
          applied?: boolean
          audit_id: string
          block: string
          content: string
          created_at?: string
          id?: string
          impact?: Database["public"]["Enums"]["suggestion_impact"]
          user_id: string
          variant_index?: number
        }
        Update: {
          applied?: boolean
          audit_id?: string
          block?: string
          content?: string
          created_at?: string
          id?: string
          impact?: Database["public"]["Enums"]["suggestion_impact"]
          user_id?: string
          variant_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "audit_suggestions_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          created_at: string
          id: string
          quick_wins: Json
          score_global: number | null
          scores: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quick_wins?: Json
          score_global?: number | null
          scores?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quick_wins?: Json
          score_global?: number | null
          scores?: Json
          user_id?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          body: string
          contact_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["contact_message_kind"]
          sent_at: string | null
          user_id: string
        }
        Insert: {
          body: string
          contact_id: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["contact_message_kind"]
          sent_at?: string | null
          user_id: string
        }
        Update: {
          body?: string
          contact_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["contact_message_kind"]
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          full_name: string
          headline: string | null
          id: string
          next_followup_at: string | null
          profile_url: string | null
          status: Database["public"]["Enums"]["contact_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          full_name: string
          headline?: string | null
          id?: string
          next_followup_at?: string | null
          profile_url?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          full_name?: string
          headline?: string | null
          id?: string
          next_followup_at?: string | null
          profile_url?: string | null
          status?: Database["public"]["Enums"]["contact_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_pillars: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          position: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          position?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          position?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_plans: {
        Row: {
          created_at: string
          horizon: number
          id: string
          start_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          horizon: number
          id?: string
          start_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          horizon?: number
          id?: string
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          id: string
          reason: Database["public"]["Enums"]["credit_reason"]
          ref_id: string | null
          user_id: string
        }
        Insert: {
          balance_after: number
          created_at?: string
          delta: number
          id?: string
          reason: Database["public"]["Enums"]["credit_reason"]
          ref_id?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          id?: string
          reason?: Database["public"]["Enums"]["credit_reason"]
          ref_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          company: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          position: number
          start_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          position?: number
          start_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          position?: number
          start_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          completed_at: string | null
          cost_credits: number
          created_at: string
          error: string | null
          id: string
          kind: Database["public"]["Enums"]["generation_kind"]
          status: Database["public"]["Enums"]["generation_status"]
          tokens_in: number | null
          tokens_out: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          cost_credits?: number
          created_at?: string
          error?: string | null
          id?: string
          kind: Database["public"]["Enums"]["generation_kind"]
          status?: Database["public"]["Enums"]["generation_status"]
          tokens_in?: number | null
          tokens_out?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          cost_credits?: number
          created_at?: string
          error?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["generation_kind"]
          status?: Database["public"]["Enums"]["generation_status"]
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          credits: number
          currency: string
          id: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_ref: string
          status: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          credits: number
          currency?: string
          id?: string
          provider: Database["public"]["Enums"]["payment_provider"]
          provider_ref: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          credits?: number
          currency?: string
          id?: string
          provider?: Database["public"]["Enums"]["payment_provider"]
          provider_ref?: string
          status?: Database["public"]["Enums"]["payment_status"]
          user_id?: string
        }
        Relationships: []
      }
      plan_slots: {
        Row: {
          angle: string | null
          created_at: string
          format: Database["public"]["Enums"]["post_format"]
          id: string
          pillar_id: string | null
          plan_id: string
          post_id: string | null
          scheduled_date: string
          status: Database["public"]["Enums"]["plan_slot_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          angle?: string | null
          created_at?: string
          format: Database["public"]["Enums"]["post_format"]
          id?: string
          pillar_id?: string | null
          plan_id: string
          post_id?: string | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["plan_slot_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          angle?: string | null
          created_at?: string
          format?: Database["public"]["Enums"]["post_format"]
          id?: string
          pillar_id?: string | null
          plan_id?: string
          post_id?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["plan_slot_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_slots_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "content_pillars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_slots_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "content_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_slots_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          body: string | null
          created_at: string
          id: string
          pillar_id: string | null
          slot_id: string | null
          status: Database["public"]["Enums"]["post_status"]
          tone: Database["public"]["Enums"]["post_tone"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          pillar_id?: string | null
          slot_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          tone?: Database["public"]["Enums"]["post_tone"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          pillar_id?: string | null
          slot_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          tone?: Database["public"]["Enums"]["post_tone"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "content_pillars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "plan_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string
          credits_balance: number
          full_name: string | null
          id: string
          objective: Database["public"]["Enums"]["user_objective"] | null
          updated_at: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          credits_balance?: number
          full_name?: string | null
          id: string
          objective?: Database["public"]["Enums"]["user_objective"] | null
          updated_at?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          credits_balance?: number
          full_name?: string | null
          id?: string
          objective?: Database["public"]["Enums"]["user_objective"] | null
          updated_at?: string
        }
        Relationships: []
      }
      proofs: {
        Row: {
          context: string | null
          created_at: string
          id: string
          label: string
          source: string | null
          user_id: string
          value: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          label: string
          source?: string | null
          user_id: string
          value?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          label?: string
          source?: string | null
          user_id?: string
          value?: string | null
        }
        Relationships: []
      }
      strategic_profiles: {
        Row: {
          about: string | null
          completeness: number
          created_at: string
          headline: string | null
          offer: string | null
          raw_source: Json | null
          target_audience: string | null
          updated_at: string
          user_id: string
          voice: Json
        }
        Insert: {
          about?: string | null
          completeness?: number
          created_at?: string
          headline?: string | null
          offer?: string | null
          raw_source?: Json | null
          target_audience?: string | null
          updated_at?: string
          user_id: string
          voice?: Json
        }
        Update: {
          about?: string | null
          completeness?: number
          created_at?: string
          headline?: string | null
          offer?: string | null
          raw_source?: Json | null
          target_audience?: string | null
          updated_at?: string
          user_id?: string
          voice?: Json
        }
        Relationships: []
      }
      targets: {
        Row: {
          company_sizes: string[]
          countries: string[]
          job_titles: string[]
          saved_queries: Json
          sectors: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_sizes?: string[]
          countries?: string[]
          job_titles?: string[]
          saved_queries?: Json
          sectors?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_sizes?: string[]
          countries?: string[]
          job_titles?: string[]
          saved_queries?: Json
          sectors?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_credits: {
        Args: {
          p_generation_id: string
          p_tokens_in?: number
          p_tokens_out?: number
        }
        Returns: number
      }
    }
    Enums: {
      asset_kind: "carousel" | "image"
      contact_message_kind: "connection_note" | "follow_up" | "reminder"
      contact_status: "contacted" | "replied" | "in_discussion" | "closed"
      credit_reason:
        | "signup_grant"
        | "purchase"
        | "generation_debit"
        | "refund"
        | "manual_adjust"
      generation_kind:
        | "audit"
        | "block_rewrite"
        | "profile_full"
        | "pillars"
        | "content_plan"
        | "post"
        | "carousel"
        | "image"
        | "outreach_message"
        | "profile_parse"
      generation_status: "pending" | "success" | "failed"
      payment_provider: "moneyfusion" | "moneroo" | "pawapay" | "stripe"
      payment_status: "pending" | "succeeded" | "failed" | "refunded"
      plan_slot_status: "planned" | "drafted" | "published" | "skipped"
      post_format: "text" | "carousel" | "image"
      post_status: "draft" | "scheduled" | "published" | "archived"
      post_tone: "professional" | "conversational" | "direct"
      suggestion_impact: "low" | "medium" | "high"
      user_objective: "job" | "clients" | "visibility"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      asset_kind: ["carousel", "image"],
      contact_message_kind: ["connection_note", "follow_up", "reminder"],
      contact_status: ["contacted", "replied", "in_discussion", "closed"],
      credit_reason: [
        "signup_grant",
        "purchase",
        "generation_debit",
        "refund",
        "manual_adjust",
      ],
      generation_kind: [
        "audit",
        "block_rewrite",
        "profile_full",
        "pillars",
        "content_plan",
        "post",
        "carousel",
        "image",
        "outreach_message",
        "profile_parse",
      ],
      generation_status: ["pending", "success", "failed"],
      payment_provider: ["moneyfusion", "moneroo", "pawapay", "stripe"],
      payment_status: ["pending", "succeeded", "failed", "refunded"],
      plan_slot_status: ["planned", "drafted", "published", "skipped"],
      post_format: ["text", "carousel", "image"],
      post_status: ["draft", "scheduled", "published", "archived"],
      post_tone: ["professional", "conversational", "direct"],
      suggestion_impact: ["low", "medium", "high"],
      user_objective: ["job", "clients", "visibility"],
    },
  },
} as const
