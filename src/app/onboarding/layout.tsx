"use client"

import { ThemeProvider } from "@/providers/ThemeProvider"
import { Toaster as UIToaster } from "@/components/ui/toaster"

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* No SiteHeader included, making the onboarding clean */}
      {children}
      <UIToaster />
    </>
  );
} 