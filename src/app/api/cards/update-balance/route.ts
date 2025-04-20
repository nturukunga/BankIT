import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { supabase } from "@/lib/supabase"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { ensureUuid } from "@/lib/utils"

// Mark route as dynamic to prevent caching
export const dynamic = 'force-dynamic'

// Define validation schema for balance update data
const UpdateBalanceSchema = z.object({
  cardId: z.string().uuid("Card ID must be a valid UUID"),
  amount: z.number().describe("Amount to add (positive) or subtract (negative) from balance"),
  reason: z.string().optional().describe("Reason for the balance change"),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to update card balance" },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = UpdateBalanceSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      
      console.error("Validation errors:", errorMessages);
      return NextResponse.json(
        { error: `Invalid input: ${errorMessages}` },
        { status: 400 }
      );
    }
    
    const { cardId, amount, reason } = validationResult.data;
    const userId = session.user.id || "";
    
    // Convert IDs to UUID format
    const uuidUserId = ensureUuid(userId);
    const cardUuid = ensureUuid(cardId);
    
    // Verify card ownership before updating
    const { data: cardData, error: cardError } = await supabase
      .from("Card")
      .select("id, balance")
      .eq("id", cardUuid)
      .eq("userId", uuidUserId)
      .single();
    
    if (cardError || !cardData) {
      console.error("Card verification error:", cardError);
      return NextResponse.json(
        { error: "Card not found or doesn't belong to you" },
        { status: 404 }
      );
    }
    
    // Determine transaction type based on amount
    const transactionType = amount >= 0 ? "deposit" : "withdrawal";
    
    // Create a transaction and update balance atomically using RPC
    const { data, error } = await supabase.rpc('update_card_balance', {
      p_user_id: uuidUserId,
      p_card_id: cardUuid,
      p_amount: Math.abs(amount),
      p_type: transactionType,
      p_description: reason || `Balance ${amount >= 0 ? 'increase' : 'decrease'}`
    });
    
    if (error) {
      console.error("Balance update error:", error);
      return NextResponse.json(
        { error: `Failed to update balance: ${error.message}` },
        { status: 500 }
      );
    }
    
    // Get updated card data
    const { data: updatedCard, error: fetchError } = await supabase
      .from("Card")
      .select("*")
      .eq("id", cardUuid)
      .single();
    
    if (fetchError) {
      console.error("Error fetching updated card:", fetchError);
      return NextResponse.json({
        success: true,
        message: "Balance updated successfully, but failed to fetch updated card details",
        data
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Balance updated successfully",
      card: updatedCard,
      transaction: data
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 