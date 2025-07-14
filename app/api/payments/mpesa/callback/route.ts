import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import pino from "pino";

const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
});

/**
 * Handles M-Pesa payment callback POST requests, verifies request authenticity, updates transaction status, and sends user notifications.
 *
 * Validates the HMAC SHA-256 signature of the incoming callback, parses and verifies the callback data, updates the corresponding transaction record in the database, and, if the payment is successful, notifies the user of the completed payment.
 *
 * @param request - The incoming HTTP request containing the M-Pesa callback data
 * @returns A JSON response indicating success or an error with the appropriate HTTP status code
 */
export async function POST(request: NextRequest) {
  logger.info("--- M-Pesa Callback Received ---");
  try {
    const signature = request.headers.get("x-mpesa-signature");
    logger.debug({ signature }, "Callback Signature:");

    const body = await request.text();
    logger.debug({ body }, "Raw Callback Body:");

    const expectedSignature = crypto
      .createHmac("sha256", process.env.MPESA_SECRET_KEY!)
      .update(body)
      .digest("hex");

    logger.debug({ expectedSignature }, "Expected Signature:");

    if (!signature || signature !== expectedSignature) {
      logger.error("Signature validation failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    logger.info("Signature validation successful.");

    const parsedBody = JSON.parse(body);
    logger.debug({ parsedBody }, "Parsed Callback Body:");

    const { Body } = parsedBody;

    if (!Body?.stkCallback) {
      logger.error("Invalid callback data: 'stkCallback' missing.");
      return NextResponse.json(
        { error: "Invalid callback data" },
        { status: 400 },
      );
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
      Body.stkCallback;

    logger.info({ CheckoutRequestID, ResultCode, ResultDesc }, "M-Pesa Callback Details:");
    logger.debug({ CallbackMetadata }, "CallbackMetadata:");

    const supabase = await getSupabaseRouteHandler(cookies);

    // Check for duplicate callbacks (idempotency)
    const { data: existingTransaction, error: fetchError } = await supabase
      .from("transactions")
      .select("status")
      .eq("checkout_request_id", CheckoutRequestID)
      .single();

    if (existingTransaction && existingTransaction.status === "completed") {
      logger.warn({ CheckoutRequestID }, "Duplicate M-Pesa callback received for already completed transaction.");
      return NextResponse.json({ success: true });
    }

    // Update transaction status
    const status = ResultCode === 0 ? "completed" : "failed";
    logger.info(`Transaction status determined as: ${status}`);

    let reference = null;
    if (CallbackMetadata?.Item) {
      const mpesaReceiptNumberItem = CallbackMetadata.Item.find(
        (item: any) => item.Name === "MpesaReceiptNumber",
      );
      if (mpesaReceiptNumberItem) {
        reference = mpesaReceiptNumberItem.Value;
        logger.info({ reference }, "MpesaReceiptNumber found:");
      } else {
        logger.warn("MpesaReceiptNumber not found in CallbackMetadata.");
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
      logger.error({ error }, "Failed to update transaction:");
    } else {
      logger.info(
        `Transaction with CheckoutRequestID ${CheckoutRequestID} updated successfully.`,
      );
    }

    // Send notification to user
    if (status === "completed") {
      logger.info("Payment completed. Preparing to send notification.");
      const { data: transaction } = await supabase
        .from("transactions")
        .select("user_id, amount")
        .eq("checkout_request_id", CheckoutRequestID)
        .single();

      if (transaction?.user_id) {
        logger.info(`Sending notification to user ${transaction.user_id}`);
        await supabase.from("notifications").insert({
          user_id: transaction.user_id,
          title: "Payment Successful",
          message: `Your payment of KES ${transaction.amount} has been processed successfully.`,
          type: "payment",
        });
        logger.info("Notification sent.");
      } else {
        logger.warn(
          "Could not find user to send notification for transaction.",
        );
      }
    }

    logger.info("--- M-Pesa Callback Processing Finished ---");
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "M-Pesa callback error:");
    return NextResponse.json(
      { error: "Callback processing failed" },
      { status: 500 },
    );
  }
}
