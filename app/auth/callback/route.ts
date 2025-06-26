import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Accepts a session from client and syncs it to server cookies
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
