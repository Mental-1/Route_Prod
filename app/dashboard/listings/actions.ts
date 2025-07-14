"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function requestReReview(listingId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in." };
  }

  // Update the listing status from 'rejected' back to 'pending'
  const { error } = await supabase
    .from("listings")
    .update({ status: "pending" })
    .eq("id", listingId)
    .eq("user_id", user.id)
    .eq("status", "rejected");

  if (error) {
    console.error("Error requesting re-review:", error);
    return { error: "Failed to request re-review." };
  }

  revalidatePath("/dashboard/listings");
  return {
    success: "Re-review requested. Your listing is pending approval again.",
  };
}
