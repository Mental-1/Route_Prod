import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Handles the OAuth callback by exchanging a code for a session and redirecting to the home page.
 *
 * Extracts the "code" parameter from the request URL, exchanges it for an authentication session if present, and redirects the user to the site's root path.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await getSupabaseRouteHandler();
    // Exchange the code for a session.
    // The database trigger associated with auth.users will handle profile creation automatically.
    await supabase.auth.exchangeCodeForSession(code);
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/`);
}
