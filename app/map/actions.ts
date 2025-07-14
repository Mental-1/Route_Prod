"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getNearbyListings(
  latitude: number,
  longitude: number,
  radius: number,
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          return cookieStore.getAll();
        },
      },
    },
  );

  const { data, error } = await supabase.rpc("get_listings_within_radius", {
    lat: latitude,
    long: longitude,
    radius: radius * 1000, // Convert km to meters
  });

  if (error) {
    console.error("Error fetching nearby listings:", error);
    return [];
  }

  return data as MapListing[];
}

interface MapListing {
  id: number;
  title: string;
  price: number;
  image_url: string;
  distance_km: number;
  lat: number;
  lng: number;
}
