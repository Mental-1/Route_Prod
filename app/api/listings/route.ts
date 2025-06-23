import { NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import { title } from "node:process";

export async function GET(request: Request) {
  const supabase = await getSupabaseRouteHandler();
  const { searchParams } = new URL(request.url);

  const id = searchParams.get("id");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "8", 10);

  try {
    if (id) {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error && error.code === "PGRST116") {
        // No rows found for .single()
        return NextResponse.json(
          { message: "Listing not found" },
          { status: 404 },
        );
      }
      if (error) {
        console.error("Error fetching single listing:", error);
        return NextResponse.json(
          { error: "An error occurred" },
          { status: 500 },
        );
      }

      const formattedListing = {
        ...data,
        id: Number(data.id),
        distance: "1.8 km away", // Mocked, integrate with actual location logic
        rating: 4.8,
        reviews: 23,
      };

      return NextResponse.json(formattedListing);
    } else {
      const offset = (page - 1) * limit;

      const { data, error, count } = await supabase
        .from("listings")
        .select("*", { count: "exact" })
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching listings:", error);
        return NextResponse.json(
          { error: "An error occurred while fetching listings" },
          { status: 500 },
        );
      }

      const formattedListings =
        data?.map((listing) => ({
          ...listing,
          id: Number(listing.id),
          distance: "1.8 km away",
          rating: 4.8,
          reviews: 23,
        })) || [];

      const hasMore = count ? offset + formattedListings.length < count : false;

      return NextResponse.json({
        listings: formattedListings,
        totalCount: count,
        hasMore,
        currentPage: page,
        limit,
      });
    }
  } catch (err: any) {
    console.error("Server error in GET /api/listings:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
export async function POST(request: Request) {
  const supabase = await getSupabaseRouteHandler();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized. Please log in to create a listing." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const listingData = {
      ...body,
      user_id: user.id,
      created_at: new Date().toISOString(),
      title: String(body.title) || "Untitled Listing",
      description: String(body.description) || "No description provided",
      price: Number(body.price) || 0,
      location: body.location || "Unknown Location",
      category: body.category || "Other",
      status: String(body.status) || "Active",
      images: String(body.images) || [],
      tags: body.tags || [],
      contact_info: body.contact_info || "No contact information provided",
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("listings")
      .insert([listingData])
      .select()
      .single();

    if (error) {
      console.error("Error creating listing:", error);
      return NextResponse.json(
        { error: "Internal server error occurred while creating listing" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Listing created successfully", listing: data },
      { status: 201 },
    );
  } catch (err: any) {
    console.error("Server error in POST /api/listings:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const supabase = await getSupabaseRouteHandler();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized. Please log in to update a listing." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { message: "Listing ID is required for update." },
        { status: 400 },
      );
    }
    const { data: existingListing, error: fetchError } = await supabase
      .from("listings")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError && fetchError.code === "PGRST116") {
      return NextResponse.json(
        { message: "Listing not found" },
        { status: 404 },
      );
    }
    if (fetchError) {
      console.error("Error checking listing ownership:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (existingListing.user_id !== user.id) {
      return NextResponse.json(
        {
          message:
            "Forbidden. You do not have permission to update this listing.",
        },
        { status: 403 },
      );
    }

    const { data, error } = await supabase
      .from("listings")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating listing:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Listing updated successfully", listing: data },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("Server error in PUT /api/listings:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const supabase = await getSupabaseRouteHandler();
  const { searchParams } = new URL(request.url);

  // Authentication check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized. Please log in to delete a listing." },
      { status: 401 },
    );
  }

  try {
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { message: "Listing ID is required for deletion." },
        { status: 400 },
      );
    }

    // First, fetch the listing to verify ownership before deleting
    const { data: existingListing, error: fetchError } = await supabase
      .from("listings")
      .select("user_id")
      .eq("id", id)
      .single();

    if (fetchError && fetchError.code === "PGRST116") {
      return NextResponse.json(
        { message: "Listing not found" },
        { status: 404 },
      );
    }
    if (fetchError) {
      console.error("Error checking listing ownership:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Authorization check: Ensure the authenticated user owns the listing
    if (existingListing.user_id !== user.id) {
      return NextResponse.json(
        {
          message:
            "Forbidden. You do not have permission to delete this listing.",
        },
        { status: 403 },
      );
    }

    // Perform the deletion
    const { error } = await supabase.from("listings").delete().eq("id", id);

    if (error) {
      console.error("Error deleting listing:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Supabase delete operation doesn't return data by default,
    // so we return a success message.
    return NextResponse.json(
      { message: `Listing with ID ${id} deleted successfully` },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("Server error in DELETE /api/listings:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
