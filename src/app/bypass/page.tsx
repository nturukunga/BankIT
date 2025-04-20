"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

// This is an emergency bypass page for troubleshooting authentication issues
export default function BypassPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Emergency bypass for troubleshooting - should be disabled in production
  const handleBypass = async () => {
    // Simple password to prevent casual access
    if (password !== "bankit-admin") {
      setError("Invalid access code");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Try to sign in with the test account
      const result = await signIn("credentials", {
        email: "test@bankit.com",
        password: "Test1234!",
        redirect: false,
      });
      
      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push("/dashboard?bypass=true");
      }
    } catch (err) {
      setError("Authentication error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="bg-slate-900 p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6">Emergency Access</h1>
        <p className="text-gray-400 mb-6">This page is for troubleshooting purposes only. Unauthorized access is prohibited.</p>
        
        <div className="space-y-4">
          <div>
            <Input
              type="password"
              placeholder="Access Code"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
            />
            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          </div>
          
          <Button 
            onClick={handleBypass} 
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Emergency Access
          </Button>
          
          <div className="pt-4 border-t border-slate-800">
            <Button
              variant="ghost"
              className="w-full text-gray-400"
              onClick={() => router.push("/auth")}
            >
              Return to Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 