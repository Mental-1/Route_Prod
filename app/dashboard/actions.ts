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
  } = await supabase.auth.getUser();

  if (!user) {
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
    .select("*")
    .eq("user_id", user.id);

  // This is a placeholder for recent activity
  const recentActivity: RecentActivityItem[] = [];

  if (listingsError) console.error("listingsError", listingsError);
  if (transactionsError) console.error("transactionsError", transactionsError);

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
