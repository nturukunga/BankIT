"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"
import { 
  LogOut, 
  User, 
  CreditCard, 
  Settings, 
  ChevronDown,
  BarChart2,
  PiggyBank
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function SiteHeader() {
  const { data: session } = useSession()
  const router = useRouter()

  // Handle logout with server-side route
  const handleLogout = async () => {
    try {
      // Clear client storage data
      localStorage.removeItem("onboardingComplete")
      sessionStorage.clear()
      
      // Use the server-side logout route
      window.location.href = "/api/auth/logout"
      
      // Toast won't show due to page navigation, but keeping it if we change to fetch API later
      toast.success("Logged out successfully")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to log out. Please try again.")
    }
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between p-4 bg-black/30 backdrop-blur-md border-b border-white/5">
      <Link href="/dashboard" className="font-bold text-xl text-green-500">
        BankIT
      </Link>
      
      <div className="flex items-center gap-3">
        <ModeToggle />
        
        {session && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2 pl-3 pr-2 hover:bg-white/5 text-white"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={session.user?.image || ""} alt={session.user?.name || "User"} />
                  <AvatarFallback className="bg-green-500 text-xs text-white">
                    {session.user?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium line-clamp-1 max-w-[100px]">
                  {session.user?.name || "User"}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-56 bg-slate-900/90 backdrop-blur-md border-white/10 text-white"
            >
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={() => router.push("/settings")}
                className="cursor-pointer text-gray-300 focus:text-white focus:bg-white/10"
              >
                <User className="mr-2 h-4 w-4 text-green-500" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/cards")}
                className="cursor-pointer text-gray-300 focus:text-white focus:bg-white/10"
              >
                <CreditCard className="mr-2 h-4 w-4 text-green-500" />
                <span>Manage Cards</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/transactions")}
                className="cursor-pointer text-gray-300 focus:text-white focus:bg-white/10"
              >
                <BarChart2 className="mr-2 h-4 w-4 text-green-500" />
                <span>Transactions</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/savings")}
                className="cursor-pointer text-gray-300 focus:text-white focus:bg-white/10"
              >
                <PiggyBank className="mr-2 h-4 w-4 text-pink-500" />
                <span>Savings</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push("/settings")}
                className="cursor-pointer text-gray-300 focus:text-white focus:bg-white/10"
              >
                <Settings className="mr-2 h-4 w-4 text-green-500" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
} 