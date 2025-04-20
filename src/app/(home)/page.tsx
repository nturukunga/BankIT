"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4">
      <div className="text-center">
        <h1 className="mb-6 text-6xl font-bold text-emerald-500">BankIT</h1>
        <p className="mb-8 text-lg text-gray-400">
          Your personal finance companion
        </p>
        <Link href="/auth" passHref>
          <Button
            className="bg-emerald-500 px-8 py-6 text-lg hover:bg-emerald-600"
          >
            Get Started
          </Button>
        </Link>
      </div>
    </div>
  )
} 