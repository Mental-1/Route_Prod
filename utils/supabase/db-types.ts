// Database types from Supabase
export type UserStatus =
  | "active"
  | "suspended"
  | "banned"
  | "pending_verification";
export type ListingStatus =
  | "draft"
  | "active"
  | "sold"
  | "expired"
  | "removed"
  | "pending_approval";
export type ListingCondition =
  | "new"
  | "like_new"
  | "good"
  | "fair"
  | "poor"
  | "refurbished";
export type TransactionStatus =
  | "pending"
  | "completed"
  | "cancelled"
  | "refunded"
  | "disputed";
export type TransactionType = "sale" | "purchase" | "subscription" | "refund";
export type PaymentMethod =
  | "mpesa"
  | "paystack"
  | "paypal"
  | "bank_transfer"
  | "cash";
export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "refunded";
export type MessageStatus = "sent" | "delivered" | "read";
export type NotificationType =
  | "message"
  | "listing_update"
  | "payment"
  | "system"
  | "promotion";
export type SubscriptionPlan = "free" | "basic" | "premium" | "enterprise";

export interface Profile {
  id: string;
  full_name?: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  listing_count?: number;
  created_at?: string;
  updated_at?: string;
  authenticated?: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  user_name: string;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  created_at?: string;
}

export interface SubCategory {
  id: number;
  name: string;
  parent_category_id: number;
  icon?: string;
  created_at?: string;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  price?: number;
  location?: string;
  category_id?: number;
  subcategory_id?: number;
  user_id?: string;
  status?: string;
  payment_status?: string;
  plan?: string;
  images: string[];
  views?: number;
  created_at?: string;
  updated_at?: string;
  expiry_date?: string;
  plan_id?: string;
  plan_name?: string;
  latitude?: number;
  longitude?: number;
  condition?: string;
  featured?: boolean;
}

export interface ListingImage {
  id: number;
  listing_id: number;
  url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ListingSpecification {
  id: number;
  listing_id: number;
  name: string;
  value: string;
  created_at: string;
}

export interface SavedListing {
  id: string;
  user_id?: string;
  listing_id?: string;
  created_at?: string;
}

export interface ListingView {
  id: number;
  listing_id: number;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id?: string;
  receiver_id?: string;
  listing_id?: string;
  content?: string;
  read?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Review {
  id: string;
  seller_id: string;
  reviewer_id: string;
  rating: number;
  comment: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  listing_id?: string;
  user_id?: string;
  payment_method: string;
  amount: number;
  status?: string;
  reference?: string;
  phone_number?: string;
  email?: string;
  checkout_request_id?: string;
  merchant_request_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: number;
  transaction_id: number;
  payment_method: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  external_payment_id?: string;
  payment_data?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserSettings {
  id: number;
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
  new_messages: boolean;
  listing_updates: boolean;
  price_alerts: boolean;
  profile_visibility: string;
  show_phone: boolean;
  show_email: boolean;
  show_last_seen: boolean;
  language: string;
  currency: string;
  timezone: string;
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanDetails {
  id: number;
  name: SubscriptionPlan;
  display_name: string;
  description?: string;
  price: number;
  currency: string;
  billing_period: string;
  max_listings?: number;
  max_images_per_listing?: number;
  video_uploads: boolean;
  featured_listings: boolean;
  priority_support: boolean;
  analytics: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: number;
  user_id: string;
  plan_id: number;
  status: string;
  starts_at: string;
  ends_at?: string;
  auto_renew: boolean;
  payment_method?: PaymentMethod;
  external_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: number;
  reporter_id: string;
  reported_user_id?: string;
  reported_listing_id?: number;
  reason: string;
  description?: string;
  status: string;
  admin_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SearchHistory {
  id: number;
  user_id?: string;
  query: string;
  filters?: Record<string, any>;
  results_count?: number;
  ip_address?: string;
  created_at: string;
}

export interface AdminLog {
  id: number;
  admin_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  created_at?: string;
  updated_at?: string;
  features?: any;
  duration: number;
  user_id?: string;
  max_listings: number;
}

// View types
export interface ActiveListingView extends Omit<Listing, "images"> {
  seller_username: string;
  seller_name: string;
  seller_avatar?: string;
  seller_rating: number;
  seller_reviews: number;
  category_name: string;
  category_slug: string;
  subcategory_name?: string;
  subcategory_slug?: string;
  images?: ListingImage[];
  specifications?: ListingSpecification[];
}

export interface UserDashboardStats {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  rating: number;
  reviews_count: number;
  total_sales: number;
  total_purchases: number;
  member_since: string;
  active_listings: number;
  sold_listings: number;
  expired_listings: number;
  total_views: number;
  total_saves: number;
  unread_notifications: number;
  unread_messages: number;
}

export interface PopularCategory extends Category {
  listing_count: number;
  avg_price: number;
  min_price: number;
  max_price: number;
}

export interface RecentTransactionView extends Transaction {
  buyer_username: string;
  buyer_name: string;
  seller_username: string;
  seller_name: string;
  listing_title: string;
  listing_price: number;
}

export interface TrendingListing {
  id: string;
  title: string;
  price: number;
  location: string;
  category_name: string;
  images: string[];
  views: number;
  created_at: string;
}

export interface ListingWithDetails extends Listing {
  category?: Category;
  subcategory?: SubCategory;
  profile?: Profile;
}

export interface MessageWithDetails extends Message {
  sender?: Profile;
  receiver?: Profile;
  listing?: Listing;
}

export interface UserStats {
  total_listings: number;
  active_listings: number;
  total_views: number;
  avg_rating: number;
  total_reviews: number;
}

export interface SearchFilters {
  query?: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  location?: string;
  condition?: string;
}
// Main Database type for Supabase
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id">>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, "id" | "created_at">;
        Update: Partial<Omit<Category, "id">>;
      };
      subcategories: {
        Row: SubCategory;
        Insert: Omit<SubCategory, "id" | "created_at">;
        Update: Partial<Omit<SubCategory, "id">>;
      };
      listings: {
        Row: Listing;
        Insert: Omit<Listing, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Listing, "id">>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Message, "id">>;
      };
      // Add more tables as needed
    };
  };
}
