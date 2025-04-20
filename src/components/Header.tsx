"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { User, Settings, LogOut, Sun, Moon } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push('/login')
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-black/5 border-b border-[rgba(6,214,64,0.1)]">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-[rgba(6,214,64,0.9)]">
            BankIT
          </Link>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-[rgba(6,214,64,0.1)] transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-[rgba(6,214,64,0.9)]" />
              ) : (
                <Moon className="w-5 h-5 text-[rgba(6,214,64,0.9)]" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full hover:bg-[rgba(6,214,64,0.1)] transition-colors"
              >
                <User className="w-5 h-5 text-[rgba(6,214,64,0.9)]" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg backdrop-blur-md bg-black/50 border border-[rgba(6,214,64,0.1)] ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <div className="px-4 py-2 text-sm text-white/60 border-b border-[rgba(6,214,64,0.1)]">
                      Signed in as<br />
                      <span className="font-medium text-white">{session?.user?.email}</span>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-white hover:bg-[rgba(6,214,64,0.1)] transition-colors"
                      role="menuitem"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-[rgba(6,214,64,0.1)] transition-colors"
                      role="menuitem"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 