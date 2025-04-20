import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

// Mark as dynamic to prevent caching
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions)
    
    // Create the response for redirecting to auth page
    const response = NextResponse.redirect(new URL('/auth?stay=true', process.env.NEXTAUTH_URL))
    
    // Clear all auth-related cookies
    response.cookies.delete('next-auth.session-token')
    response.cookies.delete('next-auth.csrf-token')
    response.cookies.delete('next-auth.callback-url')
    response.cookies.delete('__Secure-next-auth.session-token')
    response.cookies.delete('__Secure-next-auth.csrf-token')
    response.cookies.delete('__Secure-next-auth.callback-url')
    response.cookies.delete('redirect_count')
    response.cookies.delete('last_redirect_time')
    
    // Clear emergency bypass if it exists
    response.cookies.delete('emergency_bypass')
    
    // Return the response with cleared cookies
    return response
  } catch (error) {
    console.error("Error during logout:", error)
    return NextResponse.redirect(new URL('/auth?error=logout', process.env.NEXTAUTH_URL))
  }
} 