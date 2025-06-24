import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

/**
 * Accepts a session from client and syncs it to server cookies
 */
export async function POST(request: Request) {
  const session = await request.json();

  const supabase = await getSupabaseRouteHandler();

  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  return NextResponse.json({ success: true });
}
