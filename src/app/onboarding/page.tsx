"use client"

import { useState, useEffect } from "react"
import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowRight, CheckCircle, CreditCard, TrendingUp, ChevronLeft, ChevronRight, AlertCircle, BarChart4 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(25)
  
  // Clear all sessions on component mount
  useEffect(() => {
    // Clear previous session data
    sessionStorage.clear()
    localStorage.removeItem("onboardingComplete")
  }, [])
  
  useEffect(() => {
    const checkSessionValidity = () => {
      // If logged in, terminate session
      if (status === "authenticated") {
        signOut({ redirect: false })
      }
      
      return true
    }
    
    // Calculate progress based on current step
    setProgress((currentStep + 1) * 25)
    
    // Validate session
    checkSessionValidity()
  }, [status, router, currentStep])
  
  const handleGetStarted = () => {
    router.push("/auth")
  }
  
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 p-4">
      {/* Background graph */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline 
            points="0,90 20,70 40,65 60,40 80,35 100,10" 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="1" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="animate-pulse" 
          />
          <polyline 
            points="0,80 30,75 50,60 70,30 100,20" 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <polyline 
            points="0,70 20,65 40,40 60,30 80,15 100,5" 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>
      
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center justify-center space-y-12">
        {/* BankIT Title */}
        <h1 className="text-4xl font-bold tracking-tight text-green-500">BankIT</h1>
        
        {/* Glass-like Card */}
        <div className="relative w-full h-80 rounded-2xl overflow-hidden backdrop-blur-md bg-white/10 border border-white/20 shadow-xl">
          {/* Card Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-white">BankIT APP</h2>
            
            <div className="rounded-full bg-white/10 p-6">
              <CreditCard className="h-12 w-12 text-green-400" />
            </div>
            
            <p className="text-gray-300 max-w-xs">
              Your modern banking solution. Track your finances, manage payments, and stay on top of your money.
            </p>
            
            <Button 
              onClick={handleGetStarted}
              className="bg-green-500 hover:bg-green-600 text-white font-medium px-8 py-2 rounded-md"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          {/* Card Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2.5s infinite;
        }
      `}</style>
    </div>
  )
} 