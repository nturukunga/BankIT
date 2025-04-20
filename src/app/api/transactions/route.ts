import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { supabase } from "@/lib/supabase"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { ensureUuid } from "@/lib/utils"

// Mark route as dynamic to prevent caching
export const dynamic = 'force-dynamic'

// Define validation schema for transaction data
const TransactionSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["deposit", "withdrawal", "transfer", "expense"]),
  cardId: z.string().uuid("Card ID must be a valid UUID"),
  category: z.string().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to view transactions" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id || "";
    console.log("Session user ID:", userId);
    
    // Convert user ID to UUID format for database query
    const uuidUserId = ensureUuid(userId);
    console.log("Using UUID for query:", uuidUserId);
    
    // Get URL parameters for pagination
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || "10");
    const page = Number(searchParams.get("page") || "1");
    const offset = (page - 1) * limit;
    const cardId = searchParams.get("cardId");
    
    let query = supabase
      .from("Transaction")
      .select(`
        *,
        Card:cardId (
          id,
          number,
          type
        )
      `, { count: "exact" })
      .eq("userId", uuidUserId)
      .order("createdAt", { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Filter by card if provided
    if (cardId) {
      const cardUuid = ensureUuid(cardId);
      query = query.eq("cardId", cardUuid);
    }
    
    const { data: transactions, error, count } = await query;
    
    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      transactions,
      count: count || 0,
      page,
      limit,
      pages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a transaction" },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = TransactionSchema.safeParse(body);
    
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
    
    const { amount, description, type, cardId, category } = validationResult.data;
    
    const userId = session.user.id || "";
    console.log("Session user ID:", userId);
    
    // Convert user ID to UUID format for database insertion
    const uuidUserId = ensureUuid(userId);
    console.log("Using UUID for transaction:", uuidUserId);
    
    // Convert card ID to UUID format if needed
    const cardUuid = ensureUuid(cardId);
    
    // Map expense type to withdrawal for the create_transaction function
    let transactionType = type;
    let transactionAmount = amount;
    
    // For expenses, we use a negative amount but send as withdrawal type
    if (type === "expense") {
      transactionType = "withdrawal";
      // Make sure amount is negative for expenses
      transactionAmount = Math.abs(amount) * -1;
    }
    
    // Create transaction using stored procedure
    const { data, error } = await supabase.rpc('create_transaction', {
      p_user_id: uuidUserId,
      p_card_id: cardUuid,
      p_amount: Math.abs(transactionAmount), // Send absolute value
      p_type: transactionType,
      p_description: description,
      p_category: category || null,
    });
    
    if (error) {
      console.error("Transaction creation error:", error);
      return NextResponse.json(
        { error: `Failed to create transaction: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Transaction created successfully",
      transaction: data,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 