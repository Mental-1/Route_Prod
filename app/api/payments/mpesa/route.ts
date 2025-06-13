import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { mpesaPaymentSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = mpesaPaymentSchema.parse(body);

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // M-Pesa STK Push implementation
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);
    const password = Buffer.from(
      `${process.env.MPESA_BUSINESS_SHORT_CODE}${process.env.MPESA_PASSKEY}${timestamp}`,
    ).toString("base64");

    // Get access token
    const authResponse = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64")}`,
        },
      },
    );

    const authData = await authResponse.json();

    if (!authData.access_token) {
      throw new Error("Failed to get M-Pesa access token");
    }

    // Initiate STK Push
    const stkResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: process.env.MPESA_BUSINESS_SHORT_CODE,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: validatedData.amount,
          PartyA: validatedData.phoneNumber,
          PartyB: process.env.MPESA_BUSINESS_SHORT_CODE,
          PhoneNumber: validatedData.phoneNumber,
          CallBackURL: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mpesa/callback`,
          AccountReference: `RouteMe-${user.id}`,
          TransactionDesc: "RouteMe Payment",
        }),
      },
    );

    const stkData = await stkResponse.json();

    if (stkData.ResponseCode !== "0") {
      throw new Error(stkData.ResponseDescription || "M-Pesa payment failed");
    }

    // Save transaction to database
    const { data: transaction, error: dbError } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        payment_method: "mpesa",
        amount: validatedData.amount,
        status: "pending",
        phone_number: validatedData.phoneNumber,
        checkout_request_id: stkData.CheckoutRequestID,
        merchant_request_id: stkData.MerchantRequestID,
      })
      .select()
      .single();

    if (dbError) {
      throw new Error("Failed to save transaction");
    }

    return NextResponse.json({
      success: true,
      message: "Payment initiated successfully",
      checkoutRequestId: stkData.CheckoutRequestID,
      transaction: transaction,
    });
  } catch (error) {
    console.error("M-Pesa payment error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 500 },
    );
  }
}
