"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PostHog } from "posthog-node";

async function getSupabaseAdmin() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}

// Example: Update a listing's status (e.g., to 'approved' or 'rejected')
export async function updateListingStatus(listingId: string, status: string) {
  const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!);
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase
    .from("listings")
    .update({ status: status })
    .eq("id", listingId);

  if (error) {
    console.error("Error updating listing status:", error);
    return { error: "Failed to update listing." };
  }

  revalidatePath("/admin/listings");

  // Track event with PostHog
  posthog.capture({
    distinctId: "system",
    event: "listing_moderated",
    properties: {
      listing_id: listingId,
      status: status,
    },
  });

  await posthog.shutdown();

  return { success: "Listing status updated." };
}
