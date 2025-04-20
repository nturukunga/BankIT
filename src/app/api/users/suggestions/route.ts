import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Mark the route as explicitly dynamic to avoid static generation errors
export const dynamic = 'force-dynamic'

// Define interface for user type
interface UserSuggestion {
  email: string;
}

export async function GET(request: Request) {
  try {
    // Get search query from URL
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    
    // Find users whose email matches the query pattern
    const { data: users, error } = await supabase
      .from("User")
      .select("email")
      .ilike("email", `%${query}%`)
      .limit(5);
    
    if (error) throw error;

    return NextResponse.json({ 
      users: (users || []).map((user: UserSuggestion) => user.email)
    })
  } catch (error) {
    console.error("Error fetching user suggestions:", error)
    return NextResponse.json(
      { error: "Failed to fetch user suggestions" },
      { status: 500 }
    )
  }
} 