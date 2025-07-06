import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import { mpesaPaymentSchema } from "@/lib/validations";
import { cookies } from "next/headers";

/**
 * Handles M-Pesa payment initiation via a POST request.
 *
 * Validates the request body, authenticates the user, obtains an M-Pesa access token, and initiates an STK Push payment request. On success, records the transaction in the database and returns payment initiation details. Returns appropriate error responses for authentication, validation, or payment initiation failures.
 *
 * @returns A JSON response indicating success with payment and transaction details, or an error message with the appropriate HTTP status code.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = mpesaPaymentSchema.parse(body);

    const supabase = await getSupabaseRouteHandler(cookies);
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
    const authUrl =
      "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
    const authHeader = `Basic ${Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64")}`;

    console.log("Attempting to fetch M-Pesa access token...");
    console.log("URL:", authUrl);
    console.log(
      "Authorization Header (masked):",
      authHeader.substring(0, 20) + "...",
    ); // Mask for security

    let authResponse;
    try {
      authResponse = await fetch(authUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      });
      console.log("M-Pesa access token fetch completed.");
    } catch (error) {
      console.error("Error during M-Pesa access token fetch:", error);
      throw error; // Re-throw to be caught by the outer catch block
    }

    // Check if the auth response is ok
    if (!authResponse.ok) {
      const authResponseText = await authResponse.text();
      console.error("M-Pesa auth response not OK:", {
        status: authResponse.status,
        statusText: authResponse.statusText,
        body: authResponseText,
      });
      throw new Error(
        `M-Pesa authentication failed: ${authResponse.statusText}. Details: ${authResponseText}`,
      );
    }

    let authData;
    try {
      authData = await authResponse.json();
    } catch (error) {
      console.error("Failed to parse auth response:", error);
      throw new Error("Invalid authentication response from M-Pesa");
    }

    if (!authData.access_token) {
      console.error("Auth response missing access token:", authData);
      throw new Error("Failed to get M-Pesa access token");
    }

    // Initiate STK Push
    const stkResponse = await fetch(
      "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
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

    // Check if the STK response is ok
    if (!stkResponse.ok) {
      console.error("M-Pesa STK response not OK:", {
        status: stkResponse.status,
        statusText: stkResponse.statusText,
      });
      const stkResponseText = await stkResponse.text();
      console.error("STK response body:", stkResponseText);
      throw new Error(`M-Pesa STK push failed: ${stkResponse.statusText}`);
    }

    let stkData;
    try {
      stkData = await stkResponse.json();
    } catch (error) {
      console.error("Failed to parse STK response:", error);
      throw new Error("Invalid STK push response from M-Pesa");
    }

    if (!stkData.ResponseCode) {
      console.error("STK response missing ResponseCode:", stkData);
      throw new Error("Invalid STK push response format");
    }

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
