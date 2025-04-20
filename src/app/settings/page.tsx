'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2, Check, ArrowLeft, User, Mail, Phone, Moon, Bell, CreditCard } from 'lucide-react';
import Link from 'next/link';

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  
  // User profile state
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
  });

  // Fetch user profile on load
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setProfile({
        id: session.user.id as string || '',
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
      });
      
      // Attempt to fetch additional user data from API
      fetchUserProfile();
    } else if (status === 'unauthenticated') {
      router.push('/auth');
    }
  }, [session, status, router]);

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/user/profile');
      
      if (response.ok) {
        const data = await response.json();
        setProfile((prev) => ({
          ...prev,
          ...data.user,
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle theme toggle
  const handleThemeToggle = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle('dark', checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Send update to API
      const response = await fetch('/api/user/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
        }),
      });
      
      if (response.ok) {
        // Update session with new name
        await update({
          ...session,
          user: {
            ...session?.user,
            name: profile.name,
          },
        });
        
        setUpdateSuccess(true);
        toast.success('Profile updated successfully');
        
        // Reset success state after a delay
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-b from-slate-950 to-slate-900">
      {/* Background graph */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline 
            points="0,90 20,70 40,65 60,40 80,35 100,10" 
            fill="none" 
            stroke="#10b981" 
            strokeWidth="1" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>
      
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-green-500">Settings</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Settings */}
          <Card className="p-6 backdrop-blur-md bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <User className="mr-2 h-5 w-5 text-green-500" />
              Profile Settings
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={profile.name}
                  onChange={handleInputChange}
                  className="bg-transparent border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  className="bg-transparent border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={profile.phone || ''}
                  onChange={handleInputChange}
                  className="bg-transparent border-gray-700 text-white"
                />
              </div>
            </div>
          </Card>

          {/* Manage Cards */}
          <Card className="p-6 backdrop-blur-md bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <CreditCard className="mr-2 h-5 w-5 text-green-500" />
              Manage Cards
            </h2>
            <p className="text-gray-400 mb-4">Update or modify your registered cards</p>
            <Button
              type="button"
              onClick={() => router.push('/cards')}
              className="bg-transparent border border-green-500/30 hover:bg-green-500/10 text-white"
            >
              Manage Your Cards
            </Button>
          </Card>

          {/* Preferences */}
          <Card className="p-6 backdrop-blur-md bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Bell className="mr-2 h-5 w-5 text-green-500" />
              Preferences
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-300">Notifications</Label>
                  <p className="text-sm text-gray-400">Receive email notifications about your expenses</p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-gray-300">Dark Mode</Label>
                  <p className="text-sm text-gray-400">Toggle dark mode theme</p>
                </div>
                <Switch
                  checked={darkMode}
                  onCheckedChange={handleThemeToggle}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className={`w-full ${
              updateSuccess ? 'bg-green-600' : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : updateSuccess ? (
              <Check className="mr-2 h-4 w-4" />
            ) : null}
            {updateSuccess ? 'Saved Successfully' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  );
} 