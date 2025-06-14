import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/utils/supabase/server";
import { MessageEncryption } from "@/lib/encryption";
import { z } from "zod";

const sendMessageSchema = z.object({
  listingId: z.string().uuid(),
  recipientId: z.string().uuid(),
  content: z.string().min(1).max(1000),
});

/**
 * Handles sending an encrypted message related to a listing between users.
 *
 * Authenticates the user, validates the request body, determines buyer and seller roles, retrieves or creates a conversation with an encryption key, encrypts the message content, and stores the encrypted message in the database.
 *
 * @returns A JSON response indicating success and the new message ID, or an error with the appropriate HTTP status code.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { listingId, recipientId, content } = sendMessageSchema.parse(body);

    // Get listing to determine buyer/seller roles
    const { data: listing } = await supabase
      .from("listings")
      .select("user_id")
      .eq("id", listingId)
      .single();

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const isSeller = listing.user_id === user.id;
    const buyerId = isSeller ? recipientId : user.id;
    const sellerId = isSeller ? user.id : recipientId;

    // Generate or get conversation
    let { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("listing_id", listingId)
      .eq("buyer_id", buyerId)
      .eq("seller_id", sellerId)
      .single();

    if (!conversation) {
      // Create new conversation with encryption key
      const encryptionKey = await MessageEncryption.generateKey();
      const exportedKey = await MessageEncryption.exportKey(encryptionKey);

      const { data: newConversation } = await supabase
        .from("conversations")
        .insert({
          listing_id: listingId,
          buyer_id: buyerId,
          seller_id: sellerId,
          encryption_key: exportedKey,
        })
        .select()
        .single();

      conversation = newConversation;
    }

    // Encrypt message
    const key = await MessageEncryption.importKey(conversation.encryption_key);
    const { encrypted, iv } = await MessageEncryption.encrypt(content, key);

    // Save encrypted message
    const { data: message, error } = await supabase
      .from("encrypted_messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        encrypted_content: encrypted,
        iv: iv,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving message:", error);
      return NextResponse.json(
        { error: "Failed to send message" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, messageId: message.id });
  } catch (error) {
    console.error("Message API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * Retrieves and decrypts all messages for a specified conversation accessible to the authenticated user.
 *
 * Returns a JSON response containing an array of decrypted messages, each with its ID, sender ID, content, creation time, and read time. Only users who are participants in the conversation (buyer or seller) can access the messages.
 *
 * @returns A JSON response with the array of decrypted messages, or an error message with the appropriate HTTP status code if access is unauthorized, the conversation is not found, or an internal error occurs.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID required" },
        { status: 400 },
      );
    }

    // Get conversation and verify access
    const { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (
      !conversation ||
      (conversation.buyer_id !== user.id && conversation.seller_id !== user.id)
    ) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Get encrypted messages
    const { data: encryptedMessages } = await supabase
      .from("encrypted_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!encryptedMessages) {
      return NextResponse.json({ messages: [] });
    }

    // Decrypt messages
    const key = await MessageEncryption.importKey(conversation.encryption_key);
    const messages = await Promise.all(
      encryptedMessages.map(async (msg) => {
        const decryptedContent = await MessageEncryption.decrypt(
          msg.encrypted_content,
          msg.iv,
          key,
        );
        return {
          id: msg.id,
          senderId: msg.sender_id,
          content: decryptedContent,
          createdAt: msg.created_at,
          readAt: msg.read_at,
        };
      }),
    );

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
