export interface AdFormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price: string;
  negotiable: boolean;
  condition: "new" | "used" | "like_new" | "refurbished" | "";
  location: string;
  latitude?: number;
  longitude?: number;
  mediaUrls: string[];
  paymentTier: string;
  paymentMethod: string;
  phoneNumber: string;
  email: string;
}

export interface AdDetailsFormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price: string;
  negotiable: boolean;
  condition: "new" | "used" | "like_new" | "refurbished" | "";
  location: string;
  latitude?: number;
  longitude?: number;
}

export interface ActionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string>;
  message?: string;
}

export interface ListingCreateData {
  title: string;
  description: string;
  price: number;
  category_id: number;
  subcategory_id?: number;
  condition: string;
  location: string;
  latitude?: number;
  longitude?: number;
  negotiable: boolean;
  images: string[];
  user_id: string;
  status: string;
  payment_status: string;
  plan: string;
  views: number;
  created_at: string;
  updated_at: string;
  expiry_date: string;
}

// Type for the validated form data
export interface ValidatedListingData {
  title: string;
  description: string;
  price: number;
  category: string;
  subcategory?: string;
  condition: "new" | "used" | "like_new" | "refurbished";
  location: string;
  latitude?: number;
  longitude?: number;
  negotiable: boolean;
  phone?: string;
  email?: string;
}
