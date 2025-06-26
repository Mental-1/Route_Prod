import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/utils/supabase/server";

export async function GET(request: Request) {
    const supabase = await getSupabaseServer();
    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        console.error("Failed to get session from Supabase:", error);
        return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
    }

    return NextResponse.json({ session });
}