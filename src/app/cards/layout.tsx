"use client"

import { SiteHeader } from "@/components/site-header";

export default function CardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
} 