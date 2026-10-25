// Types générés à partir des migrations SQL (supabase/migrations/*.sql).
// À régénérer avec `supabase gen types typescript --local > src/lib/database.types.ts`
// une fois la base liée.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserObjective = 'job' | 'clients' | 'visibility';

export type CreditReason =
  'signup_grant' | 'purchase' | 'generation_debit' | 'refund' | 'manual_adjust';

export type PaymentProvider = 'moneyfusion' | 'moneroo' | 'pawapay' | 'stripe';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export type GenerationKind =
  | 'audit'
  | 'block_rewrite'
  | 'profile_full'
  | 'pillars'
  | 'content_plan'
  | 'post'
  | 'carousel'
  | 'image'
  | 'outreach_message';
export type GenerationStatus = 'pending' | 'success' | 'failed';

export type SuggestionImpact = 'low' | 'medium' | 'high';

export type PostFormat = 'text' | 'carousel' | 'image';
export type PlanSlotStatus = 'planned' | 'drafted' | 'published' | 'skipped';
export type PostTone = 'professional' | 'conversational' | 'direct';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived';
export type AssetKind = 'carousel' | 'image';

export type ContactStatus = 'contacted' | 'replied' | 'in_discussion' | 'closed';
export type ContactMessageKind = 'connection_note' | 'follow_up' | 'reminder';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          country: string | null;
          objective: UserObjective | null;
          credits_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          country?: string | null;
          objective?: UserObjective | null;
          credits_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          country?: string | null;
          objective?: UserObjective | null;
          credits_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          delta: number;
          reason: CreditReason;
          ref_id: string | null;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          delta: number;
          reason: CreditReason;
          ref_id?: string | null;
          balance_after?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          delta?: number;
          reason?: CreditReason;
          ref_id?: string | null;
          balance_after?: number;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          provider: PaymentProvider;
          provider_ref: string;
          amount: number;
          currency: string;
          credits: number;
          status: PaymentStatus;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: PaymentProvider;
          provider_ref: string;
          amount: number;
          currency?: string;
          credits: number;
          status?: PaymentStatus;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: PaymentProvider;
          provider_ref?: string;
          amount?: number;
          currency?: string;
          credits?: number;
          status?: PaymentStatus;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      generations: {
        Row: {
          id: string;
          user_id: string;
          kind: GenerationKind;
          status: GenerationStatus;
          cost_credits: number;
          tokens_in: number | null;
          tokens_out: number | null;
          error: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: GenerationKind;
          status?: GenerationStatus;
          cost_credits?: number;
          tokens_in?: number | null;
          tokens_out?: number | null;
          error?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: GenerationKind;
          status?: GenerationStatus;
          cost_credits?: number;
          tokens_in?: number | null;
          tokens_out?: number | null;
          error?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      strategic_profiles: {
        Row: {
          user_id: string;
          headline: string | null;
          about: string | null;
          offer: string | null;
          target_audience: string | null;
          voice: Json;
          raw_source: Json | null;
          completeness: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          headline?: string | null;
          about?: string | null;
          offer?: string | null;
          target_audience?: string | null;
          voice?: Json;
          raw_source?: Json | null;
          completeness?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          headline?: string | null;
          about?: string | null;
          offer?: string | null;
          target_audience?: string | null;
          voice?: Json;
          raw_source?: Json | null;
          completeness?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      experiences: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          company: string | null;
          start_date: string | null;
          end_date: string | null;
          description: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          company?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          description?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          company?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          description?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      proofs: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          value: string | null;
          context: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          value?: string | null;
          context?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          value?: string | null;
          context?: string | null;
          source?: string | null;
          created_at?: string;
        };
      };
      audits: {
        Row: {
          id: string;
          user_id: string;
          score_global: number | null;
          scores: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          score_global?: number | null;
          scores?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          score_global?: number | null;
          scores?: Json;
          created_at?: string;
        };
      };
      audit_suggestions: {
        Row: {
          id: string;
          user_id: string;
          audit_id: string;
          block: string;
          variant_index: number;
          content: string;
          impact: SuggestionImpact;
          applied: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          audit_id: string;
          block: string;
          variant_index?: number;
          content: string;
          impact?: SuggestionImpact;
          applied?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          audit_id?: string;
          block?: string;
          variant_index?: number;
          content?: string;
          impact?: SuggestionImpact;
          applied?: boolean;
          created_at?: string;
        };
      };
      content_pillars: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      content_plans: {
        Row: {
          id: string;
          user_id: string;
          horizon: 30 | 60 | 90;
          start_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          horizon: 30 | 60 | 90;
          start_date: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          horizon?: 30 | 60 | 90;
          start_date?: string;
          created_at?: string;
        };
      };
      plan_slots: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          scheduled_date: string;
          pillar_id: string | null;
          format: PostFormat;
          angle: string | null;
          status: PlanSlotStatus;
          post_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          scheduled_date: string;
          pillar_id?: string | null;
          format: PostFormat;
          angle?: string | null;
          status?: PlanSlotStatus;
          post_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          scheduled_date?: string;
          pillar_id?: string | null;
          format?: PostFormat;
          angle?: string | null;
          status?: PlanSlotStatus;
          post_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          slot_id: string | null;
          pillar_id: string | null;
          body: string | null;
          tone: PostTone | null;
          status: PostStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slot_id?: string | null;
          pillar_id?: string | null;
          body?: string | null;
          tone?: PostTone | null;
          status?: PostStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slot_id?: string | null;
          pillar_id?: string | null;
          body?: string | null;
          tone?: PostTone | null;
          status?: PostStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      assets: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          kind: AssetKind;
          storage_path: string;
          meta: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          kind: AssetKind;
          storage_path: string;
          meta?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string | null;
          kind?: AssetKind;
          storage_path?: string;
          meta?: Json;
          created_at?: string;
        };
      };
      targets: {
        Row: {
          user_id: string;
          job_titles: string[];
          sectors: string[];
          countries: string[];
          company_sizes: string[];
          saved_queries: Json;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          job_titles?: string[];
          sectors?: string[];
          countries?: string[];
          company_sizes?: string[];
          saved_queries?: Json;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          job_titles?: string[];
          sectors?: string[];
          countries?: string[];
          company_sizes?: string[];
          saved_queries?: Json;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          headline: string | null;
          company: string | null;
          profile_url: string | null;
          status: ContactStatus;
          next_followup_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          headline?: string | null;
          company?: string | null;
          profile_url?: string | null;
          status?: ContactStatus;
          next_followup_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          headline?: string | null;
          company?: string | null;
          profile_url?: string | null;
          status?: ContactStatus;
          next_followup_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contact_messages: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string;
          kind: ContactMessageKind;
          body: string;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contact_id: string;
          kind: ContactMessageKind;
          body: string;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contact_id?: string;
          kind?: ContactMessageKind;
          body?: string;
          sent_at?: string | null;
          created_at?: string;
        };
      };
    };
    Enums: {
      user_objective: UserObjective;
      credit_reason: CreditReason;
      payment_provider: PaymentProvider;
      payment_status: PaymentStatus;
      generation_kind: GenerationKind;
      generation_status: GenerationStatus;
      suggestion_impact: SuggestionImpact;
      post_format: PostFormat;
      plan_slot_status: PlanSlotStatus;
      post_tone: PostTone;
      post_status: PostStatus;
      asset_kind: AssetKind;
      contact_status: ContactStatus;
      contact_message_kind: ContactMessageKind;
    };
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
