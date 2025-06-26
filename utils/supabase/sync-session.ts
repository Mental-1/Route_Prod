import { createBrowserClient } from "@/utils/supabase/supabase-browser";
import { access } from "fs";

/**
 * Synchronizes the Supabase authentication session on the client with the server session if necessary.
 *
 * Attempts to retrieve the current session from the Supabase client. If unavailable or an error occurs, fetches the session from the server and updates the client session accordingly.
 */
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