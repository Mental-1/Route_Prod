"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { PostHog } from "posthog-node";

const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
});

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
    ban_duration: "none",
  });

  if (error) {
    console.error("Error banning user:", error);
    return { error: "Failed to ban user." };
  }

  revalidatePath("/admin/users");

  // Track event with PostHog
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    posthogClient.capture({
      distinctId: user.id,
      event: "user_banned",
      properties: {
        banned_user_id: userId,
        admin_id: user.id,
      },
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    posthogClient.capture({
      distinctId: user.id,
      event: "user_unbanned",
      properties: {
        unbanned_user_id: userId,
        admin_id: user.id,
      },
    });
  }

  return { success: "User has been unbanned." };
}
