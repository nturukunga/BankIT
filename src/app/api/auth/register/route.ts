import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { supabase } from "@/lib/supabase"
import { ensureUuid } from "@/lib/utils"
import { registrationSchema } from "@/lib/validators"
import { z } from "zod"

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json()
    
    // Validate input data using Zod
    const validationResult = registrationSchema.safeParse(body)
    
    if (!validationResult.success) {
      const errors = validationResult.error.format()
      return NextResponse.json({ 
        success: false, 
        message: "Validation failed", 
        errors 
      }, { status: 400 })
    }
    
    const { email, password } = validationResult.data
    
    // Check if email exists
    const { data: existingUser } = await supabase
      .from("User")
      .select("email")
      .eq("email", email)
      .single()
    
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        message: "Email already in use" 
      }, { status: 409 })
    }
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (authError) {
      console.error("Supabase Auth Error:", authError)
      return NextResponse.json({ 
        success: false, 
        message: authError.message || "Authentication failed" 
      }, { status: 500 })
    }
    
    if (!authData.user) {
      return NextResponse.json({ 
        success: false, 
        message: "Failed to create user" 
      }, { status: 500 })
    }
    
    // Hash password for database storage - ensures we never store plaintext passwords
    const hashedPassword = await hash(password, 12)
    
    // Get proper UUID
    const userId = ensureUuid(authData.user.id)
    
    // Create user in database
    const { data: newUser, error: dbError } = await supabase
      .from("User")
      .insert({
        id: userId,
        email,
        passwordHash: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select("id, email, createdAt")
      .single()
    
    if (dbError) {
      console.error("Database Error:", dbError)
      
      // Attempt to clean up auth user if db creation fails
      await supabase.auth.admin.deleteUser(userId)
      
      return NextResponse.json({ 
        success: false, 
        message: "Failed to create user profile" 
      }, { status: 500 })
    }
    
    // Also create settings for the user
    const { error: settingsError } = await supabase
      .from("UserSettings")
      .insert({
        userId,
        theme: "dark",
        language: "en",
        notifications: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    
    if (settingsError) {
      console.error("Settings Error:", settingsError)
      // Non-critical error, continue
    }
    
    // Return success response with sanitized user data
    return NextResponse.json({ 
      success: true, 
      message: "User registered successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error("Registration Error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Internal server error" 
    }, { status: 500 })
  }
} 