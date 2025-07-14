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

export async function updateUserRole(formData: FormData) {
  const userId = formData.get("userId") as string;
  const role = formData.get("role") as string;
  const supabase = await getSupabaseAdmin();
  const posthog = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!)

  // Update the user's role in the profiles table
  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user role:", error);
    return { error: "Failed to update user role." };
  }

  revalidatePath("/admin/roles");

  // Track event with PostHog
  posthog.capture({
    distinctId: "system",
    event: "user_role_updated",
    properties: {
      target_user_id: userId,
      new_role: role,
    },
  });

  await posthog.shutdown();

  return { success: "User role has been updated." };
}
