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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      catalog_items: {
        Row: {
          barcode: string | null
          brand: string | null
          category: string
          created_at: string
          id: string
          image_url: string | null
          is_perishable: boolean
          is_returnable: boolean
          name: string
          region: string | null
          subcategory: string | null
          suggested_price: number | null
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_perishable?: boolean
          is_returnable?: boolean
          name: string
          region?: string | null
          subcategory?: string | null
          suggested_price?: number | null
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_perishable?: boolean
          is_returnable?: boolean
          name?: string
          region?: string | null
          subcategory?: string | null
          suggested_price?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          availability_status: string
          effective_price: number | null
          flagged_at: string | null
          id: string
          item_name: string
          order_id: string
          price_at_purchase: number
          qty: number
          resolved_at: string | null
          store_listing_id: string
          substitute_listing_id: string | null
        }
        Insert: {
          availability_status?: string
          effective_price?: number | null
          flagged_at?: string | null
          id?: string
          item_name: string
          order_id: string
          price_at_purchase: number
          qty: number
          resolved_at?: string | null
          store_listing_id: string
          substitute_listing_id?: string | null
        }
        Update: {
          availability_status?: string
          effective_price?: number | null
          flagged_at?: string | null
          id?: string
          item_name?: string
          order_id?: string
          price_at_purchase?: number
          qty?: number
          resolved_at?: string | null
          store_listing_id?: string
          substitute_listing_id?: string | null
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
            foreignKeyName: "order_items_store_listing_id_fkey"
            columns: ["store_listing_id"]
            isOneToOne: false
            referencedRelation: "store_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_substitute_listing_id_fkey"
            columns: ["substitute_listing_id"]
            isOneToOne: false
            referencedRelation: "store_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          authorized_amount: number | null
          captured_at: string | null
          commission_amount: number
          created_at: string
          customer_id: string
          delivery_fee: number
          delivery_tier: string | null
          dispatch_at: string | null
          fulfillment_type: string
          id: string
          ready_at: string | null
          service_fee: number
          status: string
          store_id: string
          stripe_payment_intent_id: string | null
          subtotal: number
          total: number
          uber_delivery_id: string | null
          updated_at: string
        }
        Insert: {
          authorized_amount?: number | null
          captured_at?: string | null
          commission_amount?: number
          created_at?: string
          customer_id: string
          delivery_fee?: number
          delivery_tier?: string | null
          dispatch_at?: string | null
          fulfillment_type: string
          id?: string
          ready_at?: string | null
          service_fee?: number
          status?: string
          store_id: string
          stripe_payment_intent_id?: string | null
          subtotal: number
          total: number
          uber_delivery_id?: string | null
          updated_at?: string
        }
        Update: {
          authorized_amount?: number | null
          captured_at?: string | null
          commission_amount?: number
          created_at?: string
          customer_id?: string
          delivery_fee?: number
          delivery_tier?: string | null
          dispatch_at?: string | null
          fulfillment_type?: string
          id?: string
          ready_at?: string | null
          service_fee?: number
          status?: string
          store_id?: string
          stripe_payment_intent_id?: string | null
          subtotal?: number
          total?: number
          uber_delivery_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string | null
          status: string
          store_id: string
          stripe_transfer_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id?: string | null
          status?: string
          store_id: string
          stripe_transfer_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          status?: string
          store_id?: string
          stripe_transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          order_id: string
          rating: number
          store_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          rating: number
          store_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          rating?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_listings: {
        Row: {
          catalog_item_id: string | null
          created_at: string
          custom_category: string | null
          custom_image_url: string | null
          custom_name: string | null
          id: string
          is_active: boolean
          is_perishable: boolean
          is_returnable: boolean
          low_stock_threshold: number
          price: number
          stock_qty: number
          store_id: string
        }
        Insert: {
          catalog_item_id?: string | null
          created_at?: string
          custom_category?: string | null
          custom_image_url?: string | null
          custom_name?: string | null
          id?: string
          is_active?: boolean
          is_perishable?: boolean
          is_returnable?: boolean
          low_stock_threshold?: number
          price: number
          stock_qty?: number
          store_id: string
        }
        Update: {
          catalog_item_id?: string | null
          created_at?: string
          custom_category?: string | null
          custom_image_url?: string | null
          custom_name?: string | null
          id?: string
          is_active?: boolean
          is_perishable?: boolean
          is_returnable?: boolean
          low_stock_threshold?: number
          price?: number
          stock_qty?: number
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_listings_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_listings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_performance_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          order_id: string | null
          store_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          order_id?: string | null
          store_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          order_id?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_performance_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_performance_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string
          business_license_number: string | null
          business_license_status: string
          business_registration_doc_path: string | null
          certificate_of_insurance_path: string | null
          commission_rate: number
          created_at: string
          description: string | null
          food_handler_cert_path: string | null
          google_place_id: string | null
          google_places_address: string | null
          google_places_match_status: string | null
          google_places_name: string | null
          hst_number: string | null
          id: string
          is_active: boolean
          lat: number | null
          lng: number | null
          name: string
          ontario_corp_number: string | null
          owner_id: string
          phone: string | null
          strike_count: number
          stripe_connect_account_id: string | null
          stripe_connect_onboarded: boolean
          suspension_level: string
          vendor_agreement_accepted_at: string | null
          verified: boolean
        }
        Insert: {
          address: string
          business_license_number?: string | null
          business_license_status?: string
          business_registration_doc_path?: string | null
          certificate_of_insurance_path?: string | null
          commission_rate?: number
          created_at?: string
          description?: string | null
          food_handler_cert_path?: string | null
          google_place_id?: string | null
          google_places_address?: string | null
          google_places_match_status?: string | null
          google_places_name?: string | null
          hst_number?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name: string
          ontario_corp_number?: string | null
          owner_id: string
          phone?: string | null
          strike_count?: number
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean
          suspension_level?: string
          vendor_agreement_accepted_at?: string | null
          verified?: boolean
        }
        Update: {
          address?: string
          business_license_number?: string | null
          business_license_status?: string
          business_registration_doc_path?: string | null
          certificate_of_insurance_path?: string | null
          commission_rate?: number
          created_at?: string
          description?: string | null
          food_handler_cert_path?: string | null
          google_place_id?: string | null
          google_places_address?: string | null
          google_places_match_status?: string | null
          google_places_name?: string | null
          hst_number?: string | null
          id?: string
          is_active?: boolean
          lat?: number | null
          lng?: number | null
          name?: string
          ontario_corp_number?: string | null
          owner_id?: string
          phone?: string | null
          strike_count?: number
          stripe_connect_account_id?: string | null
          stripe_connect_onboarded?: boolean
          suspension_level?: string
          vendor_agreement_accepted_at?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          phone_verified: boolean
          role: string
          terms_accepted_at: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          phone_verified?: boolean
          role: string
          terms_accepted_at?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean
          role?: string
          terms_accepted_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_late_packing: { Args: never; Returns: undefined }
      decrement_listing_stock: {
        Args: { p_listing_id: string; p_qty: number }
        Returns: undefined
      }
      find_similar_catalog_items: {
        Args: { match_limit?: number; match_threshold?: number; search: string }
        Returns: {
          brand: string
          category: string
          id: string
          name: string
          similarity: number
          subcategory: string
          suggested_price: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      recalculate_commission_rates: { Args: never; Returns: undefined }
      record_performance_event: {
        Args: { p_event_type: string; p_order_id: string; p_store_id: string }
        Returns: undefined
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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

// Convenience aliases used across the app.
export type UserRole = "customer" | "store_owner" | "admin"
export type OrderStatus =
  | "placed"
  | "packing"
  | "courier_assigned"
  | "picked_up"
  | "delivered"
  | "completed"
  | "cancelled"
export type FulfillmentType = "pickup" | "delivery"
export type DeliveryTier = "regular" | "priority"
export type BusinessLicenseStatus = "pending" | "verified" | "rejected"
export type PayoutStatus = "pending" | "paid" | "failed"
export type GooglePlacesMatchStatus = "matched" | "mismatch" | "not_found" | "error"
export type AvailabilityStatus = "available" | "flagged" | "resolved_substitute" | "resolved_refund"
export type SuspensionLevel = "none" | "warning" | "suspended" | "deactivated"
export type PerformanceEventType = "late_packing" | "cancellation" | "stockout"
