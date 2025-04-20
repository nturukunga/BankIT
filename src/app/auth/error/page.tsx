"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

const errorMessages = {
  default: {
    title: "Authentication Error",
    message: "An error occurred during authentication. Please try again.",
  },
  Configuration: {
    title: "Server Error",
    message: "There is a problem with the server configuration. Please contact support.",
  },
  AccessDenied: {
    title: "Access Denied",
    message: "You do not have permission to sign in. Please contact support if you believe this is an error.",
  },
  Verification: {
    title: "Verification Required",
    message: "The verification link was invalid or has expired. Please try to sign in again to receive a new link.",
  },
  OAuthSignin: {
    title: "OAuth Error",
    message: "Error occurred while signing in with OAuth provider. Please try again.",
  },
  OAuthCallback: {
    title: "OAuth Error",
    message: "Error occurred while processing the OAuth callback. Please try again.",
  },
  OAuthCreateAccount: {
    title: "Account Creation Failed",
    message: "Could not create account with OAuth provider. Please try a different method.",
  },
  EmailCreateAccount: {
    title: "Account Creation Failed",
    message: "Could not create account with email. Please try a different method or contact support.",
  },
  Callback: {
    title: "Callback Error",
    message: "Error occurred during authentication callback. Please try again.",
  },
  OAuthAccountNotLinked: {
    title: "Account Not Linked",
    message: "This email is already associated with another account. Please sign in with the correct provider.",
  },
  EmailSignin: {
    title: "Email Sign In Failed",
    message: "The email sign in link is invalid or has expired. Please try again.",
  },
  SessionRequired: {
    title: "Session Expired",
    message: "Please sign in to continue.",
  },
  InvalidCredentials: {
    title: "Invalid Credentials",
    message: "The email or password you entered is incorrect. Please try again.",
  },
}

export default function AuthError({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const router = useRouter()
  const error = searchParams?.error
  const { title, message } = errorMessages[error as keyof typeof errorMessages] || errorMessages.default

  useEffect(() => {
    // Log the error for debugging
    if (error) {
      console.error("Auth error:", error)
    }
  }, [error])

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center space-y-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex gap-4">
            <Button asChild variant="default">
              <Link href="/auth">Try Again</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Go Home</Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
} 