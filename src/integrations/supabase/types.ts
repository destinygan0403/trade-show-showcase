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
      app_settings: {
        Row: {
          brand_name: string
          broker_address: string
          broker_qr_url: string
          broker_topup_enabled: boolean
          deposit_bank_beneficiary: string | null
          deposit_bank_name: string | null
          deposit_btc_address: string | null
          deposit_iban: string | null
          deposit_usdt_address: string | null
          id: number
          notification_email: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          brand_name?: string
          broker_address?: string
          broker_qr_url?: string
          broker_topup_enabled?: boolean
          deposit_bank_beneficiary?: string | null
          deposit_bank_name?: string | null
          deposit_btc_address?: string | null
          deposit_iban?: string | null
          deposit_usdt_address?: string | null
          id?: number
          notification_email?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          brand_name?: string
          broker_address?: string
          broker_qr_url?: string
          broker_topup_enabled?: boolean
          deposit_bank_beneficiary?: string | null
          deposit_bank_name?: string | null
          deposit_btc_address?: string | null
          deposit_iban?: string | null
          deposit_usdt_address?: string | null
          id?: number
          notification_email?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          close_price: number | null
          closed_at: string | null
          current_price: number
          id: string
          lot: number
          open_price: number
          opened_at: string
          pl: number
          side: Database["public"]["Enums"]["position_side"]
          stake: number
          status: Database["public"]["Enums"]["position_status"]
          symbol: string
          user_id: string
          verdict: Database["public"]["Enums"]["position_verdict"]
          verdict_amount: number | null
        }
        Insert: {
          close_price?: number | null
          closed_at?: string | null
          current_price: number
          id?: string
          lot: number
          open_price: number
          opened_at?: string
          pl?: number
          side: Database["public"]["Enums"]["position_side"]
          stake?: number
          status?: Database["public"]["Enums"]["position_status"]
          symbol?: string
          user_id: string
          verdict?: Database["public"]["Enums"]["position_verdict"]
          verdict_amount?: number | null
        }
        Update: {
          close_price?: number | null
          closed_at?: string | null
          current_price?: number
          id?: string
          lot?: number
          open_price?: number
          opened_at?: string
          pl?: number
          side?: Database["public"]["Enums"]["position_side"]
          stake?: number
          status?: Database["public"]["Enums"]["position_status"]
          symbol?: string
          user_id?: string
          verdict?: Database["public"]["Enums"]["position_verdict"]
          verdict_amount?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_id: string
          balance: number
          created_at: string
          currency: string
          display_name: string
          email: string
          id: string
          status: string
          total_pl: number
          updated_at: string
          withdrawals_blocked: boolean
        }
        Insert: {
          account_id?: string
          balance?: number
          created_at?: string
          currency?: string
          display_name?: string
          email: string
          id: string
          status?: string
          total_pl?: number
          updated_at?: string
          withdrawals_blocked?: boolean
        }
        Update: {
          account_id?: string
          balance?: number
          created_at?: string
          currency?: string
          display_name?: string
          email?: string
          id?: string
          status?: string
          total_pl?: number
          updated_at?: string
          withdrawals_blocked?: boolean
        }
        Relationships: []
      }
      transactions: {
        Row: {
          admin_note: string | null
          amount: number
          card_last4: string | null
          created_at: string
          currency: string
          destination: string | null
          id: string
          kind: Database["public"]["Enums"]["tx_kind"]
          method: Database["public"]["Enums"]["tx_method"]
          processed_at: string | null
          reference: string | null
          status: Database["public"]["Enums"]["tx_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          card_last4?: string | null
          created_at?: string
          currency?: string
          destination?: string | null
          id?: string
          kind: Database["public"]["Enums"]["tx_kind"]
          method: Database["public"]["Enums"]["tx_method"]
          processed_at?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["tx_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          card_last4?: string | null
          created_at?: string
          currency?: string
          destination?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["tx_kind"]
          method?: Database["public"]["Enums"]["tx_method"]
          processed_at?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["tx_status"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_balance_delta: {
        Args: { _delta: number; _user_id: string }
        Returns: number
      }
      apply_balance_only: {
        Args: { _delta: number; _user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      position_side: "Buy" | "Sell"
      position_status: "open" | "closed"
      position_verdict: "auto" | "force_win" | "force_loss"
      tx_kind: "deposit" | "withdrawal"
      tx_method: "bank_transfer" | "card" | "btc" | "usdt"
      tx_status: "pending" | "approved" | "rejected"
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
    Enums: {
      app_role: ["admin", "user"],
      position_side: ["Buy", "Sell"],
      position_status: ["open", "closed"],
      position_verdict: ["auto", "force_win", "force_loss"],
      tx_kind: ["deposit", "withdrawal"],
      tx_method: ["bank_transfer", "card", "btc", "usdt"],
      tx_status: ["pending", "approved", "rejected"],
    },
  },
} as const
