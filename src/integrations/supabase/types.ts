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
      external_investments: {
        Row: {
          amount: number
          created_at: string | null
          id: number
          investment_name: string
          investment_type: Database["public"]["Enums"]["investment_type"]
          notes: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: never
          investment_name: string
          investment_type: Database["public"]["Enums"]["investment_type"]
          notes?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: never
          investment_name?: string
          investment_type?: Database["public"]["Enums"]["investment_type"]
          notes?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      future_expenses: {
        Row: {
          amount: number
          created_at: string | null
          id: number
          notes: string | null
          priority: Database["public"]["Enums"]["priority_enum"]
          purpose: Database["public"]["Enums"]["future_expense_enumm"]
          timeframe: Database["public"]["Enums"]["timeframe_enum"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: number
          notes?: string | null
          priority: Database["public"]["Enums"]["priority_enum"]
          purpose: Database["public"]["Enums"]["future_expense_enumm"]
          timeframe: Database["public"]["Enums"]["timeframe_enum"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: number
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_enum"]
          purpose?: Database["public"]["Enums"]["future_expense_enumm"]
          timeframe?: Database["public"]["Enums"]["timeframe_enum"]
          user_id?: string
        }
        Relationships: []
      }
      personal_info: {
        Row: {
          age: number
          city: string
          created_at: string | null
          financial_goals: string[]
          id: string
          risk_tolerance: Database["public"]["Enums"]["risk_tolerance_enum"]
          user_id: string | null
        }
        Insert: {
          age: number
          city: string
          created_at?: string | null
          financial_goals: string[]
          id: string
          risk_tolerance: Database["public"]["Enums"]["risk_tolerance_enum"]
          user_id?: string | null
        }
        Update: {
          age?: number
          city?: string
          created_at?: string | null
          financial_goals?: string[]
          id?: string
          risk_tolerance?: Database["public"]["Enums"]["risk_tolerance_enum"]
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          additional_info: string | null
          created_at: string | null
          id: number
          user_id: string | null
        }
        Insert: {
          additional_info?: string | null
          created_at?: string | null
          id?: never
          user_id?: string | null
        }
        Update: {
          additional_info?: string | null
          created_at?: string | null
          id?: never
          user_id?: string | null
        }
        Relationships: []
      }
      regular_expenses: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          expense_type: Database["public"]["Enums"]["expense_type_enum"]
          frequency: Database["public"]["Enums"]["expense_frequency_enum"]
          id: number
          notes: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          expense_type: Database["public"]["Enums"]["expense_type_enum"]
          frequency: Database["public"]["Enums"]["expense_frequency_enum"]
          id?: number
          notes?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          expense_type?: Database["public"]["Enums"]["expense_type_enum"]
          frequency?: Database["public"]["Enums"]["expense_frequency_enum"]
          id?: number
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      zerodha_credentials: {
        Row: {
          created_at: string | null
          id: number
          user_id: string | null
          zerodha_user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          user_id?: string | null
          zerodha_user_id: string
        }
        Update: {
          created_at?: string | null
          id?: never
          user_id?: string | null
          zerodha_user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      expense_frequency_enum: "Monthly" | "Quarterly" | "Yearly" | "One-time"
      expense_type_enum:
        | "EMI"
        | "Rent"
        | "School Fees"
        | "Loan Payment"
        | "Insurance Premium"
        | "Utility Bills"
        | "Medical"
        | "Others"
      future_expense_enumm:
        | "House Purchase"
        | "Car Purchase"
        | "Education"
        | "Wedding"
        | "Medical Treatment"
        | "Vacation"
        | "Home Renovation"
        | "Business Startup"
        | "Other"
      investment_type:
        | "Gold"
        | "Fixed Deposit"
        | "Real Estate"
        | "Bank Deposit"
        | "PPF"
        | "EPF"
        | "National Pension Scheme"
        | "Bonds"
        | "Others"
      priority_enum: "Low" | "Medium" | "High"
      risk_tolerance_enum:
        | "low - safety first"
        | "medium - balanced apporach"
        | "high - growth focused"
      timeframe_enum:
        | "3 months"
        | "6 months"
        | "1 year"
        | "2 years"
        | "5 years"
        | "10 years"
        | "Other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      expense_frequency_enum: ["Monthly", "Quarterly", "Yearly", "One-time"],
      expense_type_enum: [
        "EMI",
        "Rent",
        "School Fees",
        "Loan Payment",
        "Insurance Premium",
        "Utility Bills",
        "Medical",
        "Others",
      ],
      future_expense_enumm: [
        "House Purchase",
        "Car Purchase",
        "Education",
        "Wedding",
        "Medical Treatment",
        "Vacation",
        "Home Renovation",
        "Business Startup",
        "Other",
      ],
      investment_type: [
        "Gold",
        "Fixed Deposit",
        "Real Estate",
        "Bank Deposit",
        "PPF",
        "EPF",
        "National Pension Scheme",
        "Bonds",
        "Others",
      ],
      priority_enum: ["Low", "Medium", "High"],
      risk_tolerance_enum: [
        "low - safety first",
        "medium - balanced apporach",
        "high - growth focused",
      ],
      timeframe_enum: [
        "3 months",
        "6 months",
        "1 year",
        "2 years",
        "5 years",
        "10 years",
        "Other",
      ],
    },
  },
} as const
