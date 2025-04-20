import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { ensureUuid } from "@/lib/utils";

// Validation schema for login
const LoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: Request) {
  try {
    // Parse and validate the request body
    const body = await req.json();
    const validationResult = LoginSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Invalid input data", 
          errors: validationResult.error.flatten() 
        },
        { status: 400 }
      );
    }
    
    const { email, password } = validationResult.data;
    
    console.log("Login attempt for:", email);
    
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error("Supabase auth login error:", error);
      return NextResponse.json(
        { success: false, message: error.message || "Invalid login credentials" },
        { status: 401 }
      );
    }
    
    if (!data.user) {
      return NextResponse.json(
        { success: false, message: "Invalid login credentials" },
        { status: 401 }
      );
    }
    
    // Fetch user from database
    const userId = ensureUuid(data.user.id);
    
    const { data: user, error: dbError } = await supabase
      .from("User")
      .select("*")
      .eq("id", userId)
      .single();
      
    if (dbError) {
      console.error("Error fetching user:", dbError);
      
      // Create user in our database if it doesn't exist
      const { data: createdUser, error: createError } = await supabase
        .from("User")
        .insert({
          id: userId,
          email: data.user.email!,
          name: data.user.user_metadata?.name || data.user.email!.split('@')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { success: false, message: "Failed to retrieve or create user profile" },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: "Login successful - created user profile",
        user: createdUser,
        session: data.session,
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Login successful",
      user,
      session: data.session,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An error occurred during login" },
      { status: 500 }
    );
  }
} 