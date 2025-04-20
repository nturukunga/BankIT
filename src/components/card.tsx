"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"
import { formatCurrency } from '@/lib/utils'

interface CardProps {
  type: 'credit' | 'debit'
  number: string
  name: string
  expiry: string
  balance: number
  className?: string
}

export function Card({ type, number, name, expiry, balance, className }: CardProps) {
  // Format the card number to show only last 4 digits
  const formattedNumber = `•••• •••• •••• ${number.slice(-4)}`
  
  // Determine if balance is negative
  const isNegative = balance < 0
  
  return (
    <motion.div
      className={cn(
        "relative h-56 w-full rounded-xl overflow-hidden transition-all duration-300 cursor-pointer",
        "group-hover:shadow-2xl",
        isNegative 
          ? "shadow-[0_0_15px_rgba(255,0,0,0.5)]" 
          : "shadow-[0_0_15px_rgba(6,214,64,0.5)]",
        className
      )}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Glass-like card background */}
      <div className={cn(
        "absolute inset-0 backdrop-blur-md",
        "before:absolute before:inset-0 before:rounded-xl before:opacity-70 before:-z-10",
        isNegative 
          ? "before:bg-gradient-to-br before:from-red-500/20 before:to-red-700/30" 
          : "before:bg-gradient-to-br before:from-green-500/20 before:to-green-700/30"
      )}>
        {/* Card content */}
        <div className="h-full w-full p-6 flex flex-col justify-between">
          {/* Card type and chip */}
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="h-10 w-14 rounded-md bg-yellow-400/70 flex items-center justify-center overflow-hidden">
                <div className="grid grid-cols-3 gap-px w-full h-full p-1">
                  {Array(12).fill(0).map((_, i) => (
                    <div key={i} className="bg-yellow-600/50 rounded-sm" />
                  ))}
                </div>
              </div>
              <span className="ml-2 text-xs font-semibold uppercase text-white/90">
                {type}
              </span>
            </div>
            <div className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              isNegative 
                ? "bg-red-500/20 text-red-400" 
                : "bg-green-500/20 text-green-400"
            )}>
              {formatCurrency(balance)}
            </div>
          </div>
          
          {/* Card number */}
          <div className="mt-4">
            <p className="text-xs text-white/60 mb-1">Card Number</p>
            <p className="font-mono text-white tracking-wider">{formattedNumber}</p>
          </div>
          
          {/* Card holder and expiry */}
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-white/60">Card Holder</p>
              <p className="text-white font-medium">{name}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Expires</p>
              <p className="text-white font-medium">{expiry}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none"></div>
      
      {/* Neon border */}
      <div className={cn(
        "absolute inset-0 rounded-xl pointer-events-none",
        "border border-white/20",
        isNegative
          ? "glow-red" 
          : "glow-green"
      )}></div>
    </motion.div>
  )
}

// Add styles to _app.tsx or in a global CSS file:
// .glow-red {
//   box-shadow: 0 0 10px rgba(255,0,0,0.5), 0 0 20px rgba(255,0,0,0.2), inset 0 0 5px rgba(255,0,0,0.1);
// }
// .glow-green {
//   box-shadow: 0 0 10px rgba(6,214,64,0.5), 0 0 20px rgba(6,214,64,0.2), inset 0 0 5px rgba(6,214,64,0.1);
// }
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shimmer {
//   animation: shimmer 2.5s infinite;
// } 