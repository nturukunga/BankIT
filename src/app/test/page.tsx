"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TestPage() {
  const { data: session, status } = useSession();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchDebugData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/debug/session");
        const data = await response.json();
        setDebugData(data);
      } catch (error) {
        console.error("Error fetching debug data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDebugData();
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 p-4">
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-white mb-4">Authentication Test Page</h1>
        
        <div className="mb-6 p-4 bg-slate-700 rounded-md">
          <h2 className="text-xl text-white mb-2">Client Session Status</h2>
          <p className="text-green-400 mb-2">Status: <span className="font-mono">{status}</span></p>
          {status === "authenticated" ? (
            <div className="bg-slate-600 p-2 rounded-md overflow-auto">
              <pre className="text-xs text-white whitespace-pre-wrap">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-yellow-400">Not authenticated</p>
          )}
        </div>
        
        <div className="mb-6 p-4 bg-slate-700 rounded-md">
          <h2 className="text-xl text-white mb-2">Server Session Data</h2>
          {loading ? (
            <p className="text-blue-400">Loading...</p>
          ) : debugData ? (
            <div className="bg-slate-600 p-2 rounded-md overflow-auto">
              <pre className="text-xs text-white whitespace-pre-wrap">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-red-400">Failed to load debug data</p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/auth">Go to Auth Page</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  );
} 