import { getSupabaseRouteHandler } from "@/utils/supabase/server"
import { NextResponse } from "next/server"
import type { Database } from "@/utils/supabase/database.types"
import type { Session, User } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = await getSupabaseRouteHandler()

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)

    // Get the user from the newly created session
    const { data } = await supabase.auth.getSession()
    const session: Session | null = data.session
    const user: User | undefined = session?.user
    if (user) {
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id as Database["public"]["Tables"]["profiles"]["Row"]["id"])
        .single()

      // If profile doesn't exist, create it
      // Authorization: Only create profile if not exists and user is authenticated
      if (!existingProfile) {
        // Use only allowed fields for Insert type and pass as array
        await supabase.from("profiles").insert([
          {
            id: user.id,
            username: user.user_metadata?.username || user.email?.split("@")[0] || `user_${Date.now()}`,
            full_name: user.user_metadata?.full_name || "",
            avatar_url: user.user_metadata?.avatar_url || "",
          } as unknown as Database["public"]["Tables"]["profiles"]["Insert"]
        ])
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/`)
}
