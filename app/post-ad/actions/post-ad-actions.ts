"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import {
  AdDetailsFormData,
  ActionResponse,
  ListingCreateData,
} from "@/lib/types/form-types";
import { createSanitizedString } from "@/lib/input-sanitization";
import {
  createListingLimiter,
  updateListingLimiter,
} from "@/utils/rate-limiting";
import { handleActionError, AppError } from "@/utils/errorhandler";
import { createAuditLogger } from "@/utils/audit-logger";
import { z } from "zod";

// Enhanced validation schema with proper typing
const createListingSchema = z.object({
  title: createSanitizedString({ min: 5, max: 100 }),
  description: createSanitizedString({ min: 20, max: 2000 }),
  price: z.string().transform((val) => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) throw new Error("Invalid price");
    return num;
  }),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional(),
  condition: z.enum(["new", "used", "like_new", "refurbished"]),
  location: createSanitizedString({ min: 2, max: 100 }),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  negotiable: z.boolean().default(false),
  phone: createSanitizedString({ required: false, max: 20 }).optional(),
  email: z.string().email().optional(),
});

// Type for the validated data
type CreateListingInput = z.infer<typeof createListingSchema>;

/**
 * Retrieves the authenticated user and their profile from the database.
 *
 * @returns An object containing the authenticated user and their profile.
 *
 * @throws {AppError} If authentication fails or no user is found.
 */
async function getUserContext() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AppError("Authentication required", 401, "AUTH_REQUIRED");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

/**
 * Checks whether a user has reached their maximum allowed number of active listings based on their subscription plan.
 *
 * @param userId - The unique identifier of the user to check limits for.
 * @returns An object containing the user's current subscription, the number of active listings, and the maximum allowed listings.
 *
 * @throws {AppError} If the user has reached or exceeded their allowed number of active listings.
 */
async function checkUserLimits(userId: string) {
  const supabase = await createServerSupabaseClient();

  // Get user's current subscription/plan
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select(
      `
      *,
      plan:subscription_plans(*)
    `,
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  // Get current active listings count
  const { count: activeListings } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "active");

  const maxListings = subscription?.plan?.max_listings || 2; // Free tier default

  if ((activeListings || 0) >= maxListings) {
    throw new AppError(
      `You have reached your listing limit of ${maxListings}. Upgrade your plan to list more items.`,
      403,
      "LISTING_LIMIT_EXCEEDED",
    );
  }

  return { subscription, activeListings: activeListings || 0, maxListings };
}

/**
 * Validates that the specified category and optional subcategory exist and are correctly related.
 *
 * @param categoryId - The ID of the category to validate.
 * @param subcategoryId - The ID of the subcategory to validate, if provided.
 * @returns An object containing the validated category and, if applicable, subcategory.
 *
 * @throws {AppError} If the category does not exist or is invalid.
 * @throws {AppError} If the subcategory does not exist, is invalid, or does not belong to the specified category.
 */
async function validateCategories(categoryId: string, subcategoryId?: string) {
  const supabase = await createServerSupabaseClient();

  // Validate category
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("*")
    .eq("id", categoryId)
    .single();

  if (categoryError || !category) {
    throw new AppError("Invalid category selected", 400, "INVALID_CATEGORY");
  }

  let subcategory = null;
  if (subcategoryId) {
    const { data: subcat, error: subcatError } = await supabase
      .from("subcategories")
      .select("*")
      .eq("id", subcategoryId)
      .eq("parent_category_id", categoryId)
      .single();

    if (subcatError || !subcat) {
      throw new AppError(
        "Invalid subcategory selected",
        400,
        "INVALID_SUBCATEGORY",
      );
    }
    subcategory = subcat;
  }

  return { category, subcategory };
}

/**
 * Validates an array of image URLs for a listing, ensuring presence, maximum count, and user ownership.
 *
 * @param imageUrls - Array of image URLs to validate.
 * @param userId - The ID of the user who must own the images.
 * @returns The validated array of image URLs.
 *
 * @throws {AppError} If no images are provided, more than 10 images are supplied, or any image does not belong to the user.
 */
async function processImages(imageUrls: string[], userId: string) {
  if (!imageUrls || imageUrls.length === 0) {
    throw new AppError("At least one image is required", 400, "NO_IMAGES");
  }

  if (imageUrls.length > 10) {
    throw new AppError("Maximum 10 images allowed", 400, "TOO_MANY_IMAGES");
  }

  // Validate image URLs belong to the user (security check)
  for (const url of imageUrls) {
    if (!url.includes(userId)) {
      throw new AppError("Invalid image detected", 400, "INVALID_IMAGE");
    }
  }

  return imageUrls;
}

/**
 * Creates a new marketplace listing with full validation, authorization, and audit logging.
 *
 * Validates input data, checks user subscription limits, verifies category and image ownership, inserts the listing into the database, updates the user's profile listing count, logs the creation event, generates an SEO-friendly slug, and triggers cache revalidation for affected pages.
 *
 * @param formData - Listing details and associated media URLs.
 * @returns An object indicating success or failure. On success, includes the new listing's ID and slug.
 *
 * @throws {AppError} If rate limits are exceeded, user is unauthorized, validation fails, or database operations encounter errors.
 */
export async function createListingAction(
  formData: AdDetailsFormData & { mediaUrls: string[] },
): Promise<ActionResponse<{ id: string; slug: string }>> {
  try {
    // Get request headers for rate limiting and audit logging
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "";
    const forwarded = headersList.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Rate limiting
    const rateLimitResult = createListingLimiter.check(ip);
    if (!rateLimitResult.allowed) {
      throw new AppError(
        "Too many listing attempts. Please try again later.",
        429,
        "RATE_LIMIT_EXCEEDED",
      );
    }

    // Get authenticated user
    const { user, profile } = await getUserContext();

    // Create audit logger
    const auditLogger = createAuditLogger({
      user_id: user.id,
      ip_address: ip,
      user_agent: userAgent,
    });

    // Check user limits
    await checkUserLimits(user.id);

    // Prepare data for validation
    const validationData = {
      ...formData,
      phone: profile?.phone || undefined,
      email: user.email || undefined,
    };

    // Validate input data with proper typing
    const validationResult = createListingSchema.safeParse(validationData);

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        errors[path] = issue.message;
      });

      await auditLogger.log({
        action: "create_listing_validation_failed",
        resource_type: "listing",
        metadata: { errors },
      });

      return {
        success: false,
        errors,
        message: "Please correct the errors and try again",
      };
    }

    // Now we have properly typed validated data
    const validatedData: CreateListingInput = validationResult.data;

    // Validate categories
    const { category, subcategory } = await validateCategories(
      validatedData.category,
      validatedData.subcategory,
    );

    // Process images
    const processedImages = await processImages(formData.mediaUrls, user.id);

    // Create listing data with proper typing
    const listingData: ListingCreateData = {
      title: validatedData.title,
      description: validatedData.description,
      price: validatedData.price, // This is now properly typed as number
      category_id: category.id,
      subcategory_id: subcategory?.id,
      condition: validatedData.condition,
      location: validatedData.location,
      latitude: validatedData.latitude,
      longitude: validatedData.longitude,
      negotiable: validatedData.negotiable,
      images: processedImages,
      user_id: user.id,
      status: "active",
      payment_status: "free",
      plan: "free",
      views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expiry_date: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };

    // Create listing in database
    const supabase = await createServerSupabaseClient();

    const { data: listing, error } = await supabase
      .from("listings")
      .insert(listingData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update user listing count in profile
    await supabase
      .from("profiles")
      .update({
        listing_count: (profile?.listing_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Log successful creation
    await auditLogger.log({
      action: "create_listing_success",
      resource_type: "listing",
      resource_id: listing.id,
      new_values: listingData,
    });

    // Generate SEO-friendly slug
    const slug = `${validatedData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}-${listing.id.slice(-8)}`;

    // Revalidate relevant pages
    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath(`/listings/${listing.id}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        id: listing.id,
        slug,
      },
      message: "Listing created successfully!",
    };
  } catch (error) {
    return handleActionError(error, {
      action: "create_listing",
      userId: "unknown",
      ip: "unknown",
    });
  }
}

/**
 * Updates an existing listing with the provided fields.
 *
 * Validates input, verifies ownership, applies rate limiting, updates the listing, logs the update, and revalidates affected pages.
 *
 * @param listingId - The ID of the listing to update.
 * @param formData - Partial listing data to update.
 * @returns An action response containing the updated listing ID on success, or validation errors on failure.
 *
 * @throws {AppError} If the listing is not found, access is denied, or rate limits are exceeded.
 */
export async function updateListingAction(
  listingId: string,
  formData: Partial<AdDetailsFormData>,
): Promise<ActionResponse<{ id: string }>> {
  try {
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "unknown";

    // Rate limiting
    const rateLimitResult = updateListingLimiter.check(ip);
    if (!rateLimitResult.allowed) {
      throw new AppError(
        "Too many update attempts. Please try again later.",
        429,
        "RATE_LIMIT_EXCEEDED",
      );
    }

    const { user } = await getUserContext();
    const supabase = await createServerSupabaseClient();

    // Verify ownership
    const { data: existingListing, error: fetchError } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingListing) {
      throw new AppError(
        "Listing not found or access denied",
        404,
        "LISTING_NOT_FOUND",
      );
    }

    // Validate update data (partial validation)
    const updateSchema = createListingSchema.partial();
    const validationResult = updateSchema.safeParse(formData);

    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const path = issue.path.join(".");
        errors[path] = issue.message;
      });

      return {
        success: false,
        errors,
        message: "Please correct the errors and try again",
      };
    }

    const validatedData = validationResult.data;

    // Update listing
    const { data: updatedListing, error: updateError } = await supabase
      .from("listings")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log successful update
    const auditLogger = createAuditLogger({
      user_id: user.id,
      ip_address: ip,
    });

    await auditLogger.log({
      action: "update_listing_success",
      resource_type: "listing",
      resource_id: listingId,
      old_values: existingListing,
      new_values: validatedData,
    });

    // Revalidate pages
    revalidatePath(`/listings/${listingId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      data: { id: updatedListing.id },
      message: "Listing updated successfully!",
    };
  } catch (error) {
    return handleActionError(error, {
      action: "update_listing",
      resourceId: listingId,
    });
  }
}

/**
 * Performs a soft delete of a listing owned by the authenticated user.
 *
 * Marks the specified listing as removed, decrements the user's listing count, logs the deletion event, and triggers cache revalidation for affected pages.
 *
 * @param listingId - The unique identifier of the listing to delete.
 * @returns An action response indicating success or containing error details.
 *
 * @throws {AppError} If the listing does not exist or the user does not have access.
 */
export async function deleteListingAction(
  listingId: string,
): Promise<ActionResponse> {
  try {
    const { user, profile } = await getUserContext();
    const supabase = await createServerSupabaseClient();

    // Verify ownership
    const { data: existingListing, error: fetchError } = await supabase
      .from("listings")
      .select("*")
      .eq("id", listingId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingListing) {
      throw new AppError(
        "Listing not found or access denied",
        404,
        "LISTING_NOT_FOUND",
      );
    }

    // Soft delete (mark as removed)
    await supabase
      .from("listings")
      .update({
        status: "removed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId)
      .eq("user_id", user.id);

    // Update user listing count
    await supabase
      .from("profiles")
      .update({
        listing_count: Math.max(0, (profile?.listing_count || 1) - 1),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Log deletion
    const auditLogger = createAuditLogger({ user_id: user.id });
    await auditLogger.log({
      action: "delete_listing_success",
      resource_type: "listing",
      resource_id: listingId,
      old_values: existingListing,
    });

    // Revalidate pages
    revalidatePath("/");
    revalidatePath("/listings");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Listing deleted successfully",
    };
  } catch (error) {
    return handleActionError(error, {
      action: "delete_listing",
      resourceId: listingId,
    });
  }
}

/**
 * Marks a listing as sold for the authenticated user.
 *
 * Updates the status of the specified listing to "sold" and refreshes relevant pages.
 *
 * @param listingId - The unique identifier of the listing to mark as sold.
 * @returns An action response indicating success or containing error details.
 */
export async function markAsSoldAction(
  listingId: string,
): Promise<ActionResponse> {
  try {
    const { user } = await getUserContext();
    const supabase = await createServerSupabaseClient();

    // Update listing status
    const { error } = await supabase
      .from("listings")
      .update({
        status: "sold",
        updated_at: new Date().toISOString(),
      })
      .eq("id", listingId)
      .eq("user_id", user.id);

    if (error) {
      throw error;
    }

    // Log action
    const auditLogger = createAuditLogger({ user_id: user.id });
    await auditLogger.log({
      action: "mark_listing_sold",
      resource_type: "listing",
      resource_id: listingId,
    });

    revalidatePath(`/listings/${listingId}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Listing marked as sold",
    };
  } catch (error) {
    return handleActionError(error, {
      action: "mark_as_sold",
      resourceId: listingId,
    });
  }
}

/**
 * Redirects the client to the detail page of a listing identified by its slug.
 *
 * @param slug - The unique slug of the listing to redirect to.
 */
export async function redirectToListingAction(slug: string) {
  redirect(`/listings/${slug}`);
}
