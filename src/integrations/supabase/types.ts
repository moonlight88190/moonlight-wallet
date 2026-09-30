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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          details: Json
          id: string
          target_wallet_id: string | null
          transaction_id: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          details?: Json
          id?: string
          target_wallet_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_wallet_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_target_wallet_id_fkey"
            columns: ["target_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_actions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          created_at: string
          details: Json
          event: string
          id: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          event: string
          id?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          event?: string
          id?: number
          user_id?: string | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          fetched_at: string
          quote: string
          rate: number
          source: string
        }
        Insert: {
          fetched_at?: string
          quote: string
          rate: number
          source?: string
        }
        Update: {
          fetched_at?: string
          quote?: string
          rate?: number
          source?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          amount_usd: number
          balance_after_usd: number
          created_at: string
          entry_type: string
          id: number
          transaction_id: string
          wallet_id: string
        }
        Insert: {
          amount_usd: number
          balance_after_usd: number
          created_at?: string
          entry_type: string
          id?: number
          transaction_id: string
          wallet_id: string
        }
        Update: {
          amount_usd?: number
          balance_after_usd?: number
          created_at?: string
          entry_type?: string
          id?: number
          transaction_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          preferred_currency: string
          region: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string
          full_name?: string
          id: string
          preferred_currency?: string
          region?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          preferred_currency?: string
          region?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          amount_usd: number
          created_at: string
          currency: string
          fee: number
          fee_usd: number
          fx_rate: number | null
          id: string
          kind: string
          method: string
          note: string | null
          recipient_amount: number | null
          recipient_currency: string | null
          recipient_name: string | null
          recipient_wallet_code: string | null
          recipient_wallet_id: string | null
          reference: string
          sender_name: string | null
          sender_wallet_code: string | null
          sender_wallet_id: string | null
          status: string
        }
        Insert: {
          amount: number
          amount_usd: number
          created_at?: string
          currency: string
          fee?: number
          fee_usd?: number
          fx_rate?: number | null
          id?: string
          kind: string
          method?: string
          note?: string | null
          recipient_amount?: number | null
          recipient_currency?: string | null
          recipient_name?: string | null
          recipient_wallet_code?: string | null
          recipient_wallet_id?: string | null
          reference?: string
          sender_name?: string | null
          sender_wallet_code?: string | null
          sender_wallet_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          amount_usd?: number
          created_at?: string
          currency?: string
          fee?: number
          fee_usd?: number
          fx_rate?: number | null
          id?: string
          kind?: string
          method?: string
          note?: string | null
          recipient_amount?: number | null
          recipient_currency?: string | null
          recipient_name?: string | null
          recipient_wallet_code?: string | null
          recipient_wallet_id?: string | null
          reference?: string
          sender_name?: string | null
          sender_wallet_code?: string | null
          sender_wallet_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_recipient_wallet_id_fkey"
            columns: ["recipient_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_sender_wallet_id_fkey"
            columns: ["sender_wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance_usd: number
          created_at: string
          id: string
          status: string
          user_id: string
          wallet_code: string
        }
        Insert: {
          balance_usd?: number
          created_at?: string
          id?: string
          status?: string
          user_id: string
          wallet_code: string
        }
        Update: {
          balance_usd?: number
          created_at?: string
          id?: string
          status?: string
          user_id?: string
          wallet_code?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          amount_usd: number
          created_at: string
          currency: string
          email: string
          fee_usd: number
          full_name: string
          id: string
          method: string
          phone: string | null
          provider: string | null
          reason: string | null
          reference: string
          status: string
          transaction_id: string | null
          updated_at: string
          upi_id: string | null
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          amount_usd: number
          created_at?: string
          currency?: string
          email: string
          fee_usd?: number
          full_name: string
          id?: string
          method: string
          phone?: string | null
          provider?: string | null
          reason?: string | null
          reference?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          upi_id?: string | null
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          amount_usd?: number
          created_at?: string
          currency?: string
          email?: string
          fee_usd?: number
          full_name?: string
          id?: string
          method?: string
          phone?: string | null
          provider?: string | null
          reason?: string | null
          reference?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
          upi_id?: string | null
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_credit: {
        Args: {
          p_actor: string
          p_amount: number
          p_currency: string
          p_reason: string
          p_wallet_code: string
        }
        Returns: string
      }
      admin_debit: {
        Args: {
          p_actor: string
          p_amount: number
          p_currency: string
          p_reason: string
          p_wallet_code: string
        }
        Returns: string
      }
      admin_set_profile_region: {
        Args: { p_actor: string; p_region: string; p_wallet_code: string }
        Returns: undefined
      }
      admin_set_wallet_freeze: {
        Args: {
          p_actor: string
          p_freeze: boolean
          p_reason: string
          p_wallet_code: string
        }
        Returns: undefined
      }
      create_withdrawal: {
        Args: {
          p_amount: number
          p_currency: string
          p_email: string
          p_full_name: string
          p_method: string
          p_phone?: string
          p_provider?: string
          p_reason?: string
          p_upi_id?: string
        }
        Returns: string
      }
      generate_wallet_code: { Args: never; Returns: string }
      lookup_recipient: {
        Args: { p_query: string }
        Returns: {
          full_name: string
          preferred_currency: string
          wallet_code: string
        }[]
      }
      send_transfer: {
        Args: {
          p_amount: number
          p_currency: string
          p_note?: string
          p_recipient_code: string
        }
        Returns: string
      }
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
    Enums: {},
  },
} as const
