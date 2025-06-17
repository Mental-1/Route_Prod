import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    const supabase = await createServerSupabaseClient();
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

    // Capture PayPal order
    const captureResponse = await fetch(
      `${process.env.PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    const captureData = await captureResponse.json();

    if (captureData.status === "COMPLETED") {
      // Update transaction status
      const { error } = await supabase
        .from("transactions")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("reference", orderId);

      if (error) {
        console.error("Failed to update transaction:", error);
      }

      // Send notification to user
      const { data: transaction } = await supabase
        .from("transactions")
        .select("user_id, amount")
        .eq("reference", orderId)
        .single();

      if (transaction && transaction.user_id) {
        await supabase.from("notifications").insert({
          user_id: transaction.user_id,
          title: "Payment Successful",
          message: `Your PayPal payment of $${transaction.amount} has been processed successfully.`,
          type: "payment",
        });
      }

      return NextResponse.json({
        success: true,
        capture_id: captureData.purchase_units[0].payments.captures[0].id,
      });
    } else {
      throw new Error("Payment capture failed");
    }
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Payment capture failed",
      },
      { status: 500 },
    );
  }
}
