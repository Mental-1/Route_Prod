import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import { paypalPaymentSchema } from "@/lib/validations";
import { cookies } from "next/headers";

/**
 * Processes a PayPal payment request for an authenticated user, creating a PayPal order and recording the transaction.
 *
 * Validates the request body, obtains a PayPal access token, creates a PayPal order, and saves the transaction to the database. Returns a JSON response with the PayPal order ID, approval URL, and transaction details if successful. Responds with appropriate error messages and status codes if authentication fails or an error occurs during processing.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = paypalPaymentSchema.parse(body);

    const supabase = await getSupabaseRouteHandler(cookies);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get PayPal access token
    const authResponse = await fetch(
      `${process.env.PAYPAL_BASE_URL}/v1/oauth2/token`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      },
    );

    const authData = await authResponse.json();

    if (!authData.access_token) {
      throw new Error("Failed to get PayPal access token");
    }

    // Create PayPal order
    const orderResponse = await fetch(
      `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: validatedData.currency,
                value: validatedData.amount.toString(),
              },
              description: "RouteMe Payment",
              custom_id: user.id,
            },
          ],
          application_context: {
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/cancel`,
          },
        }),
      },
    );

    const orderData = await orderResponse.json();

    if (orderData.status !== "CREATED") {
      throw new Error("Failed to create PayPal order");
    }

    // Save transaction to database
    const { data: transaction, error: dbError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        payment_method: "paypal",
        amount: validatedData.amount,
        status: "pending",
        reference: orderData.id,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error("Failed to save transaction");
    }

    const approvalUrl = orderData.links.find(
      (link: any) => link.rel === "approve",
    )?.href;

    return NextResponse.json({
      success: true,
      order_id: orderData.id,
      approval_url: approvalUrl,
      transaction: transaction,
    });
  } catch (error) {
    console.error("PayPal payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 500 },
    );
  }
}
