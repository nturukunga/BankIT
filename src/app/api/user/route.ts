import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ensureUuid } from "@/lib/utils";

// Mark route as dynamic to prevent caching
export const dynamic = 'force-dynamic';

// Define validation schema for user profile updates
const userProfileSchema = z.object({
  name: z.string().optional(),
  image: z.string().url().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to view profile" },
        { status: 401 }
      );
    }
    
    // Get userId and convert to UUID
    const userId = session.user.id || "";
    const uuidUserId = ensureUuid(userId);
    console.log("Session user ID:", userId);
    console.log("Converted UUID for query:", uuidUserId);
    
    // Get user profile from database
    const { data: user, error } = await supabase
      .from("User")
      .select("*")
      .eq("id", uuidUserId)
      .single();
    
    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      user
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to update profile" },
        { status: 401 }
      );
    }
    
    // Get userId and convert to UUID
    const userId = session.user.id || "";
    const uuidUserId = ensureUuid(userId);
    console.log("Session user ID:", userId);
    console.log("Converted UUID for update:", uuidUserId);
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = userProfileSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      
      console.error("Validation error:", errorMessages);
      return NextResponse.json(
        { error: `Invalid input: ${errorMessages}` },
        { status: 400 }
      );
    }
    
    const updates = validationResult.data;
    
    // Add updatedAt field
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    console.log("Updating user profile with data:", updateData);
    
    // Update user profile in database
    const { data: updatedUser, error } = await supabase
      .from("User")
      .update(updateData)
      .eq("id", uuidUserId)
      .select()
      .single();
    
    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json(
        { error: `Failed to update user profile: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Unexpected profile error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
} 