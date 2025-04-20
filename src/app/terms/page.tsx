"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-6 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
              <p className="text-gray-500 dark:text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="space-y-6 text-sm leading-normal">
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">1. Introduction</h2>
                <p>
                  Welcome to BankIT. These Terms of Service govern your use of our website and services. By accessing or using BankIT, you agree to be bound by these Terms. Please read them carefully.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">2. Definitions</h2>
                <p>
                  "Service" refers to the BankIT website, mobile application, or any related services.
                  "User," "You," and "Your" refer to the individual or entity accessing or using our Service.
                  "Company," "We," "Us," and "Our" refer to BankIT.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">3. Accounts</h2>
                <p>
                  When you create an account with us, you must provide accurate, complete, and current information. You are responsible for safeguarding your account credentials and for any activities that occur under your account.
                </p>
                <p>
                  We reserve the right to suspend or terminate accounts that violate these Terms or are inactive for an extended period.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">4. Financial Services</h2>
                <p>
                  BankIT provides financial management tools and services. We are not a bank or financial institution. Any funds displayed in the application are managed by our partnered financial institutions.
                </p>
                <p>
                  All financial transactions are processed through our licensed financial partners. BankIT is not responsible for any losses or issues that arise from financial transactions.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">5. Security</h2>
                <p>
                  We implement reasonable security measures to protect your personal and financial information. However, no system is completely secure, and we cannot guarantee the absolute security of your data.
                </p>
                <p>
                  You agree to notify us immediately of any unauthorized access to your account or any breach of security.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">6. Data Usage and Privacy</h2>
                <p>
                  Our Privacy Policy, available at {" "}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    BankIT Privacy Policy
                  </Link>
                  , describes how we collect, use, and share your personal information. By using our Service, you consent to our data practices as described in our Privacy Policy.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">7. Intellectual Property</h2>
                <p>
                  All content, features, and functionality of our Service, including text, graphics, logos, icons, and software, are owned by BankIT or its licensors and are protected by intellectual property laws.
                </p>
                <p>
                  You may not modify, reproduce, distribute, or create derivative works based on our Service without our prior written consent.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">8. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by law, BankIT shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or use, arising out of or in connection with your use of our Service.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">9. Changes to Terms</h2>
                <p>
                  We may modify these Terms at any time. We will provide notice of significant changes by posting the new Terms on our website or through in-app notifications. Your continued use of our Service after such modifications constitutes your acceptance of the revised Terms.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">10. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which BankIT is established, without regard to its conflict of law provisions.
                </p>
              </section>
              
              <section className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">11. Contact Us</h2>
                <p>
                  If you have any questions about these Terms, please contact us at support@bankit.com.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 