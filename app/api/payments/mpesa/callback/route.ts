import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseRouteHandler } from "@/utils/supabase/server";
import crypto from "node:crypto";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-mpesa-signature");
    const body = await request.text();

    const expectedSignature = crypto
      .createHmac("sha256", process.env.MPESA_SECRET_KEY!)
      .update(body)
      .digest("hex");
    if (!signature || signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    const { Body } = JSON.parse(body);

    if (!Body?.stkCallback) {
      return NextResponse.json(
        { error: "Invalid callback data" },
        { status: 400 },
      );
    }

    const { CheckoutRequestID, ResultCode, CallbackMetadata } =
      Body.stkCallback;

    const supabase = await getSupabaseRouteHandler();

    // Update transaction status
    const status = ResultCode === 0 ? "completed" : "failed";

    let reference = null;
    if (CallbackMetadata?.Item) {
      const mpesaReceiptNumber = CallbackMetadata.Item.find(
        (item: any) => item.Name === "MpesaReceiptNumber",
      );
      reference = mpesaReceiptNumber?.Value;
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
    }

    // Send notification to user
    if (status === "completed") {
      const { data: transaction } = await supabase
        .from("transactions")
        .select("user_id, amount")
        .eq("checkout_request_id", CheckoutRequestID)
        .single();

      if (transaction?.user_id) {
        await supabase.from("notifications").insert({
          user_id: transaction.user_id,
          title: "Payment Successful",
          message: `Your payment of KES ${transaction.amount} has been processed successfully.`,
          type: "payment",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return NextResponse.json(
      { error: "Callback processing failed" },
      { status: 500 },
    );
  }
}
