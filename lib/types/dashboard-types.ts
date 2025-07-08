export interface ListingItem {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  images: string[] | null;
  condition: string | null;
  location: string | null;
  views: number | null;
  category_id: number | null;
  subcategory_id: number | null;
  created_at: string | null;
  status: string | null;
}

export interface TransactionItem {
  id: string;
  amount: number;
  created_at: string | null;
  // Add other transaction properties as needed
}

export interface RecentActivityItem {
  id: string;
  title: string;
  description: string;
  date: string;
  icon: React.ReactNode;
  amount?: number;
}

export interface DashboardData {
  activeListings: ListingItem[];
  pendingListings: ListingItem[];
  expiredListings: ListingItem[];
  transactions: TransactionItem[];
  recentActivity: RecentActivityItem[];
}