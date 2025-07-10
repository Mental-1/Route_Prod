import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Handles M-Pesa payment callback POST requests, verifies request authenticity, updates transaction status, and sends user notifications.
 *
 * Validates the HMAC SHA-256 signature of the incoming callback, parses and verifies the callback data, updates the corresponding transaction record in the database, and, if the payment is successful, notifies the user of the completed payment.
 *
 * @param request - The incoming HTTP request containing the M-Pesa callback data
 * @returns A JSON response indicating success or an error with the appropriate HTTP status code
 */
export async function POST(request: NextRequest) {
  console.log("--- M-Pesa Callback Received ---");
  try {
    const signature = request.headers.get("x-mpesa-signature");
    console.log("Callback Signature:", signature);

    const body = await request.text();
    console.log("Raw Callback Body:", body);

    const expectedSignature = crypto
      .createHmac("sha256", process.env.MPESA_SECRET_KEY!)
      .update(body)
      .digest("hex");

    console.log("Expected Signature:", expectedSignature);

    if (!signature || signature !== expectedSignature) {
      console.error("Signature validation failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    console.log("Signature validation successful.");

    const parsedBody = JSON.parse(body);
    console.log("Parsed Callback Body:", JSON.stringify(parsedBody, null, 2));

    const { Body } = parsedBody;

    if (!Body?.stkCallback) {
      console.error("Invalid callback data: 'stkCallback' missing.");
      return NextResponse.json(
        { error: "Invalid callback data" },
        { status: 400 },
      );
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
      Body.stkCallback;

    console.log("CheckoutRequestID:", CheckoutRequestID);
    console.log("ResultCode:", ResultCode);
    console.log("ResultDesc:", ResultDesc);
    console.log(
      "CallbackMetadata:",
      JSON.stringify(CallbackMetadata, null, 2),
    );

    const supabase = await getSupabaseRouteHandler(cookies);

    // Update transaction status
    const status = ResultCode === 0 ? "completed" : "failed";
    console.log(`Transaction status determined as: ${status}`);

    let reference = null;
    if (CallbackMetadata?.Item) {
      const mpesaReceiptNumberItem = CallbackMetadata.Item.find(
        (item: any) => item.Name === "MpesaReceiptNumber",
      );
      if (mpesaReceiptNumberItem) {
        reference = mpesaReceiptNumberItem.Value;
        console.log("MpesaReceiptNumber found:", reference);
      } else {
        console.log("MpesaReceiptNumber not found in CallbackMetadata.");
      }
    }

    const { error } = await supabase
      .from("transactions")
      .update({
        status,
        reference,
        updated_at: new Date().toISOString(),
      })
      .eq("checkout_request_id", CheckoutRequestID);

    if (error) {
      console.error("Failed to update transaction:", error);
    } else {
      console.log(
        `Transaction with CheckoutRequestID ${CheckoutRequestID} updated successfully.`,
      );
    }

    // Send notification to user
    if (status === "completed") {
      console.log("Payment completed. Preparing to send notification.");
      const { data: transaction } = await supabase
        .from("transactions")
        .select("user_id, amount")
        .eq("checkout_request_id", CheckoutRequestID)
        .single();

      if (transaction?.user_id) {
        console.log(`Sending notification to user ${transaction.user_id}`);
        await supabase.from("notifications").insert({
          user_id: transaction.user_id,
          title: "Payment Successful",
          message: `Your payment of KES ${transaction.amount} has been processed successfully.`,
          type: "payment",
        });
        console.log("Notification sent.");
      } else {
        console.error(
          "Could not find user to send notification for transaction.",
        );
      }
    }

    console.log("--- M-Pesa Callback Processing Finished ---");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return NextResponse.json(
      { error: "Callback processing failed" },
      { status: 500 },
    );
  }
}
