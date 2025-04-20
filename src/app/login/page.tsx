"use client"

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[rgba(6,214,64,0.9)] mb-2">BankIT</h1>
          <p className="text-white/80">Sign in to manage your finances</p>
        </div>

        <div className="backdrop-blur-md bg-white/5 rounded-lg p-8 shadow-[0_8px_32px_0_rgba(6,214,64,0.1)] border border-[rgba(6,214,64,0.18)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/50 text-red-500">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-md bg-white/10 border-[rgba(6,214,64,0.3)] text-white placeholder-white/50 focus:border-[rgba(6,214,64,0.5)] focus:ring-[rgba(6,214,64,0.5)]"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-md bg-white/10 border-[rgba(6,214,64,0.3)] text-white placeholder-white/50 focus:border-[rgba(6,214,64,0.5)] focus:ring-[rgba(6,214,64,0.5)]"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[rgba(6,214,64,0.2)] text-white py-2 px-4 rounded-md hover:bg-[rgba(6,214,64,0.3)] focus:outline-none focus:ring-2 focus:ring-[rgba(6,214,64,0.5)] focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="text-center text-sm text-white/60">
              Don't have an account?{' '}
              <Link href="/register" className="text-[rgba(6,214,64,0.9)] hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 