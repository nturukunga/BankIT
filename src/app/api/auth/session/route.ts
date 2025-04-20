import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ensureUuid } from "@/lib/utils";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      // No session found
      return NextResponse.json({
        authenticated: false,
        message: "Not authenticated",
        session: null,
        supabaseSession: null,
        user: null
      });
    }
    
    // Get Supabase session status for comparison
    const { data: supabaseData, error: supabaseError } = await supabase.auth.getSession();
    
    // Get user data from the database
    const userId = ensureUuid(session.user.id);
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("*")
      .eq("id", userId)
      .single();
    
    // Return complete session info
    return NextResponse.json({
      authenticated: true,
      message: "Authenticated",
      session: {
        expires: session.expires,
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image
        }
      },
      supabaseSession: {
        valid: !supabaseError && !!supabaseData.session,
        error: supabaseError ? supabaseError.message : null
      },
      user: userError ? null : user,
      dbError: userError ? userError.message : null
    });
  } catch (error: any) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { authenticated: false, message: error.message || "An error occurred checking authentication" },
      { status: 500 }
    );
  }
} 