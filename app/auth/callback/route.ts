import type { EmailOtpType } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"

  if (token_hash && type) {
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })

      if (error) {
        console.error("Email verification error:", error)
        redirect(`/auth/signin?error=${encodeURIComponent(error.message)}`)
      }

      if (data.user) {
        // Update user metadata to mark as verified
        const { error: updateError } = await supabase.auth.updateUser({
          data: { email_verified: true },
        })

        if (updateError) {
          console.error("Error updating user verification status:", updateError)
        }

        // Create welcome notification
        try {
          await supabase.rpc("create_notification", {
            target_user_id: data.user.id,
            notification_type: "account",
            notification_title: "Welcome to RouteMe!",
            notification_message:
              "Your email has been verified successfully. You can now start buying and selling on RouteMe.",
            notification_data: { action: "email_verified" },
          })
        } catch (notificationError) {
          console.error("Error creating welcome notification:", notificationError)
        }

        redirect(
          `/auth/signin?message=${encodeURIComponent("Email verified successfully! You can now sign in.")}&type=success`,
        )
      }
    } catch (error) {
      console.error("Verification process error:", error)
      redirect(`/auth/signin?error=${encodeURIComponent("Email verification failed. Please try again.")}`)
    }
  }

  // Redirect to sign in with error if no token or type
  redirect("/auth/signin?error=Invalid verification link")
}
