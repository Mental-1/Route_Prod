import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function PUT(request: Request) {
  const supabase = await getSupabaseRouteHandler(cookies);
  const { userId, avatarUrl } = await request.json();

  if (!userId || !avatarUrl) {
    return NextResponse.json(
      { error: "User ID and avatar URL are required" },
      { status: 400 },
    );
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating profile avatar:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Avatar URL updated successfully" });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
