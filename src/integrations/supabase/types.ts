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
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          admin_notes: string | null
          age: number | null
          complaint: string | null
          consultation_type: string
          created_at: string
          customer_id: string | null
          email: string | null
          fee: number | null
          gender: string | null
          id: string
          patient_name: string
          phone: string
          preferred_date: string
          preferred_time: string
          status: string
          ticket_number: string
          updated_at: string
          visitor_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          age?: number | null
          complaint?: string | null
          consultation_type: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          fee?: number | null
          gender?: string | null
          id?: string
          patient_name: string
          phone: string
          preferred_date: string
          preferred_time: string
          status?: string
          ticket_number: string
          updated_at?: string
          visitor_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          age?: number | null
          complaint?: string | null
          consultation_type?: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          fee?: number | null
          gender?: string | null
          id?: string
          patient_name?: string
          phone?: string
          preferred_date?: string
          preferred_time?: string
          status?: string
          ticket_number?: string
          updated_at?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
          tone: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          tone?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          tone?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          last_seen_at: string
          name: string
          notes: string | null
          phone: string
          visitor_ids: string[]
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_seen_at?: string
          name: string
          notes?: string | null
          phone: string
          visitor_ids?: string[]
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_seen_at?: string
          name?: string
          notes?: string | null
          phone?: string
          visitor_ids?: string[]
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string
          product_id: string | null
          source: string
          status: string
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone: string
          product_id?: string | null
          source?: string
          status?: string
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string
          product_id?: string | null
          source?: string
          status?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Update: {
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          admin_notes: string | null
          city: string
          created_at: string
          customer_id: string | null
          customer_name: string
          delivery_fee: number
          email: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string
          payment_reference: string | null
          payment_status: string
          phone: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          visitor_id: string | null
        }
        Insert: {
          address: string
          admin_notes?: string | null
          city: string
          created_at?: string
          customer_id?: string | null
          customer_name: string
          delivery_fee: number
          email?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method: string
          payment_reference?: string | null
          payment_status?: string
          phone: string
          status?: string
          subtotal: number
          total: number
          updated_at?: string
          visitor_id?: string | null
        }
        Update: {
          address?: string
          admin_notes?: string | null
          city?: string
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          delivery_fee?: number
          email?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_reference?: string | null
          payment_status?: string
          phone?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_events: {
        Row: {
          created_at: string
          event: string
          id: number
          product_id: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: never
          product_id: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: never
          product_id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          description: string | null
          dosage: string | null
          id: string
          image_url: string | null
          ingredients: string | null
          is_active: boolean
          is_featured: boolean
          name: string
          price: number
          short_description: string | null
          size: string | null
          slug: string
          sort_order: number
          stock: number
          updated_at: string
          uses: string[]
        }
        Insert: {
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          price: number
          short_description?: string | null
          size?: string | null
          slug: string
          sort_order?: number
          stock?: number
          updated_at?: string
          uses?: string[]
        }
        Update: {
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          description?: string | null
          dosage?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price?: number
          short_description?: string | null
          size?: string | null
          slug?: string
          sort_order?: number
          stock?: number
          updated_at?: string
          uses?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          city: string | null
          comment: string
          created_at: string
          id: string
          name: string
          product_id: string | null
          rating: number
          status: string
        }
        Insert: {
          city?: string | null
          comment: string
          created_at?: string
          id?: string
          name: string
          product_id?: string | null
          rating: number
          status?: string
        }
        Update: {
          city?: string | null
          comment?: string
          created_at?: string
          id?: string
          name?: string
          product_id?: string | null
          rating?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      admin_customer_interests: {
        Args: { p_customer_id: string }
        Returns: {
          carts: number
          inquiries: number
          last_seen: string
          name: string
          product_id: string
          purchases: number
          views: number
          whatsapp: number
        }[]
      }
      admin_hot_leads: {
        Args: { p_days?: number }
        Returns: {
          carts: number
          customer_id: string
          customer_name: string
          last_seen: string
          phone: string
          product_id: string
          product_name: string
          views: number
        }[]
      }
      admin_product_insights: {
        Args: { p_days?: number }
        Returns: {
          carts: number
          image_url: string
          inquiries: number
          name: string
          product_id: string
          purchases: number
          views: number
          whatsapp: number
        }[]
      }
      book_appointment: {
        Args: {
          p_age: number
          p_complaint: string
          p_date: string
          p_email: string
          p_gender: string
          p_name: string
          p_phone: string
          p_time: string
          p_type: string
          p_visitor: string
        }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      normalize_phone: { Args: { p: string }; Returns: string }
      place_order: {
        Args: {
          p_address: string
          p_city: string
          p_email: string
          p_items: Json
          p_name: string
          p_notes: string
          p_payment_method: string
          p_payment_reference: string
          p_phone: string
          p_visitor: string
        }
        Returns: Json
      }
      submit_lead: {
        Args: {
          p_email: string
          p_message: string
          p_name: string
          p_phone: string
          p_product_id: string
          p_source: string
          p_visitor: string
        }
        Returns: boolean
      }
      submit_review: {
        Args: {
          p_city: string
          p_comment: string
          p_name: string
          p_product_id: string
          p_rating: number
        }
        Returns: boolean
      }
      track_order: {
        Args: { p_order_number: string; p_phone: string }
        Returns: Json
      }
      track_product_event: {
        Args: { p_event: string; p_product_id: string; p_visitor: string }
        Returns: undefined
      }
      upsert_customer: {
        Args: {
          p_address: string
          p_city: string
          p_email: string
          p_name: string
          p_phone: string
          p_visitor: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "staff"
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
      app_role: ["admin", "staff"],
    },
  },
} as const
