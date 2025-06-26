import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Receives a session object from the client and sets the authentication session on the server.
 *
 * Expects a JSON body containing `access_token` and `refresh_token`, which are used to synchronize the session with server-side cookies.
 * @returns A JSON response indicating success.
 */
export async function POST(request: Request) {
  try {
    const session = await request.json();

    // Validate required fields
    if (!session?.access_token || !session?.refresh_token) {
      return NextResponse.json(
        { error: "Missing required session tokens" },
        { status: 400 },
      );
    }

    const supabase = await getSupabaseRouteHandler();

    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting session:", error);
    return NextResponse.json(
      { error: "Failed to set session" },
      { status: 500 },
    );
  }
}
