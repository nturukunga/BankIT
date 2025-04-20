"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface ProfileFormData {
  name: string
  email: string
  currentPassword: string
  newPassword: string
  currency: string
  darkMode: boolean
  emailNotifications: boolean
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [formData, setFormData] = useState<ProfileFormData>({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    currentPassword: '',
    newPassword: '',
    currency: 'USD',
    darkMode: false,
    emailNotifications: true
  })

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[rgba(6,214,64,0.9)] animate-spin" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' })
        // Update the session with new user data
        await update({
          ...session,
          user: {
            ...session?.user,
            name: formData.name,
          },
        })
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Profile Settings</h1>
        
        <div className="backdrop-blur-md bg-white/5 rounded-lg p-6 shadow-[0_8px_32px_0_rgba(6,214,64,0.1)] border border-[rgba(6,214,64,0.18)]">
          {message.text && (
            <div className={`p-4 mb-6 rounded-md ${
              message.type === 'success' 
                ? 'bg-[rgba(6,214,64,0.1)] border border-[rgba(6,214,64,0.3)] text-[rgba(6,214,64,0.9)]'
                : 'bg-red-500/10 border border-red-500/50 text-red-500'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Personal Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md bg-white/10 border-[rgba(6,214,64,0.3)] text-white placeholder-white/50 focus:border-[rgba(6,214,64,0.5)] focus:ring-[rgba(6,214,64,0.5)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-md bg-white/10 border-[rgba(6,214,64,0.3)] text-white placeholder-white/50 focus:border-[rgba(6,214,64,0.5)] focus:ring-[rgba(6,214,64,0.5)]"
                />
              </div>
            </div>

            {/* Password Change */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Change Password</h2>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full rounded-md bg-white/10 border-[rgba(6,214,64,0.3)] text-white placeholder-white/50 focus:border-[rgba(6,214,64,0.5)] focus:ring-[rgba(6,214,64,0.5)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full rounded-md bg-white/10 border-[rgba(6,214,64,0.3)] text-white placeholder-white/50 focus:border-[rgba(6,214,64,0.5)] focus:ring-[rgba(6,214,64,0.5)]"
                />
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white">Preferences</h2>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full rounded-md bg-white/10 border-[rgba(6,214,64,0.3)] text-white placeholder-white/50 focus:border-[rgba(6,214,64,0.5)] focus:ring-[rgba(6,214,64,0.5)]"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="darkMode"
                  checked={formData.darkMode}
                  onChange={(e) => setFormData({ ...formData, darkMode: e.target.checked })}
                  className="rounded border-[rgba(6,214,64,0.3)] bg-white/10 text-[rgba(6,214,64,0.9)] focus:ring-[rgba(6,214,64,0.5)]"
                />
                <label htmlFor="darkMode" className="text-sm font-medium text-white/80">
                  Dark Mode
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={formData.emailNotifications}
                  onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                  className="rounded border-[rgba(6,214,64,0.3)] bg-white/10 text-[rgba(6,214,64,0.9)] focus:ring-[rgba(6,214,64,0.5)]"
                />
                <label htmlFor="emailNotifications" className="text-sm font-medium text-white/80">
                  Email Notifications
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[rgba(6,214,64,0.2)] text-white py-2 px-4 rounded-md hover:bg-[rgba(6,214,64,0.3)] focus:outline-none focus:ring-2 focus:ring-[rgba(6,214,64,0.5)] focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 