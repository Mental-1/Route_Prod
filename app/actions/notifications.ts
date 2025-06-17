"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/database.types"

type NotificationType = "ad_posted" | "review" | "update" | "policy" | "expiry_warning" | "expired"

export async function createNotification({
  userId,
  title,
  message,
  type,
  listingId = null,
}: {
  userId: string
  title: string
  message: string
  type: NotificationType
  listingId?: string | null
}) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set({ name, value, ...options })
          }
        },
      },
    }
  )

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title,
    message,
    type,
    listing_id: listingId,
    read: false,
  })

  if (error) {
    console.error("Error creating notification:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function markNotificationAsRead(notificationId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set({ name, value, ...options })
          }
        },
      },
    }
  )

  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notificationId)

  if (error) {
    console.error("Error marking notification as read:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function markAllNotificationsAsRead(userId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set({ name, value, ...options })
          }
        },
      },
    }
  )

  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false)

  if (error) {
    console.error("Error marking all notifications as read:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export async function sendExpiryNotification(
  userId: string,
  listingId: string,
  listingTitle: string,
  daysRemaining: number,
) {
  // Create in-app notification
  await createNotification({
    userId,
    title: `Listing Expiring Soon`,
    message: `Your listing "${listingTitle}" will expire in ${daysRemaining} days. Renew now to keep it active.`,
    type: "expiry_warning",
    listingId,
  })

  // Get user email preferences
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set({ name, value, ...options })
          }
        },
      },
    }
  )

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email_notifications, id")
    .eq("id", userId)
    .single()

  // Get user email from Supabase Auth
  let userEmail: string | null = null
  try {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (!userError && userData?.user?.email) {
      userEmail = userData.user.email
    }
  } catch (e) {
    console.error("Error fetching user email from Supabase Auth:", e)
  }

  // Send email if user has enabled email notifications and we have an email
  if (!profileError && profile?.email_notifications === true && userEmail) {
    const nodemailer = require("nodemailer")
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
      },
    })
    await transporter.sendMail({
      from: 'no-reply@routeme.com',
      to: userEmail,
      subject: `Your listing is expiring soon`,
      text: `Your listing "${listingTitle}" will expire in ${daysRemaining} days. Renew now to keep it active.`,
      html: `<p>Your listing <b>${listingTitle}</b> will expire in <b>${daysRemaining} days</b>. <a href="https://routeme.com/dashboard">Renew now</a> to keep it active.</p>`
    })
  }

  return { success: true }
}

export async function markListingAsExpired(listingId: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set({ name, value, ...options })
          }
        },
      },
    }
  )

  // Get listing details
  const { data: listing } = await supabase.from("listings").select("title, user_id").eq("id", listingId).single()

  if (!listing) {
    return { success: false, error: "Listing not found" }
  }

  // Update listing status
  const { error } = await supabase.from("listings").update({ status: "expired" }).eq("id", listingId)

  if (error) {
    console.error("Error marking listing as expired:", error)
    return { success: false, error: error.message }
  }

  if (!listing.user_id) {
    return { success: false, error: "Listing user_id is missing" }
  }

  // Notify user
  await createNotification({
    userId: listing.user_id,
    title: "Listing Expired",
    message: `Your listing "${listing.title}" has expired and is no longer visible to buyers. Renew it to make it active again.`,
    type: "expired",
    listingId,
  })

  return { success: true }
}
