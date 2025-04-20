"use client"

import { cn } from "@/lib/utils"

interface LoadingProps {
  variant?: "default" | "spinner" | "dots"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function Loading({ variant = "default", size = "md", className }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  if (variant === "spinner") {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-current border-t-transparent text-emerald-500",
            sizeClasses[size]
          )}
        />
      </div>
    )
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center space-x-2", className)}>
        <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s]" />
        <div className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" />
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative">
        <div className={cn("animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75", sizeClasses[size])} />
        <div className={cn("relative inline-flex rounded-full h-full w-full bg-emerald-500", sizeClasses[size])} />
      </div>
    </div>
  )
} 