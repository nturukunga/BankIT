import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { supabase } from "@/lib/supabase"
import { ensureUuid } from "@/lib/utils"
import { registrationSchema } from "@/lib/validators"
import { z } from "zod"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
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
    
    let authData;

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })
      
      authData = data;

      if (authError) {
        console.error("Supabase Auth Error:", authError)
        return NextResponse.json({ 
          success: false, 
          message: "Failed to create account. Please try again." 
        }, { status: 500 })
      }

      if (!authData?.user) {
        return NextResponse.json({
          success: false,
          message: "No user data returned. Please try again."
        }, { status: 500 })
      }
    } catch (error) {
      console.error("Registration error:", error)
      return NextResponse.json({
        success: false,
        message: "Service temporarily unavailable. Please try again later."
      }, { status: 503 })
    }
    
    if (!authData.user) {
      return NextResponse.json({ 
        success: false, 
        message: "Failed to create user" 
      }, { status: 500 })
    }
    
    const hashedPassword = await hash(password, 12)
    
    const userId = ensureUuid(authData.user.id)
    
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