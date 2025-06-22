import { del } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/utils/supabase/server";

/**
 * Handles DELETE requests to remove a user-owned file from storage.
 *
 * Authenticates the user, verifies file ownership based on the provided URL, and deletes the file if authorized. Returns appropriate JSON responses for authentication failure, missing URL, unauthorized access, or deletion errors.
 *
 * @param request - The incoming HTTP request containing a JSON body with the `url` of the file to delete
 * @returns A JSON response indicating success or the relevant error status
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Verify the user owns this file by checking the path
    if (!url.includes(`/${user.id}/`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await del(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
