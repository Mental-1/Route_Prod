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
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: number
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: number
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          encryption_key: string
          id: string
          listing_id: string | null
          seller_id: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string | null
          encryption_key: string
          id?: string
          listing_id?: string | null
          seller_id?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string | null
          encryption_key?: string
          id?: string
          listing_id?: string | null
          seller_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      encrypted_messages: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          encrypted_content: string
          id: string
          iv: string
          message_type: string | null
          read_at: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          encrypted_content: string
          id?: string
          iv: string
          message_type?: string | null
          read_at?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          encrypted_content?: string
          id?: string
          iv?: string
          message_type?: string | null
          read_at?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "encrypted_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encrypted_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          category_id: number | null
          condition: string | null
          created_at: string | null
          description: string
          expiry_date: string | null
          featured: boolean | null
          featured_tier: string | null
          featured_until: string | null
          id: string
          images: string[] | null
          latitude: number | null
          location: string | null
          longitude: number | null
          payment_status: string | null
          plan: string | null
          plan_id: string | null
          plan_name: string | null
          price: number | null
          status: string | null
          subcategory_id: number | null
          title: string
          updated_at: string | null
          user_id: string | null
          views: number | null
        }
        Insert: {
          category_id?: number | null
          condition?: string | null
          created_at?: string | null
          description: string
          expiry_date?: string | null
          featured?: boolean | null
          featured_tier?: string | null
          featured_until?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          payment_status?: string | null
          plan?: string | null
          plan_id?: string | null
          plan_name?: string | null
          price?: number | null
          status?: string | null
          subcategory_id?: number | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          views?: number | null
        }
        Update: {
          category_id?: number | null
          condition?: string | null
          created_at?: string | null
          description?: string
          expiry_date?: string | null
          featured?: boolean | null
          featured_tier?: string | null
          featured_until?: string | null
          id?: string
          images?: string[] | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          payment_status?: string | null
          plan?: string | null
          plan_id?: string | null
          plan_name?: string | null
          price?: number | null
          status?: string | null
          subcategory_id?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          listing_id: string | null
          read: boolean | null
          receiver_id: string | null
          sender_id: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string | null
          read?: boolean | null
          receiver_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string | null
          read?: boolean | null
          receiver_id?: string | null
          sender_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          duration: number
          features: Json | null
          id: string
          max_listings: number | null
          name: string
          price: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration: number
          features?: Json | null
          id?: string
          max_listings?: number | null
          name: string
          price: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration?: number
          features?: Json | null
          id?: string
          max_listings?: number | null
          name?: string
          price?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          authenticated: boolean | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string | null
          email: string | null
          email_notifications: boolean | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          listing_count: number | null
          location: string | null
          nationality: string | null
          phone: string | null
          phone_verified: boolean | null
          push_notifications: boolean | null
          updated_at: string | null
          user_name: string
        }
        Insert: {
          authenticated?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          email_notifications?: boolean | null
          email_verified?: boolean | null
          full_name?: string | null
          id: string
          listing_count?: number | null
          location?: string | null
          nationality?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_name: string
        }
        Update: {
          authenticated?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          email_notifications?: boolean | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          listing_count?: number | null
          location?: string | null
          nationality?: string | null
          phone?: string | null
          phone_verified?: boolean | null
          push_notifications?: boolean | null
          updated_at?: string | null
          user_name?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          rating: number
          reviewer_id: string
          seller_id: string
          updated_at: string | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          rating: number
          reviewer_id: string
          seller_id: string
          updated_at?: string | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          rating?: number
          reviewer_id?: string
          seller_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_listings: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: number
          name: string
          parent_category_id: number
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: number
          name: string
          parent_category_id: number
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: number
          name?: string
          parent_category_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          checkout_request_id: string | null
          created_at: string | null
          email: string | null
          id: string
          listing_id: string | null
          merchant_request_id: string | null
          payment_method: string
          phone_number: string | null
          reference: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          checkout_request_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          listing_id?: string | null
          merchant_request_id?: string | null
          payment_method: string
          phone_number?: string | null
          reference?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          checkout_request_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          listing_id?: string | null
          merchant_request_id?: string | null
          payment_method?: string
          phone_number?: string | null
          reference?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_delete_listing: {
        Args: { listing_uuid: string }
        Returns: boolean
      }
      can_edit_listing: {
        Args: { listing_uuid: string }
        Returns: boolean
      }
      can_feature_listing: {
        Args: { user_uuid: string; listing_uuid: string }
        Returns: boolean
      }
      feature_listing: {
        Args: { listing_uuid: string; duration_days?: number }
        Returns: boolean
      }
      get_or_create_conversation: {
        Args: {
          p_listing_id: string
          p_buyer_id: string
          p_seller_id: string
          p_encryption_key: string
        }
        Returns: string
      }
      handle_expired_listings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      search_listings: {
        Args: {
          search_query?: string
          category_filter?: number
          subcategory_filter?: number
          location_filter?: string
          min_price_filter?: number
          max_price_filter?: number
          condition_filter?: string
          user_lat?: number
          user_lng?: number
          radius_km?: number
          sort_by?: string
          page_limit?: number
          page_offset?: number
        }
        Returns: {
          id: string
          title: string
          description: string
          price: number
          location: string
          latitude: number
          longitude: number
          condition: string
          featured: boolean
          images: string[]
          views: number
          created_at: string
          updated_at: string
          category_id: number
          category_name: string
          subcategory_id: number
          subcategory_name: string
          user_id: string
          seller_name: string
          seller_username: string
          seller_avatar: string
          distance_km: number
        }[]
      }
      unfeature_expired_listings: {
        Args: Record<PropertyKey, never>
        Returns: number
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
    Enums: {},
  },
} as const
