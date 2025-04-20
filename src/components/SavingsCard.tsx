"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, PiggyBank } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface SavingsCardProps {
  balance: number
  onAddSavings?: () => void
}

export default function SavingsCard({ balance, onAddSavings }: SavingsCardProps) {
  return (
    <motion.div
      className="relative h-56 w-full rounded-xl overflow-hidden shadow-[0_0_15px_rgba(255,0,255,0.5)]"
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Glass-like card background */}
      <div className="absolute inset-0 backdrop-blur-md before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-br before:from-pink-500/20 before:to-purple-600/30 before:opacity-70 before:-z-10">
        {/* Card content */}
        <div className="h-full w-full p-6 flex flex-col justify-between">
          {/* Card title and icon */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-pink-400 to-pink-600">
                Virtual Savings
              </h3>
              <p className="text-xs text-white/80">
                Track your financial goals
              </p>
            </div>
            <div className="rounded-full bg-pink-500/20 p-2">
              <PiggyBank className="h-6 w-6 text-pink-400" />
            </div>
          </div>
          
          {/* Balance */}
          <div className="mt-4">
            <p className="text-xs text-white/60 mb-1">Current Balance</p>
            <p className="text-3xl font-bold text-white">{formatCurrency(balance)}</p>
          </div>
          
          {/* Card details */}
          <div className="flex justify-between items-end">
            <p className="text-sm text-white/60">VIRTUAL SAVINGS</p>
            <p className="text-white/60 text-sm tracking-wider">♾️</p>
          </div>
          
          {/* Add to savings button */}
          {onAddSavings && (
            <Button 
              onClick={onAddSavings} 
              variant="outline" 
              className="mt-4 w-full border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 text-white hover:text-white"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add to Savings
            </Button>
          )}
        </div>
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none"></div>
      
      {/* Neon border */}
      <div className="absolute inset-0 rounded-xl pointer-events-none border border-white/20 glow-pink"></div>
    </motion.div>
  )
} 