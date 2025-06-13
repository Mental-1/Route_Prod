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
  phone?: string;
  email?: string;
  plan_id?: string;
}
