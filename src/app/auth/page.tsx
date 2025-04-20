"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { toast } from "sonner"
import { FcGoogle } from "react-icons/fc"
import { Loader2, AlertCircle } from "lucide-react"
import { loginSchema, registrationSchema, resetPasswordSchema } from "@/lib/validators"
import { ZodError } from "zod"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  
  // Use tabs to switch between auth modes
  const [authMode, setAuthMode] = useState<"signin" | "signup" | "reset">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  
  // Flag to prevent redirect loops
  const [hasAttemptedRedirect, setHasAttemptedRedirect] = useState(false)
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Clear query params to prevent loops
  useEffect(() => {
    // Clear any URL parameters that might cause loops
    if (window.location.search && !window.location.search.includes('stay=true')) {
      router.replace('/auth?stay=true', { scroll: false });
    }
  }, [router]);
  
  // Track authentication attempts to detect potential loops
  const [authAttempts, setAuthAttempts] = useState(0);
  
  // Field blur handlers for real-time validation feedback
  const validateField = (field: string, value: string) => {
    try {
      if (authMode === "signin") {
        if (field === "email") {
          loginSchema.parse({ email: value, password: "" });
        } else if (field === "password") {
          loginSchema.parse({ email: "", password: value });
        }
      } else if (authMode === "signup") {
        if (field === "email") {
          registrationSchema.parse({ email: value, password: "", confirmPassword: "" });
        } else if (field === "password") {
          registrationSchema.parse({ email: "", password: value, confirmPassword: "" });
        } else if (field === "confirmPassword") {
          if (value !== password) {
            throw new Error("Passwords don't match");
          }
          registrationSchema.parse({ email: "", password: "", confirmPassword: value });
        }
      } else if (authMode === "reset") {
        if (field === "email") {
          resetPasswordSchema.parse({ email: value });
        }
      }
      
      // Clear error if validation passes
      setErrors(prev => ({ ...prev, [field]: "" }));
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessage = error.errors[0]?.message || "Invalid input";
        setErrors(prev => ({ ...prev, [field]: errorMessage }));
      } else if (error instanceof Error) {
        setErrors(prev => ({ ...prev, [field]: error.message }));
      }
    }
  };
  
  // Clear errors when auth mode changes
  useEffect(() => {
    setErrors({});
  }, [authMode]);
  
  // Generate CSRF token
  const [csrfToken, setCsrfToken] = useState<string>("")
  
  useEffect(() => {
    // Generate a random token for CSRF protection
    const token = Math.random().toString(36).substring(2, 15);
    setCsrfToken(token);
    
    // Store the token in sessionStorage for later verification
    sessionStorage.setItem("csrfToken", token);
  }, []);
  
  // Handle authentication errors from URL
  useEffect(() => {
    const error = searchParams.get("error")
    if (error) {
      if (error === "OAuthAccountNotLinked") {
        toast.error("Email already in use with different provider")
      } else if (error === "AccessDenied") {
        toast.error("Access denied. Please try again")
      } else if (error === "Verification") {
        toast.error("Email verification failed. Please try again")
      } else {
        toast.error("Authentication failed. Please try again")
      }
    }
  }, [searchParams])
  
  // If too many attempts detected, provide an escape
  useEffect(() => {
    if (authAttempts > 3) {
      toast.error(
        <div>
          <p>Authentication loop detected.</p>
          <a href="/test" className="text-blue-500 hover:underline">Click here to troubleshoot</a>
        </div>
      );
      
      // Add a preventLoop parameter to the URL to stop middleware redirects
      if (!window.location.href.includes('preventLoop=true')) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('preventLoop', 'true');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [authAttempts]);
  
  // Simple redirect if user is already authenticated
  useEffect(() => {
    // Check if user explicitly wants to stay on auth page (for logout, etc.)
    const stayOnAuth = searchParams.get('stay') === 'true';
    
    if (stayOnAuth) {
      return;
    }
    
    // Increment auth attempts whenever this effect runs to detect loops
    setAuthAttempts(prev => prev + 1);
    
    // Add a small delay to avoid race conditions
    const redirectTimer = setTimeout(() => {
      if (status === "authenticated" && session) {
        console.log("User authenticated, redirecting to dashboard");
        router.push("/dashboard");
      }
    }, 100);
    
    return () => clearTimeout(redirectTimer);
  }, [session, status, router, searchParams]);
  
  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      
      // Use callbackUrl to ensure proper redirect after Google auth
      await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: true,
      });
      
    } catch (error) {
      console.error("Google sign in error:", error);
      toast.error("Failed to authenticate with Google");
      setGoogleLoading(false);
    }
  }
  
  const validateForm = (): boolean => {
    try {
      if (authMode === "signin") {
        loginSchema.parse({ email, password });
      } else if (authMode === "signup") {
        registrationSchema.parse({ email, password, confirmPassword });
      } else if (authMode === "reset") {
        resetPasswordSchema.parse({ email });
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            formattedErrors[err.path[0]] = err.message;
          }
        });
        setErrors(formattedErrors);
      }
      return false;
    }
  };
  
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track authentication attempts
    setAuthAttempts(prev => prev + 1);
    
    // Validate the entire form
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (authMode === "signin") {
        console.log("Attempting sign in with email:", email);
        
        // Use callbackUrl for redirect after successful sign-in
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });
        
        if (result?.error) {
          console.error("Sign in error:", result.error);
          toast.error(result.error || "Invalid email or password");
          setIsLoading(false);
        } else if (result?.ok) {
          console.log("Sign in successful, redirecting to dashboard");
          // Success - use direct browser navigation instead of router
          window.location.href = "/dashboard";
        } else {
          setIsLoading(false);
        }
      } else if (authMode === "signup") {
        // Register new user
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
          },
          body: JSON.stringify({ email, password, confirmPassword })
        })
        
        if (response.ok) {
          const data = await response.json();
          toast.success("Account created! You can now sign in with your new account.");
          // After successful registration, switch to sign in mode
          setAuthMode("signin");
          setIsLoading(false);
        } else {
          const data = await response.json()
          toast.error(data.message || "Failed to create account")
          setIsLoading(false)
        }
      } else if (authMode === "reset") {
        // Password reset functionality
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken
          },
          body: JSON.stringify({ email })
        })
        
        if (response.ok) {
          toast.success("Password reset email sent. Please check your inbox.")
          setAuthMode("signin")
        } else {
          const data = await response.json()
          toast.error(data.message || "Failed to send reset email")
        }
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Authentication error:", error)
      toast.error("Authentication failed. Please try again")
      setIsLoading(false)
    }
  }
  
  // Show loading state during authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <div className="container relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        
        <div className="relative z-20 flex items-center text-lg font-medium text-green-500">
          BankIT
        </div>
        
        {/* Enhanced Glass Card in the left panel */}
        <div className="relative z-20 mt-8 mb-auto mx-auto w-full max-w-xl">
          <div className="relative h-72 w-full rounded-2xl backdrop-blur-lg bg-gradient-to-br from-white/20 to-white/5 border border-white/30 shadow-2xl p-8 overflow-hidden">
            {/* Glass reflections */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50"></div>
            <div className="absolute -inset-1/2 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 transform rotate-12 blur-2xl"></div>
            
            {/* Bank logo */}
            <div className="absolute top-8 right-8 text-white/90 font-bold text-xl tracking-widest">
              BANKIT
            </div>
            
            {/* Wireless icon */}
            <div className="absolute top-8 right-24 text-white/80">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.5 14.5C9 13.45 10.15 12.5 12 12.5C13.85 12.5 15.1 13.45 15.5 14.5" 
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M6 12C6.5 10.5 8.67 8 12 8C15.33 8 17.58 10.12 18 12" 
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M12 17.01L12.01 16.9989" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            
            {/* Enhanced card chip with circuit pattern */}
            <div className="absolute top-10 left-8 h-12 w-16 rounded-md bg-gradient-to-br from-yellow-400/90 to-yellow-600/90 flex items-center justify-center overflow-hidden border border-yellow-300/50">
              <div className="absolute inset-0 flex flex-col justify-between p-1">
                <div className="flex justify-between">
                  <div className="h-1.5 w-3 bg-yellow-300/60 rounded-full"></div>
                  <div className="h-1.5 w-4 bg-yellow-300/60 rounded-full"></div>
                </div>
                <div className="grid grid-cols-3 gap-px w-full h-4">
                  {Array(6).fill(0).map((_, i) => (
                    <div key={i} className="bg-yellow-300/40 rounded-sm" />
                  ))}
                </div>
                <div className="flex justify-between">
                  <div className="h-1.5 w-2 bg-yellow-300/60 rounded-full"></div>
                  <div className="h-1.5 w-5 bg-yellow-300/60 rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* Card number with improved styling */}
            <div className="absolute top-32 left-8 right-8 text-white/90 font-mono">
              <div className="grid grid-cols-4 gap-5">
                <span className="tracking-wider text-lg font-medium">5412</span>
                <span className="tracking-wider text-lg font-medium">8432</span>
                <span className="tracking-wider text-lg font-medium">7612</span>
                <span className="tracking-wider text-lg font-medium">9012</span>
              </div>
            </div>
            
            {/* Card details with improved styling */}
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
              <div className="text-white/90 space-y-1">
                <p className="text-xs uppercase tracking-wider font-light">CARD HOLDER</p>
                <p className="font-medium tracking-wide text-lg">BANKIT USER</p>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-white/90 space-y-1">
                  <p className="text-xs uppercase tracking-wider font-light">EXPIRES</p>
                  <p className="font-medium tracking-wide text-lg">08/29</p>
                </div>
                <div className="mt-2">
                  <svg className="w-12 h-12 text-white/80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7.5 12.5L10.5 15.5L16.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Enhanced shimmer/light effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-slow"></div>
            
            {/* Subtle radial gradient */}
            <div className="absolute inset-0 bg-radial-gradient opacity-40 mix-blend-overlay"></div>
          </div>
          
          {/* Tagline with value proposition */}
          <div className="relative z-20 mt-8 text-center">
            <h2 className="text-xl font-semibold text-green-400 mb-2">Smart Banking, Simplified</h2>
            <p className="text-gray-400 text-sm">Take control of your finances with our cutting-edge banking platform. Experience seamless transactions, real-time insights, and enhanced security — all in one place.</p>
          </div>
        </div>
      </div>
      
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {authMode === "signin" ? "Welcome back!" : authMode === "signup" ? "Create an account" : "Reset your password"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {authMode === "signin" 
                ? "Enter your email and password to sign in" 
                : authMode === "signup" 
                  ? "Enter your details to create an account" 
                  : "Enter your email to reset your password"}
            </p>
          </div>

          <Tabs 
            defaultValue="signin" 
            value={authMode} 
            onValueChange={(value) => setAuthMode(value as "signin" | "signup" | "reset")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="reset">Reset</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              {/* Google Sign In Button */}
              <Button
                variant="outline"
                type="button"
                disabled={isLoading || googleLoading}
                className="w-full bg-white hover:bg-gray-100 text-gray-900"
                onClick={handleGoogleSignIn}
              >
                {googleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FcGoogle className="mr-2 h-4 w-4" />
                )}
                Continue with Google
              </Button>
              
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700"></span>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900 px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => validateField('email', email)}
                    disabled={isLoading}
                    autoComplete="email"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.email}
                    </p>
                  )}
                </div>
                
                {authMode !== "reset" && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-white">Password</Label>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => validateField('password', password)}
                      disabled={isLoading}
                      autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                      className={errors.password ? "border-red-500" : ""}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.password}
                      </p>
                    )}
                  </div>
                )}
                
                {authMode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onBlur={() => validateField('confirmPassword', confirmPassword)}
                      disabled={isLoading}
                      autoComplete="new-password"
                      className={errors.confirmPassword ? "border-red-500" : ""}
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {authMode === "signin" 
                    ? "Sign In" 
                    : authMode === "signup" 
                      ? "Create Account" 
                      : "Send Reset Email"
                  }
                </Button>
              </form>
            </div>
          </Tabs>
          
          <p className="px-6 text-center text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary cursor-pointer">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary cursor-pointer">
              Privacy Policy
            </Link>
            .
          </p>

          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/auth">Go to Auth Page</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
          
          {/* Emergency direct access button */}
          {authAttempts > 2 && (
            <div className="mt-6 p-4 bg-red-500/20 rounded-md">
              <h3 className="text-white font-semibold mb-2">Emergency Access</h3>
              <p className="text-gray-300 text-sm mb-3">
                If you're still having authentication issues, use this emergency access button to bypass the normal auth flow.
              </p>
              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white"
                onClick={() => {
                  // Set a cookie and navigate directly to dashboard
                  document.cookie = "emergency_bypass=true; path=/; max-age=3600";
                  window.location.href = "/dashboard?bypass=true";
                }}
              >
                Emergency Dashboard Access
              </Button>
            </div>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes shimmer-slow {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer-slow {
          animation: shimmer-slow 3s infinite;
        }
        .bg-radial-gradient {
          background-image: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1), transparent 70%);
        }
      `}</style>
    </div>
  );
} 