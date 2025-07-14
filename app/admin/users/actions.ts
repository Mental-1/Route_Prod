"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// NOTE: You must set the SUPABASE_SERVICE_ROLE_KEY in your .env.local
// to use these admin functions.

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

export async function banUser(userId: string) {
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: "none", // 'none' means permanent ban
  });

  if (error) {
    console.error("Error banning user:", error);
    return { error: "Failed to ban user." };
  }

  revalidatePath("/admin/users");

  // Track event with PostHog
  if (typeof window !== "undefined" && posthog) {
    posthog.capture("user_banned", {
      banned_user_id: userId,
      admin_id: user?.id, // Assuming user is available in context
    });
  }

  return { success: "User has been banned." };
}

export async function unbanUser(userId: string) {
  const supabase = await getSupabaseAdmin();
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: "0s",
  });

  if (error) {
    console.error("Error unbanning user:", error);
    return { error: "Failed to unban user." };
  }

  revalidatePath("/admin/users");

  // Track event with PostHog
  if (typeof window !== "undefined" && posthog) {
    posthog.capture("user_unbanned", {
      unbanned_user_id: userId,
      admin_id: user?.id, // Assuming user is available in context
    });
  }

  return { success: "User has been unbanned." };
}
