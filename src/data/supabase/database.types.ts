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
      companies: {
        Row: {
          cnpj: string
          created_at: string
          id: string
          name: string
          status: string
        }
        Insert: {
          cnpj: string
          created_at?: string
          id?: string
          name: string
          status?: string
        }
        Update: {
          cnpj?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          company_id: string
          cpf: string
          created_at: string
          id: string
          name: string
          pix_key: string
          pix_key_type: Database["public"]["Enums"]["gestor_pix_key_type"]
          status: Database["public"]["Enums"]["gestor_employee_status"]
          user_id: string | null
        }
        Insert: {
          company_id: string
          cpf: string
          created_at?: string
          id?: string
          name: string
          pix_key: string
          pix_key_type: Database["public"]["Enums"]["gestor_pix_key_type"]
          status?: Database["public"]["Enums"]["gestor_employee_status"]
          user_id?: string | null
        }
        Update: {
          company_id?: string
          cpf?: string
          created_at?: string
          id?: string
          name?: string
          pix_key?: string
          pix_key_type?: Database["public"]["Enums"]["gestor_pix_key_type"]
          status?: Database["public"]["Enums"]["gestor_employee_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          amount_cents: number
          company_id: string
          created_at: string
          employee_id: string
          id: string
          kind: Database["public"]["Enums"]["gestor_ledger_kind"]
          payment_order_id: string | null
          receipt_id: string | null
          return_charge_id: string | null
        }
        Insert: {
          amount_cents: number
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          kind: Database["public"]["Enums"]["gestor_ledger_kind"]
          payment_order_id?: string | null
          receipt_id?: string | null
          return_charge_id?: string | null
        }
        Update: {
          amount_cents?: number
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["gestor_ledger_kind"]
          payment_order_id?: string | null
          receipt_id?: string | null
          return_charge_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_subconta_funcionario"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "ledger_entries_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "v_fila_comprovantes"
            referencedColumns: ["receipt_id"]
          },
          {
            foreignKeyName: "ledger_entries_return_charge_id_fkey"
            columns: ["return_charge_id"]
            isOneToOne: false
            referencedRelation: "return_charges"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          company_id: string
          created_at: string
          employee_id: string | null
          id: string
          role: Database["public"]["Enums"]["gestor_member_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          employee_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["gestor_member_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          employee_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["gestor_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_subconta_funcionario"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      payment_accounts: {
        Row: {
          api_key_ciphertext: string | null
          company_id: string
          created_at: string
          environment: Database["public"]["Enums"]["gestor_payment_environment"]
          external_account_id: string | null
          id: string
          provider: string
          status: string
          webhook_secret_ciphertext: string | null
        }
        Insert: {
          api_key_ciphertext?: string | null
          company_id: string
          created_at?: string
          environment?: Database["public"]["Enums"]["gestor_payment_environment"]
          external_account_id?: string | null
          id?: string
          provider: string
          status?: string
          webhook_secret_ciphertext?: string | null
        }
        Update: {
          api_key_ciphertext?: string | null
          company_id?: string
          created_at?: string
          environment?: Database["public"]["Enums"]["gestor_payment_environment"]
          external_account_id?: string | null
          id?: string
          provider?: string
          status?: string
          webhook_secret_ciphertext?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_accounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount_cents: number
          company_id: string
          created_at: string
          employee_id: string
          external_reference: string
          id: string
          idempotency_key: string
          kind: Database["public"]["Enums"]["gestor_payment_kind"]
          provider_transfer_id: string | null
          status: Database["public"]["Enums"]["gestor_payment_status"]
        }
        Insert: {
          amount_cents: number
          company_id: string
          created_at?: string
          employee_id: string
          external_reference: string
          id?: string
          idempotency_key: string
          kind: Database["public"]["Enums"]["gestor_payment_kind"]
          provider_transfer_id?: string | null
          status?: Database["public"]["Enums"]["gestor_payment_status"]
        }
        Update: {
          amount_cents?: number
          company_id?: string
          created_at?: string
          employee_id?: string
          external_reference?: string
          id?: string
          idempotency_key?: string
          kind?: Database["public"]["Enums"]["gestor_payment_kind"]
          provider_transfer_id?: string | null
          status?: Database["public"]["Enums"]["gestor_payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_subconta_funcionario"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount_approved_cents: number | null
          amount_claimed_cents: number
          category: Database["public"]["Enums"]["gestor_receipt_category"]
          company_id: string
          employee_id: string
          id: string
          place_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["gestor_receipt_status"]
          storage_path: string
          submitted_at: string
        }
        Insert: {
          amount_approved_cents?: number | null
          amount_claimed_cents: number
          category: Database["public"]["Enums"]["gestor_receipt_category"]
          company_id: string
          employee_id: string
          id?: string
          place_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["gestor_receipt_status"]
          storage_path: string
          submitted_at?: string
        }
        Update: {
          amount_approved_cents?: number | null
          amount_claimed_cents?: number
          category?: Database["public"]["Enums"]["gestor_receipt_category"]
          company_id?: string
          employee_id?: string
          id?: string
          place_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["gestor_receipt_status"]
          storage_path?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_subconta_funcionario"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      return_charges: {
        Row: {
          amount_cents: number
          company_id: string
          created_at: string
          employee_id: string
          id: string
          provider_charge_id: string | null
          status: Database["public"]["Enums"]["gestor_charge_status"]
        }
        Insert: {
          amount_cents: number
          company_id: string
          created_at?: string
          employee_id: string
          id?: string
          provider_charge_id?: string | null
          status?: Database["public"]["Enums"]["gestor_charge_status"]
        }
        Update: {
          amount_cents?: number
          company_id?: string
          created_at?: string
          employee_id?: string
          id?: string
          provider_charge_id?: string | null
          status?: Database["public"]["Enums"]["gestor_charge_status"]
        }
        Relationships: [
          {
            foreignKeyName: "return_charges_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_charges_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_charges_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_subconta_funcionario"
            referencedColumns: ["employee_id"]
          },
        ]
      }
    }
    Views: {
      v_fila_comprovantes: {
        Row: {
          amount_claimed_cents: number | null
          category:
            | Database["public"]["Enums"]["gestor_receipt_category"]
            | null
          company_id: string | null
          employee_id: string | null
          employee_name: string | null
          place_note: string | null
          receipt_id: string | null
          storage_path: string | null
          submitted_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "v_subconta_funcionario"
            referencedColumns: ["employee_id"]
          },
        ]
      }
      v_meu_extrato: {
        Row: {
          amount_cents: number | null
          company_id: string | null
          efeito: string | null
          employee_id: string | null
          kind: string | null
          ledger_id: string | null
          occurred_at: string | null
          receipt_id: string | null
          receipt_status:
            | Database["public"]["Enums"]["gestor_receipt_status"]
            | null
        }
        Relationships: []
      }
      v_minha_subconta: {
        Row: {
          baixado_cents: number | null
          company_id: string | null
          em_analise_cents: number | null
          employee_id: string | null
          saldo_cents: number | null
          transferido_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      v_subconta_funcionario: {
        Row: {
          baixado_cents: number | null
          company_id: string | null
          em_analise_cents: number | null
          employee_id: string | null
          employee_name: string | null
          saldo_cents: number | null
          status: Database["public"]["Enums"]["gestor_employee_status"] | null
          transferido_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cadastrar_funcionario: {
        Args: {
          p_cpf: string
          p_name: string
          p_pix_key: string
          p_pix_key_type: string
        }
        Returns: Json
      }
      criar_empresa: { Args: { p_cnpj: string; p_name: string }; Returns: Json }
      gestor_current_membership: {
        Args: never
        Returns: {
          company_id: string
          employee_id: string
          role: Database["public"]["Enums"]["gestor_member_role"]
        }[]
      }
      gestor_saldos: {
        Args: { p_employee_id: string }
        Returns: {
          baixado_cents: number
          em_analise_cents: number
          employee_id: string
          saldo_cents: number
          transferido_cents: number
        }[]
      }
      registrar_adiantamento_teste: {
        Args: {
          p_amount_cents: number
          p_employee_id: string
          p_idempotency_key?: string
        }
        Returns: Json
      }
      review_receipt: {
        Args: { p_approved_cents: number; p_receipt_id: string }
        Returns: Json
      }
      submit_receipt: {
        Args: {
          p_amount_cents: number
          p_category: string
          p_place_note?: string
          p_storage_path: string
        }
        Returns: Json
      }
      vincular_funcionario: {
        Args: { p_employee_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      gestor_charge_status: "pendente" | "paga" | "cancelada" | "falhou"
      gestor_employee_status: "ativo" | "inativo"
      gestor_ledger_kind: "adiantamento" | "reembolso" | "baixa" | "devolucao"
      gestor_member_role: "admin" | "funcionario"
      gestor_payment_environment: "sandbox" | "producao"
      gestor_payment_kind: "adiantamento" | "reembolso"
      gestor_payment_status: "pendente" | "confirmada" | "falhou" | "cancelada"
      gestor_pix_key_type: "cpf" | "cnpj" | "email" | "phone" | "evp"
      gestor_receipt_category:
        | "combustivel"
        | "alimentacao"
        | "pedagio"
        | "hospedagem"
        | "manutencao"
        | "insumos"
        | "frete"
        | "outros"
      gestor_receipt_status: "em_analise" | "aprovado" | "parcial" | "recusado"
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
      gestor_charge_status: ["pendente", "paga", "cancelada", "falhou"],
      gestor_employee_status: ["ativo", "inativo"],
      gestor_ledger_kind: ["adiantamento", "reembolso", "baixa", "devolucao"],
      gestor_member_role: ["admin", "funcionario"],
      gestor_payment_environment: ["sandbox", "producao"],
      gestor_payment_kind: ["adiantamento", "reembolso"],
      gestor_payment_status: ["pendente", "confirmada", "falhou", "cancelada"],
      gestor_pix_key_type: ["cpf", "cnpj", "email", "phone", "evp"],
      gestor_receipt_category: [
        "combustivel",
        "alimentacao",
        "pedagio",
        "hospedagem",
        "manutencao",
        "insumos",
        "frete",
        "outros",
      ],
      gestor_receipt_status: ["em_analise", "aprovado", "parcial", "recusado"],
    },
  },
} as const
