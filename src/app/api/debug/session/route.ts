import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

// This route returns debug information about the current session
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Create a safe version of the session for display
    const safeSession = {
      authenticated: !!session,
      expires: session?.expires,
      user: session?.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        hasImage: !!session.user.image
      } : null,
      serverTime: new Date().toISOString(),
      tokenInfo: {
        present: !!session,
        validUntil: session?.expires
      }
    };
    
    return NextResponse.json({
      status: "success",
      message: "Session debug information",
      session: safeSession
    });
  } catch (error) {
    console.error("Error in session debug route:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to retrieve session information",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 