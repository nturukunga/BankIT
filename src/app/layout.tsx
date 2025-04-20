import "./globals.css";
import { Inter } from "next/font/google";
import { NextAuthProvider } from "@/providers/NextAuthProvider"
import { ThemeProvider } from "@/providers/ThemeProvider"
import { Toaster as UIToaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>BankIT - Smart Finance Management</title>
        <meta name="description" content="Track your expenses and manage your finances with ease" />
      </head>
      <body className={inter.className}>
        <NextAuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            themes={['light', 'dark']}
          >
            {/* SiteHeader moved to child layouts */}
            <main>{children}</main>
            <UIToaster />
          </ThemeProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
