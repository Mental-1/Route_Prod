import { NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: { conversationId: string } },
) {
  const supabase = await getSupabaseRouteHandler(cookies);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 },
    );
  }

  const conversationId = params.conversationId;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(conversationId)) {
    return NextResponse.json(
      { error: "Invalid conversation ID format" },
      { status: 400 },
    );
  }
  try {
    const { data: conversationAccess } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", conversationId)
      .or(`seller_id.eq.${user.id},buyer_id.eq.${user.id}`)
      .single();

    if (!conversationAccess) {
      return NextResponse.json(
        { error: "Unauthorized access to conversation" },
        { status: 403 },
      );
    }
    const { data, error } = await supabase
      .from("encrypted_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error fetching messages:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
