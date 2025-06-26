import { createBrowserClient } from "@/utils/supabase/supabase-browser";
export async function syncSupabaseSession() {
  const supabase = createBrowserClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (!session || error) {
    const res = await fetch("/api/supabase/session");
    const { session: serverSession } = await res.json();
    if (serverSession) {
      await supabase.auth.setSession({
        access_token: serverSession.access_token,
        refresh_token: serverSession.refresh_token,
      });
    } else console.error("Failed to get session from Supabase:", error);
  }
  return;
}
