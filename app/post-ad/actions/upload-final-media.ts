"use server";

import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import sharp from "sharp";

interface UploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

export async function uploadFinalMedia(
  mediaUrls: string[],
  uploadType: "listings" | "profiles",
): Promise<UploadResult[]> {
  const supabase = await getSupabaseRouteHandler(cookies);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Authentication error:", authError);
    throw new Error("Unauthorized");
  }

  const results: UploadResult[] = [];

  for (const url of mediaUrls) {
    try {
      let file: File;
      let processedBuffer: Buffer;
      let processedExtension: string;

      if (url.startsWith("blob:")) {
        // Handle Blob URLs (for videos or processed images)
        const response = await fetch(url);
        const blob = await response.blob();
        file = new File([blob], `upload-${Date.now()}.${blob.type.split('/').pop()}`, { type: blob.type });
      } else if (url.startsWith("data:")) {
        // Handle Data URLs (for processed images)
        const parts = url.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const base64 = parts[1];
        const buffer = Buffer.from(base64, 'base64');
        file = new File([buffer], `upload-${Date.now()}.${contentType.split('/').pop()}`, { type: contentType });
      } else {
        // Skip already uploaded URLs or invalid ones
        continue;
      }

      // Re-process images to ensure consistent WebP and compression
      if (file.type.startsWith("image/")) {
        const imageBuffer = Buffer.from(await file.arrayBuffer());
        processedBuffer = await sharp(imageBuffer)
          .webp({ quality: 80 })
          .toBuffer();
        processedExtension = "webp";
      } else {
        processedBuffer = Buffer.from(await file.arrayBuffer());
        processedExtension = file.name.split(".").pop() || "";
      }

      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const filename = `${uploadType}/${user.id}/${timestamp}-${randomString}.${processedExtension}`;

      const bucket = uploadType;
      const filePath = filename;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, processedBuffer, {
          contentType: file.type.startsWith("image/")
            ? `image/${processedExtension}`
            : file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase upload error for file", file.name, uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
      results.push({
        url: publicUrl,
        filename: filePath,
        size: processedBuffer.length,
        type: file.type.startsWith("image/") ? `image/${processedExtension}` : file.type,
      });
    } catch (error) {
      console.error("Error processing/uploading media URL:", url, error);
      // Continue with other files even if one fails
    }
  }

  return results;
}
