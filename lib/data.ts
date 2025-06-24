import { createBrowserClient } from "@/utils/supabase/supabase-browser";
import { Tables } from "@/utils/supabase/database.types";
import { Toast } from "@/components/ui/toast";

export interface DisplayListingItem {
  id: string;
  title: string;
  price: number | null;
  location: string | null;
  rating: number | null;
  image: string | null;
  condition: string | null;
  distance?: string;
}

export async function getRecentListings(): Promise<DisplayListingItem[]> {
  const supabase = createBrowserClient();

  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

  const { data, error } = await supabase
    .from("listings")
    .select("id, title, price, location, views, images, condition")
    .gte("created_at", fourDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("Error fetching recent listings:", error.message);
    Toast({
      title: "Error fetching recent listings... Please refresh the page.",
    });
    return [];
  }

  const transformedListings: DisplayListingItem[] = data.map((listing) => ({
    id: listing.id,
    title: listing.title,
    price: listing.price,
    location: listing.location,
    rating: listing.views,
    image:
      listing.images && listing.images.length > 0 ? listing.images[0] : null,
    condition: listing.condition,
  }));

  return transformedListings;
}
