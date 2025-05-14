import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// In-memory store for rate limiting
// In production, use Redis or another distributed store
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  store: new Map(),
  message: { error: 'Too many requests, please try again later.' }
}

// Simple in-memory rate limiting function
function getRateLimitStatus(ip: string): { limited: boolean, remaining: number } {
  const now = Date.now()
  const windowStart = now - rateLimit.windowMs
  
  // Initialize or get existing record
  if (!rateLimit.store.has(ip)) {
    rateLimit.store.set(ip, [])
  }
  
  // Get requests and filter out old ones
  const requests = rateLimit.store.get(ip) || []
  const recentRequests: number[] = requests.filter((timestamp: number) => timestamp > windowStart)
  
  // Update store with recent requests
  rateLimit.store.set(ip, [...recentRequests, now])
  
  return { 
    limited: recentRequests.length >= rateLimit.max,
    remaining: Math.max(0, rateLimit.max - recentRequests.length)
  }
}

// List of public paths that don't require authentication
const publicPaths = [
  "/",
  "/auth", 
  "/auth/error", 
  "/terms", 
  "/privacy", 
  "/test", 
  "/bypass", 
  "/api/debug/session",
  "/onboarding"
]

// List of paths that should be excluded from middleware processing
const excludedPaths = [
  "/_next",
  "/api/auth",
  "/api/debug",
  "/favicon.ico",
  "/images",
  "/fonts",
]

// List of sensitive routes that need extra protection
const sensitiveRoutes = [
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/user/update"
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get client IP address
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  
  // Check if the path should be excluded from middleware processing
  if (excludedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // CSRF Protection for API routes
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth') && request.method !== 'GET') {
    const csrfToken = request.headers.get('x-csrf-token')
    const expectedToken = request.cookies.get('csrfToken')?.value
    
    // If token is missing or doesn't match, reject the request
    if (!csrfToken || (expectedToken && csrfToken !== expectedToken)) {
      return NextResponse.json(
        { error: 'CSRF token validation failed' },
        { status: 403 }
      )
    }
  }
  
  // Apply stricter rate limiting for sensitive routes
  if (sensitiveRoutes.some(route => pathname.startsWith(route))) {
    const strictRateLimit = getRateLimitStatus(`${ip}-strict`)
    if (strictRateLimit.limited) {
      const response = NextResponse.json(rateLimit.message, { status: 429 })
      response.headers.set('Retry-After', '900') // 15 minutes in seconds
      return response
    }
  }
  
  // Apply general rate limiting
  const rateLimitStatus = getRateLimitStatus(ip)
  if (rateLimitStatus.limited) {
    const response = NextResponse.json(rateLimit.message, { status: 429 })
    response.headers.set('Retry-After', '900') // 15 minutes in seconds
    return response
  }

  // Redirect root to auth page
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  // Check if the path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )

  try {
    // Check for emergency bypass
    const emergencyBypassCookie = request.cookies.get('emergency_bypass')?.value
    const hasEmergencyBypass = 
      request.nextUrl.searchParams.get('bypass') === 'true' ||
      emergencyBypassCookie === 'true'
    
    if (hasEmergencyBypass) {
      console.log("Emergency bypass detected, skipping authentication check")
      return NextResponse.next()
    }

    // Get the token and verify it
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    // Check if token is valid and not expired
    const isValidToken = token && token.exp && (Date.now() < Number(token.exp) * 1000)

    // Redirect to login if accessing a protected route without authentication
    if (!isValidToken && !isPublicPath) {
      console.log(`No valid token found for protected path: ${pathname}. Redirecting to auth.`)
      const url = new URL("/auth", request.url)
      url.searchParams.set("from", pathname)
      return NextResponse.redirect(url)

       // Clear invalid cookies
      const response = NextResponse.redirect(url)
      response.cookies.delete('next-auth.session-token')
       return response
    }

    // Auth page handling - prevent the redirect loop
    if (pathname === "/auth") {
      // Check if the user has a valid token
      if (isValidToken) {
        // Check for a 'stay' parameter which indicates user wants to remain on auth page
        // useful for sign-out and account switching
        const stayOnAuth = request.nextUrl.searchParams.get('stay') === 'true'
        if (stayOnAuth) {
          return NextResponse.next()
        }
        
        // Check if this is coming from a redirect
        const redirectFrom = request.nextUrl.searchParams.get('from')
        
        // Prevent redirect loops with a limit on redirects
        const lastRedirectTime = parseInt(request.cookies.get('last_redirect_time')?.value || '0')
        const now = Date.now()
        
        // If redirected too recently (within 2 seconds), stay on auth page
        if (now - lastRedirectTime < 2000) {
          console.log("Too many redirects in short period, allowing auth page access")
          const response = NextResponse.next()
          response.cookies.delete('last_redirect_time')
          return response
        }
        
        // Check if user has any cards before redirecting to dashboard
        const cardsResponse = await fetch(`${request.url}/api/cards`, {
          headers: {
            cookie: request.headers.get('cookie') || '',
          }
        })
        const cardsData = await cardsResponse.json()
        
        // If no cards, redirect to cards page, otherwise dashboard
        const redirectPath = (!cardsData.cards || cardsData.cards.length === 0) ? "/cards" : "/dashboard"
        console.log(`Valid token on auth page, redirecting to ${redirectPath}`)
        const response = NextResponse.redirect(new URL(redirectPath, request.url))
        response.cookies.set('last_redirect_time', now.toString(), { 
          maxAge: 10, 
          path: '/' 
        })
        return response
      }
    }

    // Add security headers to all responses
    const response = NextResponse.next()
    
    // Security Headers
    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://*.googleusercontent.com;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      block-all-mixed-content;
      upgrade-insecure-requests;
    `

    response.headers.set('Content-Security-Policy', ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim())
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('X-DNS-Prefetch-Control', 'on')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', rateLimit.max.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitStatus.remaining.toString())

    return response
  } catch (error) {
    console.error("Middleware error:", error)
    // Redirect to error page if there's an authentication error
    const url = new URL("/auth/error", request.url)
    url.searchParams.set("error", "default")
    return NextResponse.redirect(url)
  }
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. Excluded paths (/_next, /api/auth, etc.)
     * 2. Files with extensions (.jpg, .png, etc.)
     */
    "/((?!api/auth|_next|favicon.ico|images|fonts).*)",
  ],
} 