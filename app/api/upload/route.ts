import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseRouteHandler();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const maxSize = type === "profile" ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    const allowedTypes =
      type === "profile"
        ? ["image/jpeg", "image/png", "image/webp"]
        : [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/webm",
            "video/quicktime",
          ];

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
        },
        { status: 400 },
      );
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type",
        },
        { status: 400 },
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop();
    const filename = `${type}/${user.id}/${timestamp}-${randomString}.${extension}`;

    const bucket = type === "profile" ? "profiles" : "listings";
    const filePath = `${user.id}/${timestamp}${filename}-${randomString}.${extension}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage." },
        { status: 500 },
      );
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return NextResponse.json({
      url: publicUrl,
      filename: filePath,
      size: file.size,
      type: file.type,
      bucket: bucket,
      user: user.id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
//TODO: Upload images to supabase storage instead of Vercel Blob
