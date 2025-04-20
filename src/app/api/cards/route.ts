import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { supabase } from "@/lib/supabase"
import { authOptions } from "@/lib/auth"
import { z } from "zod"
import { ensureUuid } from "@/lib/utils"

// Mark route as dynamic to prevent caching
export const dynamic = 'force-dynamic'

// Function to check if date is expired (MM/YY format)
const isDateExpired = (dateStr: string) => {
  // Allow any format but try to validate
  try {
    // Handle formats like MM/YY or MM-YY or MMYY
    let month, year;
    
    if (dateStr.includes('/')) {
      [month, year] = dateStr.split('/');
    } else if (dateStr.includes('-')) {
      [month, year] = dateStr.split('-');
    } else if (dateStr.length === 4) {
      month = dateStr.substring(0, 2);
      year = dateStr.substring(2, 4);
    } else {
      // If format is unexpected, default to valid
      return false;
    }
    
    // Convert to numbers
    const cardMonth = parseInt(month, 10);
    const cardYear = parseInt(year, 10) + 2000; // Convert YY to 20YY
    
    // Get current date
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
    const currentYear = now.getFullYear();
    
    // Check if expired
    return (cardYear < currentYear || 
           (cardYear === currentYear && cardMonth < currentMonth));
  } catch (e) {
    // If parsing fails, default to valid
    return false;
  }
};

// Define validation schema for card data
const CardSchema = z.object({
  cardNumber: z.string().min(16).max(19),
  cardHolder: z.string().min(3),
  expiryDate: z.string().min(5).max(7),
  type: z.enum(["visa", "mastercard", "amex", "credit", "debit"]),
  balance: z.number().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to view cards" },
        { status: 401 }
      );
    }
    
    const userId = session.user.id || "";
    console.log("Session user ID:", userId);
    
    // Convert user ID to UUID format for database query
    const uuidUserId = ensureUuid(userId);
    console.log("Using UUID for query:", uuidUserId);
    
    // Get cards from database - using correct "Card" table name with camelCase columns
    const { data: cards, error, count } = await supabase
      .from("Card")
      .select("*", { count: "exact" })
      .eq("userId", uuidUserId);
    
    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch cards" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      cards,
      count: count || 0,
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
        { error: "You must be logged in to create a card" },
        { status: 401 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = CardSchema.safeParse(body);
    
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
    
    const { cardNumber, cardHolder, expiryDate, type, balance = 0 } = validationResult.data;
    
    // Check if card is expired
    if (isDateExpired(expiryDate)) {
      return NextResponse.json(
        { error: "Card is expired" },
        { status: 400 }
      );
    }
    
    const userId = session.user.id || "";
    console.log("Session user ID:", userId);
    
    // Convert user ID to UUID format for database insertion
    const uuidUserId = ensureUuid(userId);
    console.log("Using UUID for insertion:", uuidUserId);
    
    // Check if card already exists - using correct "Card" table with camelCase columns
    const { data: existingCard, error: checkError } = await supabase
      .from("Card")
      .select("id")
      .eq("cardNumber", cardNumber)
      .eq("userId", uuidUserId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Card check error:", checkError);
      return NextResponse.json(
        { error: "Failed to check for existing card" },
        { status: 500 }
      );
    }
    
    if (existingCard) {
      return NextResponse.json(
        { error: "Card with this number already exists" },
        { status: 409 }
      );
    }
    
    // Create card in database - using correct "Card" table with camelCase columns
    const { data: card, error } = await supabase
      .from("Card")
      .insert({
        userId: uuidUserId,
        cardNumber: cardNumber,
        cardHolder: cardHolder,
        expiryDate: expiryDate,
        type,
        balance,
      })
      .select()
      .single();
    
    if (error) {
      console.error("Card creation error:", error);
      return NextResponse.json(
        { error: `Failed to create card: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Card created successfully",
      card,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 