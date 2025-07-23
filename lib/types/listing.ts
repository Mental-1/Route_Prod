import { Profile } from "./profile";

export type Review = {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: Profile;
};

export type Listing = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: {
    id: number;
    name: string;
  };
  subcategory_id?: number;
  condition: "new" | "used" | "like_new" | "refurbished";
  location: string;
  latitude?: number;
  longitude?: number;
  negotiable: boolean;
  images: string[];
  user_id: string;
  status: "pending" | "approved" | "rejected" | "expired";
  payment_status: "paid" | "unpaid";
  plan: "free" | "basic" | "premium";
  views: number;
  created_at: string;
  updated_at: string;
  expiry_date: string;
  profiles: Profile;
  reviews: Review[];
};
