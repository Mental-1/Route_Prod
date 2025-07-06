import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import { paystackPaymentSchema } from "@/lib/validations";
import { cookies } from "next/headers";

/**
 * Handles PayStack payment initialization and records the transaction.
 *
 * Parses and validates the incoming payment request, authenticates the user, initializes a PayStack transaction, and saves the transaction details to the database. Returns a JSON response with the PayStack authorization URL and transaction information, or an error message if any step fails.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = paystackPaymentSchema.parse(body);

    const supabase = await getSupabaseRouteHandler(cookies);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Initialize PayStack transaction
    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: validatedData.email,
          amount: validatedData.amount * 100,
          currency: "NGN",
          reference: `routeme_${user.id}_${Date.now()}`,
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/paystack/callback`,
          metadata: {
            user_id: user.id,
            custom_fields: [
              {
                display_name: "User ID",
                variable_name: "user_id",
                value: user.id,
              },
            ],
          },
        }),
      },
    );

    const data = await response.json();

    if (!data.status) {
      throw new Error(data.message || "PayStack initialization failed");
    }

    // Save transaction to database
    const { data: transaction, error: dbError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        payment_method: "paystack",
        amount: validatedData.amount,
        status: "pending",
        email: validatedData.email,
        reference: data.data.reference,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error("Failed to save transaction");
    }

    return NextResponse.json({
      success: true,
      authorization_url: data.data.authorization_url,
      access_code: data.data.access_code,
      reference: data.data.reference,
      transaction: transaction,
    });
  } catch (error) {
    console.error("PayStack payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 500 },
    );
  }
}
