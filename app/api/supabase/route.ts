import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/utils/supabase/server";
import { createRateLimiter } from "@/utils/rate-limiting";
import { createCache } from "@/utils/caching";
import { validateRequest } from "@/lib/request-validation";

const sessionRateLimiter = createRateLimiter({
  uniqueTokenPerPeriod: 50,
  period: 60000,
});

const sessionCache = createCache({
  ttl: 10000, 
  maxSize: 100,
});

export async function GET(request: Request) {
  const validation = await validateRequest(request, {
    method: "GET",
    allowedHeaders: ["authorization", "content-type"],
  });

  if (!validation.isValid) {
    return NextResponse.json(
      { error: "Invalid request", details: validation.errors },
      { status: 400 },
    );
  }

  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  if (sessionRateLimiter.isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 },
    );
  }

  const cachedSession = sessionCache.get("session");
  if (cachedSession) {
    return NextResponse.json({ session: cachedSession });
  }

  const supabase = await getSupabaseServer();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Failed to get session from Supabase:", error);
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 });
  }

  if (session) {
    sessionCache.set("session", session);
  }

  return NextResponse.json({ session });
}