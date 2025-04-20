import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import crypto from "crypto";

// Mark route as dynamic
export const dynamic = 'force-dynamic';

// Create a map to store old ID to new UUID mapping
const idMapping = new Map<string, string>();

export async function GET() {
  try {
    // Step 1: Get all users with nanoid format IDs
    const { data: users, error: fetchError } = await supabase
      .from("User")
      .select("*");

    if (fetchError) {
      console.error("Error fetching users:", fetchError);
      throw fetchError;
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        message: "No users found to migrate",
        status: "success",
      });
    }

    // Step 2: Create proper UUIDs for users
    const migratedUsers = [];
    const failedUsers = [];

    for (const user of users) {
      try {
        // Check if ID is not already a UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user.id);
        
        if (!isUUID) {
          // Generate new UUID
          const newUuid = crypto.randomUUID();
          idMapping.set(user.id, newUuid);
          
          // Update user with new UUID
          const { data: updatedUser, error: updateError } = await supabase
            .from("User")
            .update({ id: newUuid })
            .eq("email", user.email)
            .select();
            
          if (updateError) {
            console.error(`Error updating user ${user.email}:`, updateError);
            failedUsers.push({ 
              email: user.email, 
              oldId: user.id, 
              error: updateError.message 
            });
            continue;
          }
          
          // Update cards with new user_id
          const { error: cardsError } = await supabase
            .from("cards")
            .update({ user_id: newUuid })
            .eq("user_id", user.id);
            
          if (cardsError) {
            console.error(`Error updating cards for user ${user.email}:`, cardsError);
          }
          
          // Update transactions with new user_id
          const { error: transactionsError } = await supabase
            .from("transactions")
            .update({ user_id: newUuid })
            .eq("user_id", user.id);
            
          if (transactionsError) {
            console.error(`Error updating transactions for user ${user.email}:`, transactionsError);
          }
          
          migratedUsers.push({
            email: user.email,
            oldId: user.id,
            newId: newUuid
          });
        } else {
          // Already a UUID, no need to migrate
          migratedUsers.push({
            email: user.email,
            id: user.id,
            status: "already_uuid"
          });
        }
      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        failedUsers.push({
          email: user.email,
          error: userError instanceof Error ? userError.message : "Unknown error"
        });
      }
    }

    return NextResponse.json({
      message: "User migration completed",
      status: "success",
      migrated: migratedUsers.length,
      failed: failedUsers.length,
      users: migratedUsers,
      failures: failedUsers
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json({
      message: "Error during migration",
      error: error instanceof Error ? error.message : "Unknown error",
      status: "error"
    }, { status: 500 });
  }
} 