import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    // Test if we can connect to the database
    const { data, error } = await supabase
      .from("User")
      .select("count()")
      .single()
    
    if (error) {
      console.error("Database connection error:", error)
      return NextResponse.json(
        { success: false, message: "Failed to connect to database", error: error.message },
        { status: 500 }
      )
    }
    
    // Test if we can get the Supabase auth config
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      userCount: data?.count || 0,
      supabaseConfigured: !!authData,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("Test database error:", error)
    return NextResponse.json(
      { success: false, message: error.message || "An error occurred during test" },
      { status: 500 }
    )
  }
} 