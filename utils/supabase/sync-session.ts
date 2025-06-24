import { createBrowserClient } from "@/utils/supabase/supabase-browser";
import { access } from "fs";

export async function syncSupabaseSession() {
    const supabase = createBrowserClient();
    let {data: {session},error} =await supabase.auth.getSession();

    if (!session || error) {
        const res = await fetch("/api/supabase/session");
        const {sessiion: serverSession} = await res.json();
        if(serverSession) {
            await supabase.auth.setSession({
                access_token: serverSession.access_token,
                refresh_token: serverSession.refresh_token
            });
        }
        console.error("Failed to get session from Supabase:", error);
        return;
    }
}