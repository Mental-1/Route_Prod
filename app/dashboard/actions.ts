"use server";

import { getSupabaseServer } from "@/utils/supabase/server";

import {
  DashboardData,
  ListingItem,
  TransactionItem,
  RecentActivityItem,
} from "@/lib/types/dashboard-types";

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Authentication required");
  }

  if (!user.id) {
    return {
      activeListings: [],
      pendingListings: [],
      expiredListings: [],
      transactions: [],
      recentActivity: [],
    };
  }

  const { data: allListings, error: listingsError } = await supabase
    .from("listings")
    .select("*")
    .eq("user_id", user.id);

  const { data: transactions, error: transactionsError } = await supabase
    .from("transactions")
    .select("*, listings(id, title)")
    .eq("user_id", user.id);

  if (listingsError) {
    console.error("Failed to fetch listings:", listingsError);
    throw new Error("Failed to fetch listings data");
  }

  if (transactionsError) {
    console.error("Failed to fetch transactions:", transactionsError);
    throw new Error("Failed to fetch transactions data");
  }

  // This is a placeholder for recent activity
  const recentActivity: RecentActivityItem[] = [];

  const activeListings =
    allListings?.filter((listing) => listing.status === "active") || [];
  const pendingListings =
    allListings?.filter((listing) => listing.status === "pending") || [];
  const expiredListings =
    allListings?.filter((listing) => listing.status === "expired") || [];

  return {
    activeListings,
    pendingListings,
    expiredListings,
    transactions: transactions || [],
    recentActivity,
  };
}
