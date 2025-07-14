"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

interface UserAnalyticsData {
  users: Array<{ created_at: string }>;
}

interface ListingCategoryData {
  name: string;
}

interface ListingAnalyticsData {
  created_at: string;
  categories: ListingCategoryData[];
}

interface AnalyticsDataSuccess {
  usersData: UserAnalyticsData;
  listingsData: ListingAnalyticsData[];
}

interface AnalyticsDataError {
  error: { usersError: any; listingsError: any };
}

export async function getAnalyticsData(): Promise<AnalyticsDataSuccess | AnalyticsDataError> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    },
  );

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: usersData, error: usersError } =
    await supabase.auth.admin.listUsers();
  const { data: listingsData, error: listingsError } = await supabase
    .from("listings")
    .select("created_at, categories (name)")
    .gte("created_at", sevenDaysAgo.toISOString());

  if (usersError || listingsError) {
    console.error("Error fetching analytics data:", {
      usersError,
      listingsError,
    });
    return { error: { usersError, listingsError } };
  }

  return { usersData, listingsData };
}
